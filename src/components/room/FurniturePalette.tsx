"use client";

import type { PlacedFurniture } from "@/types/room";

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

interface FurniturePaletteProps {
  items: InventoryItem[];
  onPlace: (placed: PlacedFurniture) => void;
  selectedPosition: { gridX: number; gridY: number };
}

export function FurniturePalette({
  items,
  onPlace,
  selectedPosition,
}: FurniturePaletteProps) {
  const furniture = items.filter(
    (i) => i.item.category === "FURNITURE" && !i.isPlaced,
  );

  if (furniture.length === 0) {
    return (
      <p className="text-sm text-[#9494b0] text-center py-4">
        配置できる家具がありません
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {furniture.map((inv) => (
        <button
          key={inv.id}
          onClick={() =>
            onPlace({
              inventoryItemId: inv.id,
              itemId: inv.itemId,
              gridX: selectedPosition.gridX,
              gridY: selectedPosition.gridY,
              rotation: 0,
              zIndex: 1,
            })
          }
          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#fff0f6] border border-[#ff6b9d]/20 hover:border-[#ff6b9d]/60 transition-colors"
        >
          <div className="w-10 h-10 bg-[#4a5568] rounded flex items-center justify-center text-[10px] text-white">
            {inv.item.name.slice(0, 2)}
          </div>
          <span className="text-[10px] text-[#6a6a88] truncate w-full text-center">
            {inv.item.name}
          </span>
        </button>
      ))}
    </div>
  );
}
