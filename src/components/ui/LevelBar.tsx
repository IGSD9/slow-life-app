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
      <span className="text-xs font-bold text-[#ff6b9d] whitespace-nowrap">
        Lv.{level}
      </span>
      <div className="flex-1 h-2.5 bg-[#ffe4ef] rounded-full overflow-hidden border border-[#ffd6e8]">
        <div
          className="h-full bg-gradient-to-r from-[#ff6b9d] via-[#ff8fb3] to-[#ffb347] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[10px] text-[#9494b0] whitespace-nowrap">
        {current}/{required}
      </span>
    </div>
  );
}
