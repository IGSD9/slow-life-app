"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitFpsClear } from "@/lib/actions/game";
import { LevelUpModal } from "@/components/ui/LevelUpModal";

const RealFpsGame = dynamic(
  () => import("@/components/minigames/RealFpsGame").then((m) => m.RealFpsGame),
  { ssr: false, loading: () => <p className="text-center text-[#9494b0] p-8">3Dエンジン読込中...</p> },
);

export default function RealFpsPage() {
  const [cleared, setCleared] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitFpsClear>> | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

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
        <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full pb-24">
          <div className="flex items-center gap-2">
            <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
            <h1 className="text-lg font-bold text-[#ff6b9d]">ネオンFPS — クリア！</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-green-400 mb-2">MISSION COMPLETE</p>
            <p className="text-lg text-[#ff6b9d]">+{expGain} EXP 獲得！</p>
            {result.leveledUp && result.newLevel && (
              <p className="text-yellow-400 mt-2">Lv.{result.newLevel} にレベルアップ！</p>
            )}
            <Link href="/room" className="inline-block mt-6">
              <Button>部屋に戻る</Button>
            </Link>
          </div>
        </div>
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
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
        <h1 className="text-lg font-bold text-[#ff6b9d]">ネオンFPS</h1>
      </div>
      <p className="text-xs text-[#9494b0] text-center">
        ドット絵の世界から一転 — 超高画質リアル3Dモード
      </p>
      <RealFpsGame onClear={handleClear} />
    </div>
  );
}
