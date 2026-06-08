"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LevelUpModal } from "@/components/ui/LevelUpModal";

interface RewardItem {
  id: string;
  name: string;
}

interface GameScoreResult {
  score: number;
  expGain?: number;
  newLevel?: number;
  leveledUp?: boolean;
  rewards?: RewardItem[];
}

interface GameResultScreenProps {
  title: string;
  result: GameScoreResult;
  onRetry: () => void;
}

export function GameResultScreen({ title, result, onRetry }: GameResultScreenProps) {
  const [showLevelUp, setShowLevelUp] = useState(!!result.leveledUp);

  return (
    <>
      <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
        <h1 className="text-lg font-bold text-[#ff6b9d]">{title}</h1>
        <div className="flex flex-col items-center gap-4 py-8">
          <h2 className="text-xl font-bold">ゲーム終了</h2>
          <p className="text-2xl text-[#ff6b9d] font-bold">SCORE: {result.score}</p>
          {result.expGain !== undefined && (
            <p className="text-sm text-green-400">+{result.expGain} EXP 獲得！</p>
          )}
          {result.leveledUp && result.newLevel && (
            <p className="text-sm text-yellow-400">Lv.{result.newLevel} にレベルアップ！</p>
          )}
          <div className="flex gap-2">
            <Button onClick={onRetry}>もう一度</Button>
            <Link href="/room">
              <Button variant="secondary">部屋に戻る</Button>
            </Link>
          </div>
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

export async function submitScore(
  gameId: string,
  score: number,
): Promise<GameScoreResult> {
  const res = await fetch("/api/game/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, score }),
  });
  if (res.ok) {
    const data = await res.json();
    return {
      score,
      expGain: data.expGain,
      newLevel: data.newLevel,
      leveledUp: data.leveledUp,
      rewards: data.rewards,
    };
  }
  return { score };
}
