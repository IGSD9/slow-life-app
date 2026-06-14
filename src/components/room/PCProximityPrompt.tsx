"use client";

import { Monitor, Power } from "lucide-react";

interface PCProximityPromptProps {
  onLaunch: () => void;
}

export function PCProximityPrompt({ onLaunch }: PCProximityPromptProps) {
  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 w-[min(100%,320px)] px-2">
      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-2.5"
        style={{
          background: "linear-gradient(180deg, #302830 0%, #201820 100%)",
          border: "4px solid #483830",
          boxShadow: "inset 0 0 0 2px #886040, 0 4px 0 #100810, 0 0 16px #68c84830",
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Monitor size={18} className="text-[#68c848] shrink-0" style={{ filter: "drop-shadow(1px 1px 0 #201820)" }} />
          <span
            className="text-xs sm:text-sm text-[#e8f0e0] leading-tight"
            style={{ textShadow: "1px 1px 0 #201820" }}
          >
            室内PCが近くにあります
          </span>
        </div>
        <button
          type="button"
          onClick={onLaunch}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-bold text-[#201820] shrink-0 active:translate-y-0.5 transition-transform"
          style={{
            background: "linear-gradient(180deg, #88e868 0%, #68c848 50%, #509030 100%)",
            border: "3px solid #483830",
            boxShadow: "inset 0 2px 0 #a8f888, 0 3px 0 #302820",
            textShadow: "0 1px 0 #a8f888",
          }}
        >
          <Power size={16} />
          PCを起動
        </button>
      </div>
    </div>
  );
}
