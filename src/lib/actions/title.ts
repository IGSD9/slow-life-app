"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_TITLE_ID } from "@/lib/constants";

/** 称号を獲得（重複は無視） */
export async function grantTitle(userId: string, titleId: string) {
  if (titleId === ADMIN_TITLE_ID) return false;

  const title = await prisma.title.findUnique({ where: { id: titleId } });
  if (!title) return false;

  await prisma.userTitle.upsert({
    where: { userId_titleId: { userId, titleId } },
    create: { userId, titleId },
    update: {},
  });
  return true;
}

export async function getOwnedTitles(userId: string) {
  const rows = await prisma.userTitle.findMany({
    where: { userId },
    include: { title: true },
    orderBy: { acquiredAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.title.id,
    name: r.title.name,
    description: r.title.description,
  }));
}

/** プロフィールに表示する称号を設定（null で外す） */
export async function setEquippedTitle(userId: string, titleId: string | null) {
  if (titleId) {
    const owned = await prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
    });
    if (!owned) return { success: false as const, error: "NOT_OWNED" };
    if (titleId === ADMIN_TITLE_ID) {
      return { success: false as const, error: "ADMIN_TITLE_BLOCKED" };
    }
  }

  await prisma.profile.update({
    where: { userId },
    data: { titleId },
  });

  revalidatePath("/profile");
  revalidatePath("/room");
  revalidatePath("/friends");
  return { success: true as const };
}
