"use client";

import { useState } from "react";
import { X, Power, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { GAME_REGISTRY } from "@/games/engine";
import { IdleRewardsPanel } from "@/components/room/IdleRewardsPanel";

interface PCDesktopOverlayProps {
  onClose: () => void;
}

const GAME_ICONS: Record<string, string> = {
  tetris: "🧱",
  solitaire: "🃏",
  scroll_action: "🏃",
  fighting: "👊",
  real_fps: "🎯",
  dungeon_village: "🏰",
};

const GAME_DESC: Record<string, string> = {
  tetris: "ブロックを揃えて消そう",
  solitaire: "トランプで一人遊び",
  scroll_action: "横スクロールアクション",
  fighting: "CPUと大乱闘",
  real_fps: "超高画質3D · ネオンFPS",
  dungeon_village: "Phaser · 冒険ダンジョン村",
};

export function PCDesktopOverlay({ onClose }: PCDesktopOverlayProps) {
  const [time] = useState(() =>
    new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  );
  const games = Object.values(GAME_REGISTRY);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a1628]">
      {/* デスクトップ壁紙 */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #2d1b4e 0%, transparent 50%), linear-gradient(160deg, #0f2744 0%, #1a1030 50%, #0d1f35 100%)",
        }}
      >
        {/* ウィンドウ風ヘッダー */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/30 backdrop-blur border border-white/10">
            <div className="w-2 h-2 rounded-full bg-[#ff6b9d]" />
            <span className="text-xs text-[#6a6a88] font-mono">SlowLife OS</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/30 backdrop-blur border border-white/10 text-[#6a6a88] hover:text-[#ff6b9d] hover:border-[#ff6b9d]/50 transition-colors text-xs"
          >
            <Power size={14} />
            シャットダウン
          </button>
        </div>

        {/* ゲームアイコン（デスクトップ） */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Gamepad2 size={20} className="text-[#ff6b9d]" />
              <h2 className="text-lg font-bold text-white">ミニゲーム</h2>
              <span className="text-xs text-[#9494b0]">アイコンをタップして起動</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {games.map((game) => (
                <Link
                  key={game.gameId}
                  href={game.route}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ff6b9d]/50 hover:scale-105 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ff6b9d]/30 to-[#533483]/40 flex items-center justify-center text-3xl shadow-lg group-hover:shadow-[#ff6b9d]/20">
                    {GAME_ICONS[game.gameId] ?? "🎮"}
                  </div>
                  <span className="text-sm font-bold text-white text-center">{game.name}</span>
                  <span className="text-[10px] text-[#9494b0] text-center leading-tight">
                    {GAME_DESC[game.gameId] ?? ""}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-8 max-w-sm">
              <IdleRewardsPanel />
            </div>
          </div>
        </div>
      </div>

      {/* タスクバー */}
      <div className="h-10 flex items-center justify-between px-4 bg-white/95 border-t border-[#ff6b9d]/20 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center bg-[#ff6b9d]/20 hover:bg-[#ff6b9d]/40 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <span className="text-[10px] text-[#9494b0] hidden sm:inline">スローライフ · 室内PC</span>
        </div>
        <span className="text-xs text-[#6a6a88] font-mono">{time}</span>
      </div>
    </div>
  );
}
