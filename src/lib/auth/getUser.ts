import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_PC_POSITION } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";
import type { AvatarConfig } from "@/types/avatar";
import type { RoomLayout } from "@/types/room";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureUserSetup(userId: string, email: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { room: true, profile: true },
  });
  if (existing) {
    if (existing.email.toLowerCase() !== email.toLowerCase()) {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
    }
    await ensureRoomRecord(userId);
    if (!existing.profile) {
      await prisma.profile.create({
        data: {
          userId,
          displayName: email.split("@")[0].slice(0, 20),
        },
      });
    }
    return existing;
  }

  const pcItem = await prisma.itemMaster.findFirst({
    where: { spriteKey: "furniture_pc_01" },
  });
  const topItem = await prisma.itemMaster.findFirst({
    where: { spriteKey: "clothing_top_default" },
  });
  const bottomItem = await prisma.itemMaster.findFirst({
    where: { spriteKey: "clothing_bottom_default" },
  });

  const displayName = email.split("@")[0].slice(0, 20);

  const avatarConfig: AvatarConfig = {};
  if (topItem) avatarConfig.top = topItem.id;
  if (bottomItem) avatarConfig.bottom = bottomItem.id;

  const layoutData: RoomLayout = pcItem
    ? [
        {
          inventoryItemId: "pending",
          itemId: pcItem.id,
          gridX: INITIAL_PC_POSITION.gridX,
          gridY: INITIAL_PC_POSITION.gridY,
          rotation: 0,
          zIndex: 1,
        },
      ]
    : [];

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      profile: {
        create: {
          displayName,
          avatarConfig: avatarConfig as unknown as Prisma.InputJsonValue,
        },
      },
      room: {
        create: {
          layoutData: layoutData as unknown as Prisma.InputJsonValue,
        },
      },
      inventory: {
        create: [
          ...(topItem ? [{ itemId: topItem.id }] : []),
          ...(bottomItem ? [{ itemId: bottomItem.id }] : []),
        ],
      },
    },
    include: { profile: true, room: true, inventory: { include: { item: true } } },
  });

  if (pcItem) {
    const pcInventory = await prisma.inventoryItem.create({
      data: { userId, itemId: pcItem.id, isPlaced: true },
    });
    const layout = layoutData.map((f) =>
      f.itemId === pcItem.id
        ? { ...f, inventoryItemId: pcInventory.id }
        : f,
    );
    await prisma.room.update({
      where: { userId },
      data: { layoutData: layout as unknown as Prisma.InputJsonValue },
    });
  }

  return user;
}

async function ensureRoomRecord(userId: string) {
  const existing = await prisma.room.findUnique({ where: { userId } });
  if (existing) return existing;

  const pcItem = await prisma.itemMaster.findFirst({
    where: { spriteKey: "furniture_pc_01" },
  });

  const layoutData: RoomLayout = pcItem
    ? [
        {
          inventoryItemId: "pending",
          itemId: pcItem.id,
          gridX: INITIAL_PC_POSITION.gridX,
          gridY: INITIAL_PC_POSITION.gridY,
          rotation: 0,
          zIndex: 1,
        },
      ]
    : [];

  const room = await prisma.room.create({
    data: {
      userId,
      layoutData: layoutData as unknown as Prisma.InputJsonValue,
    },
  });

  if (pcItem) {
    const pcInventory = await prisma.inventoryItem.upsert({
      where: { userId_itemId: { userId, itemId: pcItem.id } },
      create: { userId, itemId: pcItem.id, isPlaced: true },
      update: { isPlaced: true },
    });
    const layout = layoutData.map((f) =>
      f.itemId === pcItem.id ? { ...f, inventoryItemId: pcInventory.id } : f,
    );
    await prisma.room.update({
      where: { userId },
      data: { layoutData: layout as unknown as Prisma.InputJsonValue },
    });
  }

  return room;
}
