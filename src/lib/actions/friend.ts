"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureUserSetup } from "@/lib/auth/getUser";

async function getMe() {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;
  await ensureUserSetup(authUser.id, authUser.email);
  return authUser;
}

export async function sendFriendRequest(friendEmail: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const target = await prisma.user.findFirst({
    where: { email: { equals: friendEmail, mode: "insensitive" } },
    include: { profile: true },
  });
  if (!target) return { success: false, error: "USER_NOT_FOUND" };
  if (target.id === me.id) return { success: false, error: "SELF" };

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId: me.id, friendId: target.id },
        { userId: target.id, friendId: me.id },
      ],
    },
  });
  if (existing) {
    if (existing.status === "ACCEPTED") return { success: false, error: "ALREADY_FRIENDS" };
    if (existing.status === "PENDING") return { success: false, error: "ALREADY_PENDING" };
  }

  await prisma.friendship.create({
    data: { userId: me.id, friendId: target.id, status: "PENDING" },
  });

  revalidatePath("/friends");
  return {
    success: true,
    friend: { id: target.id, displayName: target.profile?.displayName, email: target.email },
  };
}

export async function acceptFriendRequest(friendshipId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const request = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });
  if (!request || request.friendId !== me.id || request.status !== "PENDING") {
    return { success: false, error: "NOT_FOUND" };
  }

  await prisma.$transaction([
    prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED" },
    }),
    prisma.friendship.upsert({
      where: { userId_friendId: { userId: me.id, friendId: request.userId } },
      create: { userId: me.id, friendId: request.userId, status: "ACCEPTED" },
      update: { status: "ACCEPTED" },
    }),
  ]);

  revalidatePath("/friends");
  return { success: true };
}

export async function rejectFriendRequest(friendshipId: string) {
  const me = await getMe();
  if (!me) return { success: false, error: "UNAUTHORIZED" };

  const request = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });
  if (!request || request.friendId !== me.id) {
    return { success: false, error: "NOT_FOUND" };
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  revalidatePath("/friends");
  return { success: true };
}

export async function getFriendsData() {
  const me = await getMe();
  if (!me) return null;

  const accepted = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      userId: me.id,
    },
    include: {
      friend: { include: { profile: { include: { title: true } } } },
    },
    orderBy: { affinity: "desc" },
  });

  const pendingReceived = await prisma.friendship.findMany({
    where: { status: "PENDING", friendId: me.id },
    include: {
      user: { include: { profile: true } },
    },
  });

  const pendingSent = await prisma.friendship.findMany({
    where: { status: "PENDING", userId: me.id },
    include: {
      friend: { include: { profile: true } },
    },
  });

  return {
    me: { id: me.id, email: me.email },
    friends: accepted.map((f) => ({
      friendshipId: f.id,
      userId: f.friend.id,
      displayName: f.friend.profile?.displayName ?? "???",
      level: f.friend.profile?.level ?? 1,
      affinity: f.affinity,
      isAdmin: f.friend.profile?.isAdmin ?? false,
      title: f.friend.profile?.title?.name,
      profileIconUrl: f.friend.profile?.profileIconUrl ?? null,
      isMarried: f.isMarried,
      marriageProposalFrom: f.marriageProposalFrom,
    })),
    pendingReceived: pendingReceived.map((r) => ({
      friendshipId: r.id,
      userId: r.user.id,
      displayName: r.user.profile?.displayName ?? "???",
      email: r.user.email,
    })),
    pendingSent: pendingSent.map((s) => ({
      friendshipId: s.id,
      userId: s.friend.id,
      displayName: s.friend.profile?.displayName ?? "???",
    })),
  };
}

export async function areFriends(userId: string, friendId: string) {
  const f = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      userId,
      friendId,
    },
  });
  return !!f;
}

export async function getAffinityRanking(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile?.showAffinityRank) return [];

  const friendships = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", userId },
    orderBy: { affinity: "desc" },
    take: 10,
    include: {
      friend: { include: { profile: { include: { title: true } } } },
    },
  });

  return friendships.map((f) => ({
    displayName: f.friend.profile?.displayName ?? "???",
    affinity: f.affinity,
    level: f.friend.profile?.level ?? 1,
    title: f.friend.profile?.title?.name,
  }));
}
