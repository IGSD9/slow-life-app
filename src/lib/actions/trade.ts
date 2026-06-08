"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { areFriends } from "@/lib/actions/friend";
import { addAffinityForTrade } from "@/lib/affinity";
import { trackTradeComplete } from "@/lib/missions";

type Tx = Prisma.TransactionClient;

async function getMe() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);
  return authUser;
}

async function validateInventoryItems(userId: string, ids: string[]) {
  if (ids.length === 0) return { ok: true as const, items: [] };

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: ids } },
    include: { item: true },
  });

  if (items.length !== ids.length) {
    return { ok: false as const, error: "ITEM_NOT_FOUND" };
  }

  for (const inv of items) {
    if (inv.userId !== userId) return { ok: false as const, error: "NOT_OWNER" };
    if (inv.isPlaced) return { ok: false as const, error: "ITEM_PLACED" };
    if (!inv.item.isTradeable) return { ok: false as const, error: "NOT_TRADEABLE" };
  }

  return { ok: true as const, items };
}

async function transferItem(tx: Tx, fromUserId: string, toUserId: string, inventoryItemId: string) {
  const inv = await tx.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    include: { item: true },
  });
  if (!inv || inv.userId !== fromUserId) throw new Error("INVALID_ITEM");

  const existing = await tx.inventoryItem.findUnique({
    where: { userId_itemId: { userId: toUserId, itemId: inv.itemId } },
  });

  if (existing) {
    await tx.inventoryItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: inv.quantity } },
    });
    await tx.inventoryItem.delete({ where: { id: inventoryItemId } });
  } else {
    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { userId: toUserId },
    });
  }
}

export async function getTradeableInventory(targetUserId?: string) {
  const me = await getMe();
  if (!me) return null;

  const userId = targetUserId ?? me.id;
  if (targetUserId && targetUserId !== me.id) {
    const friends = await areFriends(me.id, targetUserId);
    if (!friends) return null;
  }

  const items = await prisma.inventoryItem.findMany({
    where: {
      userId,
      isPlaced: false,
      item: { isTradeable: true },
    },
    include: { item: true },
    orderBy: { acquiredAt: "desc" },
  });

  return items.map((inv) => ({
    id: inv.id,
    quantity: inv.quantity,
    item: {
      id: inv.item.id,
      name: inv.item.name,
      category: inv.item.category,
      spriteKey: inv.item.spriteKey,
      rarity: inv.item.rarity,
    },
  }));
}

export async function proposeTrade(input: {
  receiverId: string;
  proposerItems: string[];
  receiverItems: string[];
}) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };
  if (me.id === input.receiverId) return { success: false, error: "SELF" };

  const friends = await areFriends(me.id, input.receiverId);
  if (!friends) return { success: false, error: "NOT_FRIENDS" };

  if (input.proposerItems.length === 0 && input.receiverItems.length === 0) {
    return { success: false, error: "EMPTY_TRADE" };
  }

  const proposerCheck = await validateInventoryItems(me.id, input.proposerItems);
  if (!proposerCheck.ok) return { success: false, error: proposerCheck.error };

  const receiverCheck = await validateInventoryItems(input.receiverId, input.receiverItems);
  if (!receiverCheck.ok) return { success: false, error: receiverCheck.error };

  const pending = await prisma.tradeSession.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { proposerId: me.id, receiverId: input.receiverId },
        { proposerId: input.receiverId, receiverId: me.id },
      ],
    },
  });
  if (pending) return { success: false, error: "TRADE_PENDING" };

  const session = await prisma.tradeSession.create({
    data: {
      proposerId: me.id,
      receiverId: input.receiverId,
      proposerItems: input.proposerItems,
      receiverItems: input.receiverItems,
      status: "PENDING",
    },
  });

  revalidatePath(`/room/${input.receiverId}`);
  return { success: true, sessionId: session.id };
}

export async function acceptTrade(sessionId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const session = await prisma.tradeSession.findUnique({ where: { id: sessionId } });
  if (!session || session.receiverId !== me.id || session.status !== "PENDING") {
    return { success: false, error: "NOT_FOUND" };
  }

  const proposerItems = session.proposerItems as string[];
  const receiverItems = session.receiverItems as string[];

  const proposerCheck = await validateInventoryItems(session.proposerId, proposerItems);
  if (!proposerCheck.ok) return { success: false, error: proposerCheck.error };

  const receiverCheck = await validateInventoryItems(session.receiverId, receiverItems);
  if (!receiverCheck.ok) return { success: false, error: receiverCheck.error };

  try {
    await prisma.$transaction(async (tx) => {
      for (const id of proposerItems) {
        await transferItem(tx, session.proposerId, session.receiverId, id);
      }
      for (const id of receiverItems) {
        await transferItem(tx, session.receiverId, session.proposerId, id);
      }
      await tx.tradeSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    });
  } catch {
    return { success: false, error: "TRADE_FAILED" };
  }

  await addAffinityForTrade(session.proposerId, session.receiverId);
  await trackTradeComplete(session.proposerId);
  await trackTradeComplete(session.receiverId);

  revalidatePath("/inventory");
  revalidatePath(`/room/${session.proposerId}`);
  return { success: true };
}

export async function cancelTrade(sessionId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const session = await prisma.tradeSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== "PENDING") {
    return { success: false, error: "NOT_FOUND" };
  }
  if (session.proposerId !== me.id && session.receiverId !== me.id) {
    return { success: false, error: "FORBIDDEN" };
  }

  await prisma.tradeSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });

  return { success: true };
}

export async function getPendingTrades() {
  const me = await getMe();
  if (!me) return null;

  const sessions = await prisma.tradeSession.findMany({
    where: {
      status: "PENDING",
      OR: [{ proposerId: me.id }, { receiverId: me.id }],
    },
    orderBy: { createdAt: "desc" },
  });

  const allInvIds = sessions.flatMap((s) => [
    ...(s.proposerItems as string[]),
    ...(s.receiverItems as string[]),
  ]);
  const invItems = await prisma.inventoryItem.findMany({
    where: { id: { in: allInvIds } },
    include: { item: true },
  });
  const invNameMap = new Map(invItems.map((i) => [i.id, i.item.name]));

  const userIds = new Set<string>();
  for (const s of sessions) {
    userIds.add(s.proposerId);
    userIds.add(s.receiverId);
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: [...userIds] } },
  });
  const nameMap = new Map(profiles.map((p) => [p.userId, p.displayName]));

  return sessions.map((s) => {
    const proposerItems = s.proposerItems as string[];
    const receiverItems = s.receiverItems as string[];
    return {
      id: s.id,
      proposerId: s.proposerId,
      receiverId: s.receiverId,
      proposerName: nameMap.get(s.proposerId) ?? "???",
      receiverName: nameMap.get(s.receiverId) ?? "???",
      proposerItems,
      receiverItems,
      proposerItemNames: proposerItems.map((id) => invNameMap.get(id) ?? "?"),
      receiverItemNames: receiverItems.map((id) => invNameMap.get(id) ?? "?"),
      isProposer: s.proposerId === me.id,
      createdAt: s.createdAt.toISOString(),
    };
  });
}
