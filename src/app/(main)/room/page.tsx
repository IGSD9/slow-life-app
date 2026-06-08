"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Check, Monitor } from "lucide-react";
import { RoomCanvas } from "@/components/room/RoomCanvas";
import { FurniturePalette } from "@/components/room/FurniturePalette";
import { RoomDecorPicker } from "@/components/room/RoomDecorPicker";
import { PCProximityPrompt } from "@/components/room/PCProximityPrompt";
import { PCDesktopOverlay } from "@/components/room/PCDesktopOverlay";
import { LevelBar } from "@/components/ui/LevelBar";
import { Button } from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ImageLightbox } from "@/components/profile/ImageLightbox";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { IncomingTrades } from "@/components/social/IncomingTrades";
import { useRoomSync } from "@/hooks/useRoomSync";
import type { RoomLayout } from "@/types/room";
import type { AvatarConfig } from "@/types/avatar";

interface ProfileData {
  displayName: string;
  level: number;
  exp: number;
  avatarConfig: AvatarConfig;
  profileIconUrl?: string | null;
  portraitUrl?: string | null;
  isAdmin: boolean;
  title: { name: string } | null;
}

interface InventoryItem {
  id: string;
  itemId: string;
  isPlaced: boolean;
  item: {
    id: string;
    name: string;
    spriteKey: string;
    category: string;
  };
}

interface RoomData {
  wallpaperId: string;
  floorId: string;
  layoutData: RoomLayout;
  user: {
    id: string;
    profile: ProfileData | null;
    inventory: InventoryItem[];
  };
}

export default function RoomPage() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nearPC, setNearPC] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);
  const [selectedPos, setSelectedPos] = useState({ gridX: 8, gridY: 8 });
  const [layout, setLayout] = useState<RoomLayout>([]);
  const [wallpaperId, setWallpaperId] = useState("wall_default");
  const [floorId, setFloorId] = useState("floor_default");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchRoom = useCallback(async () => {
    const res = await fetch("/api/room", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setRoom(data);
      setLayout(data.layoutData ?? []);
      setWallpaperId(data.wallpaperId ?? "wall_default");
      setFloorId(data.floorId ?? "floor_default");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoom();
    fetch("/api/missions/login", { method: "POST" }).catch(() => {});
  }, [fetchRoom]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") fetchRoom();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [fetchRoom]);

  const profile = room?.user.profile;
  const avatarConfig = (profile?.avatarConfig ?? {}) as AvatarConfig;
  const userId = room?.user.id ?? "";

  const { remotePlayers, playerPos, direction, movePlayer, stamps } = useRoomSync({
    roomId: userId,
    userId,
    self: {
      userId,
      displayName: profile?.displayName ?? "プレイヤー",
      avatarConfig,
      titleName: profile?.title?.name,
      isAdmin: profile?.isAdmin,
    },
    enabled: !!userId && !isEditing,
  });

  const handleSave = async () => {
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutData: layout, wallpaperId, floorId }),
    });
    if (res.ok) {
      setIsEditing(false);
      fetchRoom();
    }
  };

  const handlePlace = async (placed: RoomLayout[number]) => {
    const res = await fetch("/api/room/place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(placed),
    });
    if (res.ok) {
      const data = await res.json();
      setLayout(data.layout ?? [...layout, placed]);
    }
  };

  const handleMove = useCallback(
    (x: number, y: number, dir?: "up" | "down" | "left" | "right") => {
      movePlayer(x, y, dir ?? direction);
    },
    [movePlayer, direction],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">部屋データの取得に失敗しました</p>
      </div>
    );
  }

  const items = room.user.inventory.map((i) => i.item);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            profileIconUrl={profile?.profileIconUrl}
            config={avatarConfig}
            items={items}
            size={40}
            onClick={() => setLightboxOpen(true)}
          />
          <div>
            <a href="/profile" className="font-bold text-sm flex items-center gap-1.5 hover:text-[#e94560] transition-colors">
              {profile?.displayName ?? "プレイヤー"}
              {profile?.isAdmin && (
                <span className="text-[10px] font-bold text-[#e94560] bg-[#e94560]/10 px-1.5 py-0.5 rounded">
                  [管理者]
                </span>
              )}
            </a>
            {profile?.title && (
              <p className="text-[10px] text-yellow-400">{profile.title.name}</p>
            )}
            {profile && <LevelBar level={profile.level} exp={profile.exp} />}
          </div>
        </div>
        <Button
          size="sm"
          variant={isEditing ? "primary" : "secondary"}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          {isEditing ? <Check size={16} /> : <Pencil size={16} />}
        </Button>
      </header>

      <div className="relative">
        <RoomCanvas
          layout={layout}
          items={items}
          avatarConfig={avatarConfig}
          displayName={profile?.displayName}
          titleName={profile?.title?.name}
          isAdmin={profile?.isAdmin}
          wallpaperId={wallpaperId}
          floorId={floorId}
          isEditing={isEditing}
          readOnly={!isEditing && remotePlayers.length > 0}
          controlledPos={!isEditing && remotePlayers.length > 0 ? playerPos : undefined}
          controlledDirection={!isEditing && remotePlayers.length > 0 ? direction : undefined}
          remotePlayers={!isEditing ? remotePlayers : []}
          stamps={stamps}
          onNearPCChange={setNearPC}
          onInteractPC={() => nearPC && setShowDesktop(true)}
          onMove={(x, y) => setSelectedPos({ gridX: x, gridY: y })}
          onPlayerMove={handleMove}
        />
        {!isEditing && nearPC && !showDesktop && (
          <PCProximityPrompt onLaunch={() => setShowDesktop(true)} />
        )}
      </div>

      {!isEditing && remotePlayers.length > 0 && (
        <p className="text-[10px] text-gray-500 text-center">
          お客さん: {remotePlayers.map((p) => p.displayName).join(", ")}
        </p>
      )}

      {profile?.isAdmin && <AdminPanel />}
      <IncomingTrades />

      {isEditing && (
        <>
          <RoomDecorPicker
            wallpaperId={wallpaperId}
            floorId={floorId}
            onChange={(w, f) => {
              setWallpaperId(w);
              setFloorId(f);
            }}
          />
          <div className="bg-[#0f0f1a] rounded-lg border border-[#e94560]/20 p-3">
            <h3 className="text-sm font-bold mb-2 text-gray-300">家具を配置</h3>
            <FurniturePalette
              items={room.user.inventory}
              onPlace={handlePlace}
              selectedPosition={selectedPos}
            />
          </div>
        </>
      )}

      {!isEditing && (
        <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
          <Monitor size={12} />
          立体部屋をタップ/矢印で移動 · PCの隣で「PCを起動」
        </p>
      )}

      {showDesktop && <PCDesktopOverlay onClose={() => setShowDesktop(false)} />}

      {profile && (
        <ImageLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={profile.profileIconUrl}
          alt={profile.displayName}
          fallbackConfig={avatarConfig}
          fallbackItems={items}
        />
      )}
    </div>
  );
}
