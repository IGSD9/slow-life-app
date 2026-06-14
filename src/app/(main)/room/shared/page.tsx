"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Pencil, Check } from "lucide-react";
import { RoomCanvas } from "@/components/room/RoomCanvas";
import { FurniturePalette } from "@/components/room/FurniturePalette";
import { Button } from "@/components/ui/Button";
import { useSharedRoomSync } from "@/hooks/useSharedRoomSync";
import {
  getSharedRoomAccess,
  getSharedRoomInventory,
  saveSharedRoomLayout,
  placeSharedRoomFurniture,
} from "@/lib/actions/sharedRoom";
import type { RoomLayout } from "@/types/room";
import type { AvatarConfig } from "@/types/avatar";

export default function SharedRoomPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marriageId, setMarriageId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [userId, setUserId] = useState("");
  const [layout, setLayout] = useState<RoomLayout>([]);
  const [wallpaperId, setWallpaperId] = useState("wall_default");
  const [floorId, setFloorId] = useState("floor_default");
  const [isEditing, setIsEditing] = useState(false);
  const [inventory, setInventory] = useState<
    { id: string; itemId: string; userId: string; isMine: boolean; item: { id: string; name: string; spriteKey: string; category: string } }[]
  >([]);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({});
  const [displayName, setDisplayName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [access, inv, profile] = await Promise.all([
      getSharedRoomAccess(),
      getSharedRoomInventory(),
      fetch("/api/profile").then((r) => r.json()),
    ]);

    if (!access.success) {
      setError(access.error === "NOT_MARRIED" ? "結婚しているペアのみ利用できます" : "読み込みに失敗しました");
      setLoading(false);
      return;
    }

    setMarriageId(access.marriageId);
    setPartnerName(access.partnerName);
    setLayout(access.layoutData);
    setWallpaperId(access.wallpaperId);
    setFloorId(access.floorId);
    setUserId(profile.id ?? "");
    setDisplayName(profile.profile?.displayName ?? "プレイヤー");
    setAvatarConfig((profile.profile?.avatarConfig ?? {}) as AvatarConfig);

    if (inv.success) setInventory(inv.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { partnerOnline, broadcastLayoutSync } = useSharedRoomSync({
    marriageId,
    userId,
    enabled: !!marriageId && !!userId,
    initialLayout: layout,
    onLayoutChange: setLayout,
  });

  const handleSave = async () => {
    await saveSharedRoomLayout({ layoutData: layout, wallpaperId, floorId });
    await broadcastLayoutSync(layout);
    setIsEditing(false);
  };

  const handlePlace = async (placed: RoomLayout[number]) => {
    const res = await placeSharedRoomFurniture({
      inventoryId: placed.inventoryItemId,
      gridX: placed.gridX,
      gridY: placed.gridY,
      rotation: placed.rotation,
    });
    if (res.success) {
      setLayout(res.layoutData);
      await broadcastLayoutSync(res.layoutData);
      const inv = await getSharedRoomInventory();
      if (inv.success) setInventory(inv.items);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#9494b0]">新婚ハウスを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 min-h-[60vh] justify-center p-4">
        <p className="text-red-400">{error}</p>
        <Link href="/friends"><Button variant="secondary">フレンドへ</Button></Link>
      </div>
    );
  }

  const items = inventory.map((i) => i.item);
  const paletteInventory = inventory.map((i) => ({
    id: i.id,
    itemId: i.itemId,
    isPlaced: false,
    item: i.item,
  }));

  return (
    <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-4 max-w-3xl mx-auto w-full pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
          <div>
            <p className="text-xs text-[#9494b0] flex items-center gap-1">
              <Heart size={12} className="text-[#ff6b9d]" /> 共同マイルーム
            </p>
            <h1 className="font-bold text-sm">{partnerName} と の新婚ハウス</h1>
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

      {partnerOnline && (
        <p className="text-[10px] text-green-400 text-center">パートナーがオンライン — リアルタイム同期中</p>
      )}

      <RoomCanvas
        layout={layout}
        items={items}
        avatarConfig={avatarConfig}
        displayName={displayName}
        wallpaperId={wallpaperId}
        floorId={floorId}
        isEditing={isEditing}
      />

      {isEditing && (
        <div className="bg-white rounded-lg border border-[#ff6b9d]/20 p-3">
          <h3 className="text-sm font-bold mb-1 text-[#6a6a88]">家具を配置</h3>
          <p className="text-[10px] text-[#9494b0] mb-2">自分＋パートナーの未配置家具から選べます</p>
          <FurniturePalette
            items={paletteInventory}
            onPlace={handlePlace}
            selectedPosition={{ gridX: 6, gridY: 7 }}
          />
        </div>
      )}
    </div>
  );
}
