"use client";

import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import type { AvatarConfig } from "@/types/avatar";

interface PhaserWinScreenProps {
  avatarConfig: AvatarConfig;
  items: { id: string; spriteKey: string; name?: string }[];
  displayName: string;
  score: number;
  expGain?: number;
  onRetry: () => void;
  onExit: () => void;
}

export function PhaserWinScreen({
  avatarConfig,
  items,
  displayName,
  score,
  expGain,
  onRetry,
  onExit,
}: PhaserWinScreenProps) {
  const renderItems = items.map((i) => ({ ...i, name: i.name ?? i.id }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-300"
        style={{
          background: "linear-gradient(180deg, #2a2040 0%, #1a1030 100%)",
          border: "4px solid #483830",
          boxShadow: "inset 0 0 0 2px #ff6b9d, 0 8px 0 #483830",
          imageRendering: "pixelated",
        }}
      >
        <p className="text-yellow-300 text-xl font-bold mb-1 tracking-wider">★ WIN ★</p>
        <p className="text-[#9494b0] text-xs mb-4">冒険ダンジョン村 — クリア！</p>

        <div className="flex justify-center mb-4">
          <div className="animate-bounce" style={{ animationDuration: "0.6s" }}>
            <AvatarRenderer config={avatarConfig} items={renderItems} size={96} />
          </div>
        </div>

        <p className="text-white font-bold text-sm mb-1">{displayName}</p>
        <p className="text-[#ff6b9d] text-2xl font-bold mb-1">SCORE {score}</p>
        {expGain !== undefined && (
          <p className="text-green-400 text-sm mb-4">+{expGain} EXP</p>
        )}

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-sm font-bold text-white bg-[#533483] border-2 border-[#483830] hover:bg-[#6a4a9a] transition-colors"
            style={{ boxShadow: "0 3px 0 #483830" }}
          >
            もう一度
          </button>
          <button
            type="button"
            onClick={onExit}
            className="px-4 py-2 text-sm font-bold text-[#6a6a88] bg-[#2a2040] border-2 border-[#483830] hover:text-white transition-colors"
            style={{ boxShadow: "0 3px 0 #483830" }}
          >
            部屋へ
          </button>
        </div>
      </div>
    </div>
  );
}
