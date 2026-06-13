"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getAuthUser, ensureUserSetup, ensureRoomRecord } from "@/lib/auth/getUser";
import { syncAdminPrivileges } from "@/lib/admin";
import { areFriends } from "@/lib/actions/friend";
import { GRID_HEIGHT, GRID_WIDTH, type PlacedFurniture, type RoomLayout } from "@/types/room";

function isValidLayout(layout: RoomLayout): boolean {
  for (const item of layout) {
    if (item.gridX < 0 || item.gridX >= GRID_WIDTH) return false;
    if (item.gridY < 0 || item.gridY >= GRID_HEIGHT) return false;
  }
  return true;
}

export async function getRoom(userId?: string) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  const targetId = userId ?? authUser.id;

  if (targetId !== authUser.id) {
    const friends = await areFriends(authUser.id, targetId);
    if (!friends) return null;
  }

  await ensureUserSetup(authUser.id, authUser.email);
  await syncAdminPrivileges(authUser.id, authUser.email);

  if (targetId === authUser.id) {
    await ensureRoomRecord(authUser.id);
  }

  const room = await prisma.room.findUnique({
    where: { userId: targetId },
    include: {
      user: {
        include: {
          profile: { include: { title: true } },
          inventory: { include: { item: true } },
        },
      },
    },
  });

  return room;
}

export async function saveRoomLayout(input: {
  layoutData: RoomLayout;
  wallpaperId?: string;
  floorId?: string;
}) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  if (!isValidLayout(input.layoutData)) {
    return { success: false, error: "INVALID_LAYOUT" };
  }

  const owned = await prisma.inventoryItem.findMany({
    where: { userId: authUser.id },
  });
  const ownedMap = new Map(owned.map((i) => [i.id, i]));

  for (const placed of input.layoutData) {
    const inv = ownedMap.get(placed.inventoryItemId);
    if (!inv || inv.itemId !== placed.itemId) {
      return { success: false, error: "NOT_OWNER" };
    }
  }

  await prisma.$transaction([
    prisma.inventoryItem.updateMany({
      where: { userId: authUser.id },
      data: { isPlaced: false },
    }),
    ...input.layoutData.map((placed) =>
      prisma.inventoryItem.update({
        where: { id: placed.inventoryItemId },
        data: { isPlaced: true },
      }),
    ),
    prisma.room.update({
      where: { userId: authUser.id },
      data: {
        layoutData: input.layoutData as unknown as Prisma.InputJsonValue,
        wallpaperId: input.wallpaperId,
        floorId: input.floorId,
      },
    }),
  ]);

  revalidatePath("/room");
  return { success: true };
}

export async function placeFurniture(input: PlacedFurniture) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const inv = await prisma.inventoryItem.findFirst({
    where: { id: input.inventoryItemId, userId: authUser.id },
    include: { item: true },
  });
  if (!inv || inv.item.category !== "FURNITURE") {
    return { success: false, error: "INVALID_ITEM" };
  }

  const room = await prisma.room.findUnique({ where: { userId: authUser.id } });
  if (!room) return { success: false, error: "NO_ROOM" };

  const layout = (room.layoutData as unknown as RoomLayout) ?? [];
  const filtered = layout.filter((f) => f.inventoryItemId !== input.inventoryItemId);
  const newLayout = [...filtered, input];

  if (!isValidLayout(newLayout)) {
    return { success: false, error: "OUT_OF_BOUNDS" };
  }

  await prisma.inventoryItem.update({
    where: { id: input.inventoryItemId },
    data: { isPlaced: true },
  });
  await prisma.room.update({
    where: { userId: authUser.id },
    data: { layoutData: newLayout as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/room");
  return { success: true, layout: newLayout };
}

export async function removeFurniture(inventoryItemId: string) {
  const authUser = await getAuthUser();
  if (!authUser?.email) return { success: false, error: "UNAUTHORIZED" };

  const room = await prisma.room.findUnique({ where: { userId: authUser.id } });
  if (!room) return { success: false, error: "NO_ROOM" };

  const layout = ((room.layoutData as unknown as RoomLayout) ?? []).filter(
    (f) => f.inventoryItemId !== inventoryItemId,
  );

  await prisma.inventoryItem.update({
    where: { id: inventoryItemId, userId: authUser.id },
    data: { isPlaced: false },
  });
  await prisma.room.update({
    where: { userId: authUser.id },
    data: { layoutData: layout as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/room");
  return { success: true, layout };
}
