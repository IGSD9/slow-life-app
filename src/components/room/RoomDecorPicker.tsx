"use client";

const WALLPAPERS = [
  { id: "wall_default", label: "ピンク", color: "#e8a8c8" },
  { id: "wall_blue", label: "ブルー", color: "#8ab4d9" },
  { id: "wall_pink", label: "ローズ", color: "#f0b0d0" },
];

const FLOORS = [
  { id: "floor_default", label: "ライトウッド", color: "#c49a6c" },
  { id: "floor_wood", label: "ウッド", color: "#b8895a" },
  { id: "floor_tile", label: "タイル", color: "#9a9aaa" },
];

interface RoomDecorPickerProps {
  wallpaperId: string;
  floorId: string;
  onChange: (wallpaperId: string, floorId: string) => void;
}

export function RoomDecorPicker({ wallpaperId, floorId, onChange }: RoomDecorPickerProps) {
  return (
    <div className="bg-white rounded-lg border border-[#ff6b9d]/20 p-3 space-y-3">
      <div>
        <p className="text-xs text-[#9494b0] mb-2">壁紙</p>
        <div className="flex gap-2">
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              onClick={() => onChange(w.id, floorId)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${
                wallpaperId === w.id ? "border-[#ff6b9d]" : "border-[#ffd6e8]"
              }`}
            >
              <div className="w-10 h-6 rounded" style={{ backgroundColor: w.color }} />
              <span className="text-[9px] text-[#9494b0]">{w.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-[#9494b0] mb-2">床</p>
        <div className="flex gap-2">
          {FLOORS.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange(wallpaperId, f.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border ${
                floorId === f.id ? "border-[#ff6b9d]" : "border-[#ffd6e8]"
              }`}
            >
              <div className="w-10 h-6 rounded" style={{ backgroundColor: f.color }} />
              <span className="text-[9px] text-[#9494b0]">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
