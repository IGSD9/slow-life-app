"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { adminGrantItem, adminSetLevel, adminGrantExp, isAdminEmail, requireAdmin, syncAdminPrivileges } from "@/lib/admin";
import { addAffinityForGift } from "@/lib/affinity";

export async function checkIsAdmin() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { isAdmin: false };
  return { isAdmin: isAdminEmail(authUser.email) };
}

export async function adminPresentItem(input: {
  targetEmail: string;
  itemId: string;
}) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "FORBIDDEN" };

  const target = await prisma.user.findFirst({
    where: { email: { equals: input.targetEmail, mode: "insensitive" } },
  });
  if (!target) return { success: false, error: "USER_NOT_FOUND" };

  const result = await adminGrantItem(target.id, input.itemId);
  if (!result.success) return result;

  await addAffinityForGift(admin.id, target.id);

  revalidatePath("/room");
  revalidatePath("/inventory");
  return { success: true, item: result.item, targetEmail: input.targetEmail };
}

export async function adminPresentLevel(input: {
  targetEmail: string;
  level: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "FORBIDDEN" };

  const target = await prisma.user.findFirst({
    where: { email: { equals: input.targetEmail, mode: "insensitive" } },
  });
  if (!target) return { success: false, error: "USER_NOT_FOUND" };

  const result = await adminSetLevel(target.id, input.level);
  revalidatePath("/room");
  return { success: true, ...result, targetEmail: input.targetEmail };
}

export async function adminPresentExp(input: {
  targetEmail: string;
  amount: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "FORBIDDEN" };

  const target = await prisma.user.findFirst({
    where: { email: { equals: input.targetEmail, mode: "insensitive" } },
  });
  if (!target) return { success: false, error: "USER_NOT_FOUND" };

  const result = await adminGrantExp(target.id, input.amount);
  if (!result) return { success: false, error: "NO_PROFILE" };

  revalidatePath("/room");
  return { success: true, ...result, targetEmail: input.targetEmail };
}

export async function getAdminGiftItems() {
  const admin = await requireAdmin();
  if (!admin) return [];

  return prisma.itemMaster.findMany({ orderBy: { category: "asc" } });
}

export async function adminPresentGems(input: {
  targetEmail: string;
  amount: number;
}) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "FORBIDDEN" };

  const target = await prisma.user.findFirst({
    where: { email: { equals: input.targetEmail, mode: "insensitive" } },
  });
  if (!target) return { success: false, error: "USER_NOT_FOUND" };

  await prisma.profile.update({
    where: { userId: target.id },
    data: { gems: { increment: input.amount } },
  });

  revalidatePath("/profile");
  return { success: true, targetEmail: input.targetEmail };
}

export async function syncCurrentUserAdmin() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return false;
  await ensureUserSetup(authUser.id, authUser.email);
  return syncAdminPrivileges(authUser.id, authUser.email);
}
