"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ensureUserSetup } from "@/lib/auth/getUser";
import { grantExp } from "@/lib/actions/profile";
import { getTodayDateKeyJST, parseMailPayload } from "@/lib/mailbox";
import type { MailPayload } from "@/types/mailbox";

async function buildDailyPayloadFromConfig(): Promise<MailPayload> {
  const configs = await prisma.dailyRewardConfig.findMany({
    where: { isActive: true },
    orderBy: { priority: "asc" },
    include: { item: true },
  });

  const payload: MailPayload = { items: [], coins: 0, gems: 0, exp: 0 };

  for (const cfg of configs) {
    payload.coins += cfg.coins;
    payload.gems += cfg.gems;
    payload.exp += cfg.exp;
    if (cfg.itemId) {
      payload.items.push({
        itemId: cfg.itemId,
        quantity: cfg.itemQty,
        name: cfg.item?.name,
      });
    }
  }

  return payload;
}

/** 本日分のデイリー報酬をメールボックスへ配信（1日1回） */
export async function deliverDailyRewardMail(userId: string) {
  const dateKey = getTodayDateKeyJST();

  const existing = await prisma.dailyRewardLog.findUnique({
    where: { userId_dateKey: { userId, dateKey } },
  });
  if (existing) return { delivered: false as const };

  const payload = await buildDailyPayloadFromConfig();
  const hasReward =
    payload.coins > 0 ||
    payload.gems > 0 ||
    payload.exp > 0 ||
    payload.items.length > 0;

  if (!hasReward) {
    await prisma.dailyRewardLog.create({
      data: { userId, dateKey },
    });
    return { delivered: false as const, reason: "NO_CONFIG" as const };
  }

  const mail = await prisma.mailMessage.create({
    data: {
      userId,
      subject: "デイリー報酬が届きました",
      body: "毎日のログインありがとうございます！報酬をお受け取りください。",
      mailType: "DAILY_REWARD",
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.dailyRewardLog.create({
    data: { userId, dateKey, mailId: mail.id },
  });

  return { delivered: true as const, mailId: mail.id };
}

export async function getMailbox(userId: string) {
  const mails = await prisma.mailMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return mails.map((m) => ({
    id: m.id,
    subject: m.subject,
    body: m.body,
    mailType: m.mailType,
    payload: parseMailPayload(m.payload),
    isRead: m.isRead,
    isClaimed: m.isClaimed,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function getUnclaimedMailCount(userId: string) {
  return prisma.mailMessage.count({
    where: { userId, isClaimed: false },
  });
}

export async function markMailRead(userId: string, mailId: string) {
  const mail = await prisma.mailMessage.findFirst({
    where: { id: mailId, userId },
  });
  if (!mail || mail.isRead) return { success: true as const };

  await prisma.mailMessage.update({
    where: { id: mailId },
    data: { isRead: true },
  });
  return { success: true as const };
}

export async function claimMail(userId: string, mailId: string) {
  const mail = await prisma.mailMessage.findFirst({
    where: { id: mailId, userId },
  });
  if (!mail) return { success: false as const, error: "NOT_FOUND" };
  if (mail.isClaimed) return { success: false as const, error: "ALREADY_CLAIMED" };

  const payload = parseMailPayload(mail.payload);

  await prisma.$transaction(async (tx) => {
    if (payload.coins > 0) {
      await tx.profile.update({
        where: { userId },
        data: { coins: { increment: payload.coins } },
      });
    }
    if (payload.gems > 0) {
      await tx.profile.update({
        where: { userId },
        data: { gems: { increment: payload.gems } },
      });
    }
    for (const row of payload.items) {
      await tx.inventoryItem.upsert({
        where: { userId_itemId: { userId, itemId: row.itemId } },
        create: { userId, itemId: row.itemId, quantity: row.quantity },
        update: { quantity: { increment: row.quantity } },
      });
    }
    await tx.mailMessage.update({
      where: { id: mailId },
      data: { isClaimed: true, isRead: true },
    });
  });

  if (payload.exp > 0) {
    await grantExp(payload.exp);
  }

  revalidatePath("/mailbox");
  revalidatePath("/inventory");
  revalidatePath("/profile");
  revalidatePath("/room");

  return { success: true as const, payload };
}

export async function claimAllMails(userId: string) {
  const unclaimed = await prisma.mailMessage.findMany({
    where: { userId, isClaimed: false },
    select: { id: true },
  });

  let claimed = 0;
  for (const mail of unclaimed) {
    const result = await claimMail(userId, mail.id);
    if (result.success) claimed++;
  }

  return { success: true as const, claimed };
}

export async function syncMailboxOnLogin(userId: string, email: string) {
  await ensureUserSetup(userId, email);
  return deliverDailyRewardMail(userId);
}
