"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import type { RoomLayout } from "@/types/room";

async function getMe() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);
  return authUser;
}

export async function getMarriagePartnerId(userId: string): Promise<string | null> {
  const marriage = await prisma.friendship.findFirst({
    where: { userId, isMarried: true, status: "ACCEPTED" },
    select: { friendId: true, marriageId: true },
  });
  return marriage?.friendId ?? null;
}

export async function getSharedRoomAccess() {
  const me = await getMe();
  if (!me) return { success: false as const, error: "UNAUTHORIZED" };

  const marriage = await prisma.friendship.findFirst({
    where: { userId: me.id, isMarried: true, status: "ACCEPTED" },
    select: { marriageId: true, friendId: true },
  });
  if (!marriage) {
    return { success: false as const, error: "NOT_MARRIED" };
  }

  let marriageId = marriage.marriageId;
  if (!marriageId) {
    marriageId = crypto.randomUUID();
    await prisma.$transaction([
      prisma.friendship.updateMany({
        where: {
          OR: [
            { userId: me.id, friendId: marriage.friendId, isMarried: true },
            { userId: marriage.friendId, friendId: me.id, isMarried: true },
          ],
        },
        data: { marriageId },
      }),
      prisma.sharedRoom.upsert({
        where: { marriageId },
        create: { marriageId },
        update: {},
      }),
    ]);
  }

  const partner = await prisma.profile.findUnique({
    where: { userId: marriage.friendId },
    select: { displayName: true, userId: true },
  });

  let sharedRoom = await prisma.sharedRoom.findUnique({
    where: { marriageId },
  });
  if (!sharedRoom) {
    sharedRoom = await prisma.sharedRoom.create({
      data: { marriageId },
    });
  }

  return {
    success: true as const,
    marriageId,
    partnerId: marriage.friendId,
    partnerName: partner?.displayName ?? "パートナー",
    wallpaperId: sharedRoom.wallpaperId,
    floorId: sharedRoom.floorId,
    layoutData: (sharedRoom.layoutData as unknown as RoomLayout) ?? [],
  };
}

export async function saveSharedRoomLayout(input: {
  layoutData: RoomLayout;
  wallpaperId?: string;
  floorId?: string;
}) {
  const me = await getMe();
  if (!me) return { success: false as const, error: "UNAUTHORIZED" };

  const marriage = await prisma.friendship.findFirst({
    where: { userId: me.id, isMarried: true, status: "ACCEPTED" },
    select: { marriageId: true },
  });
  if (!marriage?.marriageId) {
    return { success: false as const, error: "NOT_MARRIED" };
  }

  const updated = await prisma.sharedRoom.upsert({
    where: { marriageId: marriage.marriageId },
    create: {
      marriageId: marriage.marriageId,
      layoutData: input.layoutData as unknown as Prisma.InputJsonValue,
      wallpaperId: input.wallpaperId ?? "wall_default",
      floorId: input.floorId ?? "floor_default",
    },
    update: {
      layoutData: input.layoutData as unknown as Prisma.InputJsonValue,
      ...(input.wallpaperId ? { wallpaperId: input.wallpaperId } : {}),
      ...(input.floorId ? { floorId: input.floorId } : {}),
    },
  });

  revalidatePath("/room/shared");
  return {
    success: true as const,
    layoutData: updated.layoutData as unknown as RoomLayout,
  };
}

export async function getSharedRoomInventory() {
  const me = await getMe();
  if (!me) return { success: false as const, error: "UNAUTHORIZED" };

  const partnerId = await getMarriagePartnerId(me.id);
  if (!partnerId) return { success: false as const, error: "NOT_MARRIED" };

  const userIds = [me.id, partnerId];
  const items = await prisma.inventoryItem.findMany({
    where: {
      userId: { in: userIds },
      item: { category: "FURNITURE" },
      isPlaced: false,
    },
    include: {
      item: {
        select: { id: true, name: true, spriteKey: true, category: true },
      },
    },
  });

  return {
    success: true as const,
    items: items.map((i) => ({
      id: i.id,
      itemId: i.itemId,
      userId: i.userId,
      isPlaced: i.isPlaced,
      isMine: i.userId === me.id,
      item: i.item,
    })),
  };
}

export async function placeSharedRoomFurniture(input: {
  inventoryId: string;
  gridX: number;
  gridY: number;
  rotation?: number;
}) {
  const me = await getMe();
  if (!me) return { success: false as const, error: "UNAUTHORIZED" };

  const partnerId = await getMarriagePartnerId(me.id);
  if (!partnerId) return { success: false as const, error: "NOT_MARRIED" };

  const inv = await prisma.inventoryItem.findUnique({
    where: { id: input.inventoryId },
    include: { item: true },
  });
  if (!inv || inv.isPlaced) return { success: false as const, error: "INVALID_ITEM" };
  if (inv.userId !== me.id && inv.userId !== partnerId) {
    return { success: false as const, error: "FORBIDDEN" };
  }
  if (inv.item.category !== "FURNITURE") {
    return { success: false as const, error: "NOT_FURNITURE" };
  }

  const marriage = await prisma.friendship.findFirst({
    where: { userId: me.id, isMarried: true },
    select: { marriageId: true },
  });
  if (!marriage?.marriageId) return { success: false as const, error: "NOT_MARRIED" };

  const sharedRoom = await prisma.sharedRoom.findUnique({
    where: { marriageId: marriage.marriageId },
  });
  const layout = ((sharedRoom?.layoutData as unknown as RoomLayout) ?? []).slice();

  layout.push({
    inventoryItemId: inv.id,
    itemId: inv.itemId,
    gridX: input.gridX,
    gridY: input.gridY,
    rotation: (input.rotation ?? 0) as 0 | 90 | 180 | 270,
    zIndex: layout.length + 1,
  });

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { id: inv.id },
      data: { isPlaced: true },
    }),
    prisma.sharedRoom.upsert({
      where: { marriageId: marriage.marriageId },
      create: {
        marriageId: marriage.marriageId,
        layoutData: layout as unknown as Prisma.InputJsonValue,
      },
      update: { layoutData: layout as unknown as Prisma.InputJsonValue },
    }),
  ]);

  revalidatePath("/room/shared");
  return { success: true as const, layoutData: layout };
}
