"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { MARRIAGE_AFFINITY_THRESHOLD, MARRIED_TITLE_ID } from "@/lib/constants";
import { grantTitle } from "@/lib/actions/title";

async function getMe() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);
  return authUser;
}

export async function proposeMarriage(friendId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };
  if (me.id === friendId) return { success: false, error: "SELF" };

  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: me.id, friendId } },
  });
  if (!friendship || friendship.status !== "ACCEPTED") {
    return { success: false, error: "NOT_FRIENDS" };
  }
  if (friendship.isMarried) return { success: false, error: "ALREADY_MARRIED" };
  if (friendship.affinity < MARRIAGE_AFFINITY_THRESHOLD) {
    return { success: false, error: "INSUFFICIENT_AFFINITY" };
  }
  if (friendship.marriageProposalFrom) {
    return { success: false, error: "PROPOSAL_PENDING" };
  }

  const reverse = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: friendId, friendId: me.id } },
  });
  if (reverse?.marriageProposalFrom === friendId) {
    return acceptMarriage(friendId);
  }

  await prisma.friendship.update({
    where: { id: friendship.id },
    data: { marriageProposalFrom: me.id },
  });

  revalidatePath("/friends");
  return { success: true };
}

export async function acceptMarriage(partnerId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const incoming = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: me.id, friendId: partnerId } },
  });
  if (!incoming || incoming.marriageProposalFrom !== partnerId) {
    return { success: false, error: "NO_PROPOSAL" };
  }

  const now = new Date();
  const marriageId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.friendship.update({
      where: { id: incoming.id },
      data: { isMarried: true, marriedAt: now, marriageProposalFrom: null, marriageId },
    });
    await tx.friendship.updateMany({
      where: { userId: partnerId, friendId: me.id },
      data: { isMarried: true, marriedAt: now, marriageProposalFrom: null, marriageId },
    });
    await tx.sharedRoom.create({
      data: { marriageId },
    });
  });

  // 称号を獲得（装備はプロフィールからユーザーが選択）
  await grantTitle(me.id, MARRIED_TITLE_ID);
  await grantTitle(partnerId, MARRIED_TITLE_ID);

  const ring = await prisma.itemMaster.findUnique({ where: { id: "clothing_accessory_ring" } });
  if (ring) {
    for (const uid of [me.id, partnerId]) {
      await prisma.inventoryItem.upsert({
        where: { userId_itemId: { userId: uid, itemId: ring.id } },
        create: { userId: uid, itemId: ring.id },
        update: {},
      });
    }
  }

  revalidatePath("/friends");
  revalidatePath("/profile");
  return { success: true };
}

export async function rejectMarriage(partnerId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  await prisma.friendship.updateMany({
    where: {
      OR: [
        { userId: partnerId, friendId: me.id, marriageProposalFrom: partnerId },
        { userId: me.id, friendId: partnerId, marriageProposalFrom: me.id },
      ],
    },
    data: { marriageProposalFrom: null },
  });

  revalidatePath("/friends");
  return { success: true };
}

export async function getMarriageStatus(friendId: string) {
  const me = await getMe();
  if (!me) return null;

  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: me.id, friendId } },
  });
  if (!friendship) return null;

  return {
    affinity: friendship.affinity,
    isMarried: friendship.isMarried,
    proposalFrom: friendship.marriageProposalFrom,
    canPropose:
      friendship.status === "ACCEPTED" &&
      !friendship.isMarried &&
      friendship.affinity >= MARRIAGE_AFFINITY_THRESHOLD &&
      !friendship.marriageProposalFrom,
    threshold: MARRIAGE_AFFINITY_THRESHOLD,
  };
}
