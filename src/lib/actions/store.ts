"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";

export async function getStoreItems() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);

  const profile = await prisma.profile.findUnique({ where: { userId: authUser.id } });
  const items = await prisma.itemMaster.findMany({
    where: { OR: [{ priceCoins: { gt: 0 } }, { priceGems: { gt: 0 } }] },
    orderBy: { rarity: "asc" },
  });

  const owned = await prisma.inventoryItem.findMany({
    where: { userId: authUser.id },
    select: { itemId: true },
  });
  const ownedSet = new Set(owned.map((o) => o.itemId));

  return {
    coins: profile?.coins ?? 0,
    gems: profile?.gems ?? 0,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      spriteKey: item.spriteKey,
      rarity: item.rarity,
      priceCoins: item.priceCoins,
      priceGems: item.priceGems,
      owned: ownedSet.has(item.id),
    })),
  };
}

export async function purchaseItem(itemId: string, currency: "coins" | "gems") {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const item = await prisma.itemMaster.findUnique({ where: { id: itemId } });
  if (!item) return { success: false, error: "NOT_FOUND" };

  const price = currency === "coins" ? item.priceCoins : item.priceGems;
  if (price <= 0) return { success: false, error: "NOT_FOR_SALE" };

  const profile = await prisma.profile.findUnique({ where: { userId: authUser.id } });
  if (!profile) return { success: false, error: "NO_PROFILE" };

  const balance = currency === "coins" ? profile.coins : profile.gems;
  if (balance < price) return { success: false, error: "INSUFFICIENT_FUNDS" };

  await prisma.$transaction([
    prisma.profile.update({
      where: { userId: authUser.id },
      data: currency === "coins"
        ? { coins: { decrement: price } }
        : { gems: { decrement: price } },
    }),
    prisma.inventoryItem.upsert({
      where: { userId_itemId: { userId: authUser.id, itemId } },
      create: { userId: authUser.id, itemId },
      update: { quantity: { increment: 1 } },
    }),
    prisma.transaction.create({
      data: {
        userId: authUser.id,
        type: "PURCHASE_ITEM",
        amount: price,
        itemId,
      },
    }),
  ]);

  revalidatePath("/store");
  revalidatePath("/inventory");
  return { success: true, item };
}

export async function grantGemsFromPurchase(userId: string, gemAmount: number) {
  await prisma.$transaction([
    prisma.profile.update({
      where: { userId },
      data: { gems: { increment: gemAmount } },
    }),
    prisma.transaction.create({
      data: { userId, type: "PURCHASE_GEMS", amount: gemAmount },
    }),
  ]);
}
