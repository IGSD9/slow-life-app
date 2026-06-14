"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { GameShell } from "@/components/games/GameShell";
import { submitFpsClear } from "@/lib/actions/game";
import { LevelUpModal } from "@/components/ui/LevelUpModal";
import { GAME_REGISTRY } from "@/games/engine";

const RealFpsGame = dynamic(
  () => import("@/components/minigames/RealFpsGame").then((m) => m.RealFpsGame),
  { ssr: false, loading: () => <p className="text-center text-[#9494b0] p-8">3Dエンジン読込中...</p> },
);

export default function RealFpsPage() {
  const [cleared, setCleared] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitFpsClear>> | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const game = GAME_REGISTRY.real_fps;

  const handleClear = async () => {
    if (cleared) return;
    setCleared(true);
    const res = await submitFpsClear();
    setResult(res);
    if (res.success && res.leveledUp) setShowLevelUp(true);
  };

  if (result && "expGain" in result && result.success) {
    const expGain = result.expGain;
    return (
      <>
        <GameShell title={`${game.name} — クリア！`} aspect="4/3">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <p
              className="text-2xl font-bold text-[#68c848] mb-2"
              style={{ textShadow: "2px 2px 0 #201820" }}
            >
              MISSION COMPLETE
            </p>
            <p className="text-lg text-[#ff6b9d]">+{expGain} EXP 獲得！</p>
            {result.leveledUp && result.newLevel && (
              <p className="text-yellow-400 mt-2">Lv.{result.newLevel} にレベルアップ！</p>
            )}
            <Link href="/room" className="inline-block mt-6">
              <Button>部屋に戻る</Button>
            </Link>
          </div>
        </GameShell>
        {showLevelUp && result.newLevel && (
          <LevelUpModal
            newLevel={result.newLevel}
            rewards={result.rewards ?? []}
            onClose={() => setShowLevelUp(false)}
          />
        )}
      </>
    );
  }

  return (
    <GameShell
      title={game.name}
      subtitle="ここだけ世界が一転する、美麗3Dの超ハイスピードシューター"
      aspect="fill"
    >
      <RealFpsGame onClear={handleClear} />
    </GameShell>
  );
}
