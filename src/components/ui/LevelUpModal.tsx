"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RewardItem {
  id: string;
  name: string;
}

interface LevelUpModalProps {
  newLevel: number;
  rewards: RewardItem[];
  onClose: () => void;
}

export function LevelUpModal({ newLevel, rewards, onClose }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#ff6b9d]/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border-2 border-yellow-400/50 p-6 text-center space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9494b0] hover:text-[#ff6b9d]"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
        <Sparkles className="mx-auto text-yellow-400" size={32} />
        <div>
          <p className="text-sm text-[#9494b0]">LEVEL UP!</p>
          <p className="text-3xl font-bold text-yellow-400">Lv.{newLevel}</p>
        </div>
        {rewards.length > 0 && (
          <div className="bg-[#fff0f6] rounded-lg p-3 space-y-1">
            <p className="text-xs text-[#9494b0]">報酬を獲得</p>
            {rewards.map((r) => (
              <p key={r.id} className="text-sm font-bold text-[#ff6b9d]">
                {r.name}
              </p>
            ))}
          </div>
        )}
        <Button onClick={onClose} className="w-full">
          やったね！
        </Button>
      </div>
    </div>
  );
}
