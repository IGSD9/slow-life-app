"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";

import { calcIdleGold, MAX_IDLE_MINUTES } from "@/lib/idleRewards";
export async function getIdleRewardStatus() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false as const, error: "UNAUTHORIZED" };

  await ensureUserSetup(authUser.id, authUser.email);

  const profile = await prisma.profile.findUnique({
    where: { userId: authUser.id },
    select: { lastCollectedAt: true, coins: true },
  });
  if (!profile) return { success: false as const, error: "NOT_FOUND" };

  const pendingGold = calcIdleGold(profile.lastCollectedAt);
  return {
    success: true as const,
    pendingGold,
    lastCollectedAt: profile.lastCollectedAt.toISOString(),
    coins: profile.coins,
    maxGold: MAX_IDLE_MINUTES,
  };
}

export async function collectIdleRewards() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false as const, error: "UNAUTHORIZED" };

  await ensureUserSetup(authUser.id, authUser.email);

  const profile = await prisma.profile.findUnique({
    where: { userId: authUser.id },
    select: { id: true, lastCollectedAt: true, coins: true },
  });
  if (!profile) return { success: false as const, error: "NOT_FOUND" };

  const goldGain = calcIdleGold(profile.lastCollectedAt);
  if (goldGain <= 0) {
    return { success: false as const, error: "NOTHING_TO_COLLECT", goldGain: 0 };
  }

  const now = new Date();
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      coins: { increment: goldGain },
      lastCollectedAt: now,
    },
    select: { coins: true },
  });

  revalidatePath("/room");
  revalidatePath("/profile");

  return {
    success: true as const,
    goldGain,
    coins: updated.coins,
    lastCollectedAt: now.toISOString(),
  };
}
