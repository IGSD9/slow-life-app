import { AFFINITY_GAIN } from "./constants";
import { prisma } from "./prisma";

export async function addAffinity(
  userId: string,
  friendId: string,
  amount: number,
  dailyCap: number,
) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
  if (!friendship) return;

  const capped = Math.min(amount, dailyCap);
  await prisma.friendship.update({
    where: { id: friendship.id },
    data: { affinity: { increment: capped } },
  });
}

export async function addAffinityForGift(userId: string, friendId: string) {
  await addAffinity(userId, friendId, AFFINITY_GAIN.GIFT, 30);
}

export async function addAffinityForTrade(userId: string, friendId: string) {
  await addAffinity(userId, friendId, AFFINITY_GAIN.TRADE, 20);
  await addAffinity(friendId, userId, AFFINITY_GAIN.TRADE, 20);
}

export async function addAffinityForOutfitShare(userId: string, friendId: string) {
  await addAffinity(userId, friendId, AFFINITY_GAIN.OUTFIT_SHARE, 25);
}

export async function addAffinityForStamp(userId: string, friendId: string) {
  await addAffinity(userId, friendId, AFFINITY_GAIN.STAMP, 10);
}
