"use client";

import { useState } from "react";
import { X, Power, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { GAME_MENU_ORDER, GAME_REGISTRY } from "@/games/engine";
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
};

const GAME_DESC: Record<string, string> = {
  tetris: "ライン消去でサイバーエフェクトが走るガチパズル",
  solitaire: "ゴールドを賭けてフレンドとスコアを競うトランプゲーム",
  scroll_action: "自分のアバターがそのまま走る、マリオ風のガチアクション",
  fighting: "物理挙動を滑らかにし、エフェクトを派手にしたガチ格ゲー",
  real_fps: "ここだけ世界が一転する、美麗3Dの超ハイスピードシューター",
};

const GAME_TAGS: Record<string, string> = {
  tetris: "①",
  solitaire: "②",
  scroll_action: "③",
  fighting: "④",
  real_fps: "⑤",
};

export function PCDesktopOverlay({ onClose }: PCDesktopOverlayProps) {
  const [time] = useState(() =>
    new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  );
  const games = GAME_MENU_ORDER.map((id) => GAME_REGISTRY[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a1628]">
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, #1e3a5f 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, #2d1b4e 0%, transparent 50%), linear-gradient(160deg, #0f2744 0%, #1a1030 50%, #0d1f35 100%)",
        }}
      >
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-3 py-1.5"
            style={{
              background: "#201820",
              border: "3px solid #483830",
              boxShadow: "inset 0 0 0 1px #886040",
            }}
          >
            <div className="w-2 h-2 bg-[#68c848]" />
            <span className="text-xs text-[#c8d8c0] font-mono" style={{ textShadow: "1px 1px 0 #201820" }}>
              SlowLife OS
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#c8d8c0] hover:text-[#68c848] transition-colors"
            style={{
              background: "#201820",
              border: "3px solid #483830",
              boxShadow: "inset 0 0 0 1px #886040, 0 3px 0 #100810",
            }}
          >
            <Power size={14} />
            シャットダウン
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl py-16">
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 size={20} className="text-[#68c848]" />
              <h2
                className="text-lg font-bold text-[#e8f0e0]"
                style={{ textShadow: "2px 2px 0 #201820" }}
              >
                5大ガチタイトル
              </h2>
              <span className="text-xs text-[#9494b0] hidden sm:inline">アイコンをタップして起動</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {games.map((game) => (
                <Link
                  key={game.gameId}
                  href={game.route}
                  className="group flex flex-col gap-2 p-3 sm:p-4 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(180deg, #302830 0%, #201820 100%)",
                    border: "4px solid #483830",
                    boxShadow: "inset 0 0 0 2px #886040, 0 4px 0 #100810",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold text-[#68c848] shrink-0 mt-1"
                      style={{ textShadow: "1px 1px 0 #201820" }}
                    >
                      {GAME_TAGS[game.gameId]}
                    </span>
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl shrink-0 group-hover:brightness-110"
                      style={{
                        background: "#1a2838",
                        border: "3px solid #5090a0",
                        boxShadow: "inset 0 0 12px #00d4ff30",
                      }}
                    >
                      {GAME_ICONS[game.gameId] ?? "🎮"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-xs sm:text-sm font-bold text-[#e8f0e0] leading-tight block"
                        style={{ textShadow: "1px 1px 0 #201820" }}
                      >
                        {game.name}
                      </span>
                      <span className="text-[10px] text-[#9494b0] leading-snug block mt-1">
                        {GAME_DESC[game.gameId] ?? ""}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 max-w-sm">
              <IdleRewardsPanel />
            </div>
          </div>
        </div>
      </div>

      <div
        className="h-10 flex items-center justify-between px-4"
        style={{
          background: "linear-gradient(180deg, #483830 0%, #302820 100%)",
          borderTop: "3px solid #886040",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[#68c84820]"
            style={{ border: "2px solid #886040", background: "#201820" }}
          >
            <X size={16} className="text-[#c8d8c0]" />
          </button>
          <span className="text-[10px] text-[#9494b0] hidden sm:inline">スローライフ · 室内PC</span>
        </div>
        <span className="text-xs text-[#68c848] font-mono" style={{ textShadow: "1px 1px 0 #201820" }}>
          {time}
        </span>
      </div>
    </div>
  );
}
