"use client";

import { useCallback, useEffect, useState } from "react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { Button } from "@/components/ui/Button";
import type { AvatarConfig } from "@/types/avatar";

const CATEGORIES = [
  { key: "top" as const, label: "トップス" },
  { key: "bottom" as const, label: "ボトムス" },
  { key: "hat" as const, label: "帽子" },
  { key: "shoes" as const, label: "靴" },
  { key: "accessory" as const, label: "アクセ" },
];

interface ItemInfo {
  id: string;
  name: string;
  spriteKey: string;
  category: string;
  clothingSlot: string | null;
}

export default function AvatarPage() {
  const [config, setConfig] = useState<AvatarConfig>({});
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [clothing, setClothing] = useState<ItemInfo[]>([]);
  const [activeCategory, setActiveCategory] = useState<keyof AvatarConfig>("top");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (!res.ok) return;
    const data = await res.json();
    setConfig((data.profile?.avatarConfig ?? {}) as AvatarConfig);
    const allItems = data.inventory?.map(
      (inv: { item: ItemInfo }) => inv.item,
    ) ?? [];
    setItems(allItems);
    setClothing(
      allItems.filter((i: ItemInfo) => i.category === "CLOTHING"),
    );
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const slotMap: Record<string, string> = {
    top: "TOP",
    bottom: "BOTTOM",
    hat: "HAT",
    shoes: "SHOES",
    accessory: "ACCESSORY",
  };

  const filtered = clothing.filter(
    (i) => i.clothingSlot === slotMap[activeCategory],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarConfig: config }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("保存しました！");
      fetch("/api/missions/avatar", { method: "POST" }).catch(() => {});
    } else setMessage("保存に失敗しました");
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      <h1 className="text-lg font-bold text-[#ff6b9d]">着せ替え</h1>

      <div className="flex justify-center py-4 bg-white rounded-xl border border-[#ff6b9d]/20">
        <AvatarRenderer config={config} items={items} size={128} />
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              activeCategory === key
                ? "bg-[#ff6b9d] text-white"
                : "bg-[#fff0f6] text-[#9494b0]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() =>
            setConfig((c) => {
              const next = { ...c };
              delete next[activeCategory];
              return next;
            })
          }
          className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[#fff0f6] border border-dashed border-gray-600"
        >
          <span className="text-xs text-[#9494b0]">なし</span>
        </button>
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              setConfig((c) => ({ ...c, [activeCategory]: item.id }))
            }
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
              config[activeCategory] === item.id
                ? "border-[#ff6b9d] bg-[#ff6b9d]/10"
                : "border-[#ff6b9d]/20 bg-[#fff0f6]"
            }`}
          >
            <div className="w-10 h-10 bg-[#4a5568] rounded flex items-center justify-center text-[10px]">
              {item.name.slice(0, 2)}
            </div>
            <span className="text-[10px] text-[#6a6a88] truncate w-full text-center">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "保存中..." : "着せ替えを保存"}
      </Button>
      {message && (
        <p className="text-sm text-center text-[#ff6b9d]">{message}</p>
      )}
    </div>
  );
}
