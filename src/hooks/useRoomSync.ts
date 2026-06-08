"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PresencePayload,
  RoomPlayer,
  RoomBroadcastEvent,
  RoomStamp,
} from "@/types/presence";
import type { AvatarConfig } from "@/types/avatar";
import type { Direction } from "@/types/room";

interface UseRoomSyncOptions {
  roomId: string;
  userId: string;
  self: Omit<PresencePayload, "gridX" | "gridY" | "direction">;
  enabled?: boolean;
}

export function useRoomSync({
  roomId,
  userId,
  self,
  enabled = true,
}: UseRoomSyncOptions) {
  const [remotePlayers, setRemotePlayers] = useState<RoomPlayer[]>([]);
  const [playerPos, setPlayerPos] = useState({ gridX: 6, gridY: 7 });
  const [direction, setDirection] = useState<Direction>("down");
  const [outfitPreviews, setOutfitPreviews] = useState<Map<string, AvatarConfig>>(new Map());
  const [stamps, setStamps] = useState<RoomStamp[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const lastTrackRef = useRef(0);

  const trackPosition = useCallback(
    async (gridX: number, gridY: number, dir: Direction) => {
      const channel = channelRef.current;
      if (!channel) return;
      const now = Date.now();
      if (now - lastTrackRef.current < 100) return;
      lastTrackRef.current = now;

      await channel.track({
        userId,
        displayName: self.displayName,
        gridX,
        gridY,
        direction: dir,
        avatarConfig: self.avatarConfig,
        titleName: self.titleName,
        isAdmin: self.isAdmin,
      });
    },
    [userId, self],
  );

  const broadcast = useCallback(
    async (event: RoomBroadcastEvent) => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel.send({
        type: "broadcast",
        event: event.type,
        payload: event,
      });
    },
    [],
  );

  const shareOutfit = useCallback(
    (config: AvatarConfig) => {
      broadcast({ type: "outfit_share", fromUserId: userId, config });
    },
    [broadcast, userId],
  );

  const sendStamp = useCallback(
    (stampId: string, gridX: number, gridY: number) => {
      broadcast({ type: "stamp", fromUserId: userId, stampId, gridX, gridY });
      setStamps((prev) => [
        ...prev,
        { id: `${Date.now()}`, stampId, gridX, gridY, fromUserId: userId },
      ]);
    },
    [broadcast, userId],
  );

  useEffect(() => {
    if (!enabled || !roomId || !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId }, broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>();
        const players: RoomPlayer[] = [];
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (p.userId && p.userId !== userId) {
              const preview = outfitPreviews.get(p.userId);
              players.push({ ...p, isSelf: false, previewConfig: preview });
            }
          }
        }
        setRemotePlayers(players);
      })
      .on("broadcast", { event: "outfit_share" }, ({ payload }) => {
        const evt = payload as RoomBroadcastEvent;
        if (evt.type !== "outfit_share") return;
        setOutfitPreviews((prev) => {
          const next = new Map(prev);
          next.set(evt.fromUserId, evt.config);
          return next;
        });
        setTimeout(() => {
          setOutfitPreviews((prev) => {
            const next = new Map(prev);
            next.delete(evt.fromUserId);
            return next;
          });
        }, 30_000);
      })
      .on("broadcast", { event: "stamp" }, ({ payload }) => {
        const evt = payload as RoomBroadcastEvent;
        if (evt.type !== "stamp") return;
        const stamp: RoomStamp = {
          id: `${Date.now()}-${evt.fromUserId}`,
          stampId: evt.stampId,
          gridX: evt.gridX,
          gridY: evt.gridY,
          fromUserId: evt.fromUserId,
        };
        setStamps((prev) => [...prev, stamp]);
        setTimeout(() => {
          setStamps((prev) => prev.filter((s) => s.id !== stamp.id));
        }, 5000);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            displayName: self.displayName,
            gridX: playerPos.gridX,
            gridY: playerPos.gridY,
            direction,
            avatarConfig: self.avatarConfig,
            titleName: self.titleName,
            isAdmin: self.isAdmin,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [enabled, roomId, userId, self.displayName, self.titleName, self.isAdmin]);

  useEffect(() => {
    setRemotePlayers((prev) =>
      prev.map((p) => ({
        ...p,
        previewConfig: outfitPreviews.get(p.userId),
      })),
    );
  }, [outfitPreviews]);

  const movePlayer = useCallback(
    (gridX: number, gridY: number, dir: Direction) => {
      setPlayerPos({ gridX, gridY });
      setDirection(dir);
      trackPosition(gridX, gridY, dir);
    },
    [trackPosition],
  );

  return {
    remotePlayers,
    playerPos,
    direction,
    movePlayer,
    setPlayerPos,
    setDirection,
    shareOutfit,
    sendStamp,
    stamps,
    broadcast,
  };
}
