"use client";

import { expProgressInLevel } from "@/lib/level";

interface LevelBarProps {
  level: number;
  exp: number;
}

export function LevelBar({ level, exp }: LevelBarProps) {
  const { current, required, percent } = expProgressInLevel(exp, level);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-[#e94560] whitespace-nowrap">
        Lv.{level}
      </span>
      <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#e94560]/20">
        <div
          className="h-full bg-gradient-to-r from-[#e94560] to-[#ff6b8a] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 whitespace-nowrap">
        {current}/{required}
      </span>
    </div>
  );
}
