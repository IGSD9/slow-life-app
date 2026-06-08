"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoomCanvas } from "@/components/room/RoomCanvas";
import { LevelBar } from "@/components/ui/LevelBar";
import { Button } from "@/components/ui/Button";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { TradePanel } from "@/components/social/TradePanel";
import { SocialActions } from "@/components/social/SocialActions";
import { useRoomSync } from "@/hooks/useRoomSync";
import type { RoomLayout } from "@/types/room";
import type { AvatarConfig } from "@/types/avatar";

interface VisitRoomData {
  wallpaperId: string;
  floorId: string;
  layoutData: RoomLayout;
  user: {
    profile: {
      displayName: string;
      level: number;
      exp: number;
      avatarConfig: AvatarConfig;
      isAdmin: boolean;
      title: { name: string } | null;
    } | null;
    inventory: { item: { id: string; name: string; spriteKey: string; category: string } }[];
  };
}

interface MeData {
  id: string;
  profile: {
    displayName: string;
    avatarConfig: AvatarConfig;
    isAdmin: boolean;
    title: { name: string } | null;
  };
}

export default function VisitRoomPage() {
  const params = useParams();
  const hostUserId = params.userId as string;
  const [room, setRoom] = useState<VisitRoomData | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/room?userId=${hostUserId}`).then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]).then(([roomData, profileData]) => {
      if (roomData.error || !roomData.user) {
        setError("部屋に入れません（フレンドのみ訪問可能）");
      } else {
        setRoom(roomData);
        fetch("/api/missions/visit", { method: "POST" }).catch(() => {});
      }
      setMe({
        id: profileData.id,
        profile: profileData.profile,
      });
      setLoading(false);
    });
  }, [hostUserId]);

  const selfProfile = me?.profile;
  const avatarConfig = (selfProfile?.avatarConfig ?? {}) as AvatarConfig;

  const { remotePlayers, playerPos, direction, movePlayer, shareOutfit, sendStamp, stamps, broadcast } = useRoomSync({
    roomId: hostUserId,
    userId: me?.id ?? "",
    self: {
      userId: me?.id ?? "",
      displayName: selfProfile?.displayName ?? "???",
      avatarConfig,
      titleName: selfProfile?.title?.name,
      isAdmin: selfProfile?.isAdmin,
    },
    enabled: !!me?.id,
  });

  const handleMove = useCallback(
    (x: number, y: number, dir?: "up" | "down" | "left" | "right") => {
      movePlayer(x, y, dir ?? direction);
    },
    [movePlayer, direction],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] p-4">
        <p className="text-red-400">{error || "エラー"}</p>
        <Link href="/friends">
          <Button variant="secondary">フレンド一覧へ</Button>
        </Link>
      </div>
    );
  }

  const hostProfile = room.user.profile;
  const hostItems = room.user.inventory.map((i) => i.item);
  const hostAvatar = (hostProfile?.avatarConfig ?? {}) as AvatarConfig;

  return (
    <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-4 max-w-3xl mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/friends">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-gray-400">お邪魔中</p>
          <h1 className="font-bold text-sm flex items-center gap-1.5">
            {hostProfile?.displayName ?? "???"} の部屋
            {hostProfile?.isAdmin && (
              <span className="text-[10px] text-[#e94560]">[管理者]</span>
            )}
          </h1>
        </div>
        <AvatarRenderer config={hostAvatar} items={hostItems} size={36} />
      </div>

      {hostProfile && (
        <LevelBar level={hostProfile.level} exp={hostProfile.exp} />
      )}

      <RoomCanvas
        layout={(room.layoutData as RoomLayout) ?? []}
        items={hostItems}
        avatarConfig={avatarConfig}
        displayName={selfProfile?.displayName}
        titleName={selfProfile?.title?.name}
        isAdmin={selfProfile?.isAdmin}
        wallpaperId={room.wallpaperId}
        floorId={room.floorId}
        isEditing={false}
        readOnly
        controlledPos={playerPos}
        controlledDirection={direction}
        remotePlayers={remotePlayers}
        stamps={stamps}
        onPlayerMove={handleMove}
      />

      <div className="relative space-y-2">
        <SocialActions
          targetUserId={hostUserId}
          avatarConfig={avatarConfig}
          onShareOutfit={shareOutfit}
          onSendStamp={sendStamp}
          playerPos={playerPos}
        />
        <TradePanel
          hostUserId={hostUserId}
          hostName={hostProfile?.displayName ?? "???"}
          onTradeProposed={(sessionId) => {
            broadcast({ type: "trade_request", sessionId, fromUserId: me?.id ?? "" });
          }}
        />
      </div>

      {remotePlayers.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          ルーム内: {remotePlayers.map((p) => p.displayName).join(", ")}
        </p>
      )}
    </div>
  );
}
