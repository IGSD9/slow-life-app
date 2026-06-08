"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { calculateLevel, clampExp } from "@/lib/level";
import type { AvatarConfig } from "@/types/avatar";

export async function getProfile() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  await ensureUserSetup(authUser.id, authUser.email);

  return prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      profile: { include: { title: true } },
      room: true,
      inventory: { include: { item: true } },
    },
  });
}

export async function updateProfile(input: {
  displayName?: string;
  avatarConfig?: AvatarConfig;
  showAffinityRank?: boolean;
}) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  await ensureUserSetup(authUser.id, authUser.email);

  if (input.displayName) {
    if (input.displayName.length < 1 || input.displayName.length > 20) {
      return { success: false, error: "INVALID_NAME" };
    }
  }

  if (input.avatarConfig) {
    const ownedItems = await prisma.inventoryItem.findMany({
      where: { userId: authUser.id },
      include: { item: true },
    });
    const ownedIds = new Set(ownedItems.map((i) => i.itemId));
    for (const itemId of Object.values(input.avatarConfig)) {
      if (itemId && !ownedIds.has(itemId)) {
        return { success: false, error: "NOT_OWNER" };
      }
    }
  }

  const profile = await prisma.profile.update({
    where: { userId: authUser.id },
    data: {
      displayName: input.displayName,
      avatarConfig: input.avatarConfig
        ? (input.avatarConfig as unknown as Prisma.InputJsonValue)
        : undefined,
      showAffinityRank: input.showAffinityRank,
    },
  });

  revalidatePath("/avatar");
  revalidatePath("/room");
  return { success: true, profile };
}

export async function grantExp(amount: number) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const profile = await prisma.profile.findUnique({
    where: { userId: authUser.id },
  });
  if (!profile) return { success: false, error: "NO_PROFILE" };

  const oldLevel = profile.level;
  const newExp = clampExp(profile.exp + amount);
  const newLevel = calculateLevel(newExp);

  await prisma.profile.update({
    where: { userId: authUser.id },
    data: { exp: newExp, level: newLevel },
  });

  const rewards = [];
  if (newLevel > oldLevel) {
    for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
      const reward = await prisma.levelReward.findUnique({
        where: { level: lv },
        include: { item: true },
      });
      if (!reward) continue;

      const claimed = await prisma.levelRewardClaim.findUnique({
        where: { userId_level: { userId: authUser.id, level: lv } },
      });
      if (claimed) continue;

      await prisma.inventoryItem.upsert({
        where: { userId_itemId: { userId: authUser.id, itemId: reward.itemId } },
        create: { userId: authUser.id, itemId: reward.itemId },
        update: { quantity: { increment: 1 } },
      });
      await prisma.levelRewardClaim.create({
        data: { userId: authUser.id, level: lv },
      });
      rewards.push(reward.item);
    }
  }

  revalidatePath("/room");
  revalidatePath("/profile");
  return {
    success: true,
    newLevel,
    newExp,
    leveledUp: newLevel > oldLevel,
    rewards,
  };
}
