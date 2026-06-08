import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/level";

const ADMIN_TITLE_ID = "title_admin";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

/** 管理者アカウントに全アイテム付与・フラグ設定 */
export async function syncAdminPrivileges(userId: string, email: string) {
  if (!isAdminEmail(email)) return false;

  const allItems = await prisma.itemMaster.findMany();
  const adminTitle = await prisma.title.findUnique({
    where: { id: ADMIN_TITLE_ID },
  });

  await prisma.profile.update({
    where: { userId },
    data: {
      isAdmin: true,
      ...(adminTitle ? { titleId: ADMIN_TITLE_ID } : {}),
    },
  });

  for (const item of allItems) {
    await prisma.inventoryItem.upsert({
      where: { userId_itemId: { userId, itemId: item.id } },
      create: { userId, itemId: item.id },
      update: {},
    });
  }

  return true;
}

export async function requireAdmin() {
  const { getAuthUser } = await import("@/lib/auth/getUser");
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  if (!isAdminEmail(authUser.email)) return null;
  return authUser;
}

export async function adminSetLevel(userId: string, level: number) {
  const clampedLevel = Math.max(1, Math.min(level, 999_999));
  const exp = clampedLevel * clampedLevel * 100;
  await prisma.profile.update({
    where: { userId },
    data: { level: clampedLevel, exp },
  });
  return { level: clampedLevel, exp };
}

export async function adminGrantExp(userId: string, amount: number) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return null;
  const newExp = Math.min(profile.exp + amount, 999_999);
  const newLevel = calculateLevel(newExp);
  await prisma.profile.update({
    where: { userId },
    data: { exp: newExp, level: newLevel },
  });
  return { level: newLevel, exp: newExp };
}

export async function adminGrantItem(userId: string, itemId: string) {
  const item = await prisma.itemMaster.findUnique({ where: { id: itemId } });
  if (!item) return { success: false, error: "ITEM_NOT_FOUND" };

  await prisma.inventoryItem.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: { userId, itemId },
    update: { quantity: { increment: 1 } },
  });
  return { success: true, item };
}
