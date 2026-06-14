"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomLayout } from "@/types/room";

type Rotation = 0 | 90 | 180 | 270;

export interface FurnitureMovePayload {
  type: "furniture_move";
  fromUserId: string;
  instanceKey: string;
  gridX: number;
  gridY: number;
  rotation?: Rotation;
}

export interface LayoutSyncPayload {
  type: "layout_sync";
  fromUserId: string;
  layoutData: RoomLayout;
}

interface UseSharedRoomSyncOptions {
  marriageId: string;
  userId: string;
  enabled?: boolean;
  initialLayout: RoomLayout;
  onLayoutChange: (layout: RoomLayout) => void;
}

export function useSharedRoomSync({
  marriageId,
  userId,
  enabled = true,
  initialLayout,
  onLayoutChange,
}: UseSharedRoomSyncOptions) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const layoutRef = useRef(initialLayout);
  layoutRef.current = initialLayout;

  const broadcastMove = useCallback(
    async (payload: Omit<FurnitureMovePayload, "type" | "fromUserId">) => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel.send({
        type: "broadcast",
        event: "furniture_move",
        payload: {
          type: "furniture_move",
          fromUserId: userId,
          ...payload,
        } satisfies FurnitureMovePayload,
      });
    },
    [userId],
  );

  const applyLocalMove = useCallback(
    (instanceKey: string, gridX: number, gridY: number, rotation?: Rotation) => {
      const next: RoomLayout = layoutRef.current.map((item) => {
        const key = `${item.itemId}-${item.gridX}-${item.gridY}`;
        if (key !== instanceKey) return item;
        return { ...item, gridX, gridY, rotation: rotation ?? item.rotation };
      });
      layoutRef.current = next;
      onLayoutChange(next);
    },
    [onLayoutChange],
  );

  const moveFurniture = useCallback(
    (instanceKey: string, gridX: number, gridY: number, rotation?: Rotation) => {
      applyLocalMove(instanceKey, gridX, gridY, rotation);
      broadcastMove({ instanceKey, gridX, gridY, rotation });
    },
    [applyLocalMove, broadcastMove],
  );

  const broadcastLayoutSync = useCallback(
    async (layoutData: RoomLayout) => {
      const channel = channelRef.current;
      if (!channel) return;
      layoutRef.current = layoutData;
      await channel.send({
        type: "broadcast",
        event: "layout_sync",
        payload: {
          type: "layout_sync",
          fromUserId: userId,
          layoutData,
        } satisfies LayoutSyncPayload,
      });
    },
    [userId],
  );

  useEffect(() => {
    if (!enabled || !marriageId || !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`shared-room:${marriageId}`, {
      config: { presence: { key: userId }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ userId: string }>();
        const others = Object.values(state).flat().filter((p) => p.userId !== userId);
        setPartnerOnline(others.length > 0);
      })
      .on("broadcast", { event: "furniture_move" }, ({ payload }) => {
        const evt = payload as FurnitureMovePayload;
        if (evt.fromUserId === userId) return;
        applyLocalMove(evt.instanceKey, evt.gridX, evt.gridY, evt.rotation);
      })
      .on("broadcast", { event: "layout_sync" }, ({ payload }) => {
        const evt = payload as LayoutSyncPayload;
        if (evt.fromUserId === userId) return;
        layoutRef.current = evt.layoutData;
        onLayoutChange(evt.layoutData);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, marriageId, userId, applyLocalMove, onLayoutChange]);

  return { partnerOnline, moveFurniture, broadcastMove, broadcastLayoutSync };
}
