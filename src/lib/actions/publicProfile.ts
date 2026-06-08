"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";
import { areFriends } from "@/lib/actions/friend";
import type { AvatarConfig } from "@/types/avatar";

export async function getPublicCharacterProfile(targetUserId: string) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  await ensureUserSetup(authUser.id, authUser.email);

  const isSelf = authUser.id === targetUserId;
  if (!isSelf) {
    const friends = await areFriends(authUser.id, targetUserId);
    if (!friends) return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      profile: { include: { title: true } },
      inventory: { include: { item: true } },
    },
  });
  if (!user?.profile) return null;

  const p = user.profile;
  return {
    userId: user.id,
    displayName: p.displayName,
    level: p.level,
    exp: p.exp,
    isAdmin: p.isAdmin,
    profileIconUrl: p.profileIconUrl,
    portraitUrl: p.portraitUrl,
    avatarConfig: (p.avatarConfig ?? {}) as AvatarConfig,
    title: p.title ? { id: p.title.id, name: p.title.name } : null,
    inventory: user.inventory.map((inv) => ({
      item: {
        id: inv.item.id,
        name: inv.item.name,
        spriteKey: inv.item.spriteKey,
        category: inv.item.category,
      },
    })),
  };
}
