"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { BATTLE_PASS_EXP_PER_TIER } from "@/lib/constants";

export async function addBattlePassExp(userId: string, amount: number) {
  const season = await prisma.battlePassSeason.findFirst({
    where: { isActive: true },
  });
  if (!season) return null;

  const progress = await prisma.battlePassProgress.upsert({
    where: { userId_seasonId: { userId, seasonId: season.id } },
    create: { userId, seasonId: season.id, currentExp: amount, currentTier: 0 },
    update: { currentExp: { increment: amount } },
  });

  let { currentExp, currentTier } = progress;
  while (currentTier < season.maxTier) {
    const needed = (currentTier + 1) * BATTLE_PASS_EXP_PER_TIER;
    if (currentExp < needed) break;
    currentExp -= needed;
    currentTier++;
  }

  await prisma.battlePassProgress.update({
    where: { id: progress.id },
    data: { currentExp, currentTier },
  });

  return { currentTier, currentExp, seasonId: season.id };
}

export async function getBattlePassData() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);

  const season = await prisma.battlePassSeason.findFirst({
    where: { isActive: true },
    include: {
      rewards: { include: { item: true }, orderBy: { tier: "asc" } },
    },
  });
  if (!season) return { season: null, progress: null, rewards: [] };

  const progress = await prisma.battlePassProgress.findUnique({
    where: { userId_seasonId: { userId: authUser.id, seasonId: season.id } },
  });

  const claims = await prisma.battlePassClaim.findMany({
    where: { userId: authUser.id, seasonId: season.id },
  });
  const claimSet = new Set(claims.map((c) => `${c.tier}-${c.isPremium}`));

  return {
    season: {
      id: season.id,
      name: season.name,
      maxTier: season.maxTier,
      endDate: season.endDate.toISOString(),
    },
    progress: progress ?? { currentTier: 0, currentExp: 0, isPremium: false },
    rewards: season.rewards.map((r) => ({
      tier: r.tier,
      isPremium: r.isPremium,
      item: { id: r.item.id, name: r.item.name, spriteKey: r.item.spriteKey },
      expRequired: r.expRequired,
      claimable: (progress?.currentTier ?? 0) >= r.tier,
      claimed: claimSet.has(`${r.tier}-${r.isPremium}`),
    })),
  };
}

export async function claimBattlePassReward(tier: number, isPremium: boolean) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const season = await prisma.battlePassSeason.findFirst({ where: { isActive: true } });
  if (!season) return { success: false, error: "NO_SEASON" };

  const progress = await prisma.battlePassProgress.findUnique({
    where: { userId_seasonId: { userId: authUser.id, seasonId: season.id } },
  });
  if (!progress || progress.currentTier < tier) {
    return { success: false, error: "TIER_NOT_REACHED" };
  }
  if (isPremium && !progress.isPremium) {
    return { success: false, error: "PREMIUM_REQUIRED" };
  }

  const existing = await prisma.battlePassClaim.findUnique({
    where: {
      userId_seasonId_tier_isPremium: {
        userId: authUser.id,
        seasonId: season.id,
        tier,
        isPremium,
      },
    },
  });
  if (existing) return { success: false, error: "ALREADY_CLAIMED" };

  const reward = await prisma.battlePassReward.findUnique({
    where: { seasonId_tier_isPremium: { seasonId: season.id, tier, isPremium } },
    include: { item: true },
  });
  if (!reward) return { success: false, error: "REWARD_NOT_FOUND" };

  await prisma.$transaction([
    prisma.battlePassClaim.create({
      data: { userId: authUser.id, seasonId: season.id, tier, isPremium },
    }),
    prisma.inventoryItem.upsert({
      where: { userId_itemId: { userId: authUser.id, itemId: reward.itemId } },
      create: { userId: authUser.id, itemId: reward.itemId },
      update: { quantity: { increment: 1 } },
    }),
  ]);

  revalidatePath("/battle-pass");
  revalidatePath("/inventory");
  return { success: true, item: reward.item };
}

export async function activatePremiumPass() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const profile = await prisma.profile.findUnique({ where: { userId: authUser.id } });
  if (!profile || profile.gems < 500) {
    return { success: false, error: "INSUFFICIENT_GEMS" };
  }

  const season = await prisma.battlePassSeason.findFirst({ where: { isActive: true } });
  if (!season) return { success: false, error: "NO_SEASON" };

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: authUser.id },
      data: { gems: { decrement: 500 } },
    }),
    prisma.battlePassProgress.upsert({
      where: { userId_seasonId: { userId: authUser.id, seasonId: season.id } },
      create: { userId: authUser.id, seasonId: season.id, isPremium: true },
      update: { isPremium: true },
    }),
    prisma.transaction.create({
      data: { userId: authUser.id, type: "BATTLE_PASS", amount: 500 },
    }),
  ]);

  revalidatePath("/battle-pass");
  revalidatePath("/profile");
  return { success: true };
}
