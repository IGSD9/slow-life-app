"use client";

import { useMemo, useState } from "react";
import { X, Shirt } from "lucide-react";
import type { AvatarConfig } from "@/types/avatar";
import type { RoomPlayer } from "@/types/presence";
import { AVATAR_LAYERS } from "@/types/avatar";

interface ClothingItem {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    spriteKey: string;
    category: string;
    clothingSlot?: string | null;
  };
}

interface ClosetShareModalProps {
  open: boolean;
  onClose: () => void;
  friendsInRoom: RoomPlayer[];
  clothingInventory: ClothingItem[];
  hostAvatarConfig: AvatarConfig;
  onApplyTryOn: (targetUserId: string, config: AvatarConfig) => void;
}

const SLOT_LABEL: Record<string, string> = {
  HAT: "帽子",
  TOP: "トップス",
  BOTTOM: "ボトムス",
  SHOES: "くつ",
  ACCESSORY: "アクセ",
};

export function ClosetShareModal({
  open,
  onClose,
  friendsInRoom,
  clothingInventory,
  hostAvatarConfig,
  onApplyTryOn,
}: ClosetShareModalProps) {
  const [selectedFriend, setSelectedFriend] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  const clothing = useMemo(
    () => clothingInventory.filter((i) => i.item.category === "CLOTHING"),
    [clothingInventory],
  );

  if (!open) return null;

  const handleApply = () => {
    if (!selectedFriend || !selectedItem) return;
    const item = clothing.find((c) => c.itemId === selectedItem);
    if (!item?.item.clothingSlot) return;

    const slotKey = item.item.clothingSlot.toLowerCase() as keyof AvatarConfig;
    if (!AVATAR_LAYERS.includes(slotKey as (typeof AVATAR_LAYERS)[number])) return;

    const config: AvatarConfig = {
      ...hostAvatarConfig,
      [slotKey]: selectedItem,
    };
    onApplyTryOn(selectedFriend, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-2 sm:p-4">
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto p-4"
        style={{
          background: "linear-gradient(180deg, #2a2040 0%, #1a1030 100%)",
          border: "4px solid #483830",
          boxShadow: "inset 0 0 0 2px #ff6b9d, 0 6px 0 #483830",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shirt size={18} className="text-[#ff6b9d]" />
            <h2 className="text-sm font-bold text-white">クローゼット共有</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[#9494b0] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <section className="mb-4">
          <p className="text-[10px] text-[#9494b0] mb-2">部屋にいるフレンド</p>
          {friendsInRoom.length === 0 ? (
            <p className="text-xs text-[#8888a8] p-2 border border-dashed border-[#483830]">
              今は誰もいません
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {friendsInRoom.map((f) => (
                <button
                  key={f.userId}
                  type="button"
                  onClick={() => setSelectedFriend(f.userId)}
                  className={`px-3 py-1.5 text-xs font-bold border-2 transition-colors ${
                    selectedFriend === f.userId
                      ? "border-[#ff6b9d] bg-[#ff6b9d]/20 text-white"
                      : "border-[#483830] text-[#9494b0] hover:text-white"
                  }`}
                >
                  {f.displayName}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-4">
          <p className="text-[10px] text-[#9494b0] mb-2">所有している衣服</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {clothing.map((c) => (
              <button
                key={c.itemId}
                type="button"
                onClick={() => setSelectedItem(c.itemId)}
                className={`p-2 text-left text-xs border-2 transition-colors ${
                  selectedItem === c.itemId
                    ? "border-yellow-400 bg-yellow-400/10 text-white"
                    : "border-[#483830] text-[#9494b0] hover:text-white"
                }`}
              >
                <span className="font-bold block">{c.item.name}</span>
                <span className="text-[10px] text-[#8888a8]">
                  {SLOT_LABEL[c.item.clothingSlot ?? ""] ?? "衣服"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-[#8888a8] mb-3">
          ※ 試着はこの部屋だけの一時的な見た目です。DBの所持データは変更されません。
        </p>

        <button
          type="button"
          disabled={!selectedFriend || !selectedItem}
          onClick={handleApply}
          className="w-full py-2.5 text-sm font-bold text-white bg-[#533483] border-2 border-[#483830] disabled:opacity-40 hover:bg-[#6a4a9a] transition-colors"
          style={{ boxShadow: "0 3px 0 #483830" }}
        >
          フレンドに試着させる
        </button>
      </div>
    </div>
  );
}
