"use client";

import { useCallback, useEffect, useState } from "react";

interface InventoryItem {
  id: string;
  quantity: number;
  isPlaced: boolean;
  item: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    spriteKey: string;
    rarity: number;
  };
}

const RARITY_LABELS = ["", "通常", "レア", "限定"];
const RARITY_COLORS = ["", "text-gray-400", "text-blue-400", "text-yellow-400"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.inventory ?? []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = items.filter((inv) => {
    if (filter === "ALL") return true;
    return inv.item.category === filter;
  });

  const categories = [
    { key: "ALL", label: "すべて" },
    { key: "FURNITURE", label: "家具" },
    { key: "CLOTHING", label: "服" },
    { key: "STAMP", label: "スタンプ" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">
      <h1 className="text-lg font-bold text-[#e94560]">持ち物</h1>

      <div className="flex gap-1 overflow-x-auto">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              filter === key
                ? "bg-[#e94560] text-white"
                : "bg-[#1a1a2e] text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">アイテムがありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="bg-[#0f0f1a] rounded-lg border border-[#e94560]/20 p-3"
            >
              <div className="w-full h-16 bg-[#1a1a2e] rounded flex items-center justify-center text-lg mb-2">
                {inv.item.name.slice(0, 2)}
              </div>
              <p className="text-sm font-bold truncate">{inv.item.name}</p>
              <p className={`text-[10px] ${RARITY_COLORS[inv.item.rarity]}`}>
                {RARITY_LABELS[inv.item.rarity]}
              </p>
              {inv.isPlaced && (
                <span className="text-[10px] text-green-400">配置中</span>
              )}
              {inv.quantity > 1 && (
                <span className="text-[10px] text-gray-400">×{inv.quantity}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
