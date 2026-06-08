"use client";

import { Monitor, Power } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PCProximityPromptProps {
  onLaunch: () => void;
}

export function PCProximityPrompt({ onLaunch }: PCProximityPromptProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff0f6]/95 border border-[#ff6b9d]/50 shadow-lg shadow-[#ff6b9d]/20 backdrop-blur-sm">
        <Monitor size={16} className="text-[#ff6b9d] shrink-0" />
        <span className="text-xs text-gray-200 whitespace-nowrap">室内PCが近くにあります</span>
        <Button size="sm" onClick={onLaunch} className="gap-1.5 shrink-0">
          <Power size={14} />
          PCを起動
        </Button>
      </div>
    </div>
  );
}
