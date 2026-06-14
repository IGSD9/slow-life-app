"use client";

import { useState } from "react";
import { FightingGame } from "@/games/fighting";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import { GameShell } from "@/components/games/GameShell";
import { GAME_REGISTRY } from "@/games/engine";

export default function FightingPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);
  const game = GAME_REGISTRY.fighting;

  if (result) {
    return (
      <GameResultScreen
        title={game.name}
        result={result}
        onRetry={() => { setResult(null); setKey((k) => k + 1); }}
      />
    );
  }

  return (
    <GameShell
      title={game.name}
      subtitle="物理挙動を滑らかにし、エフェクトを派手にしたガチ格ゲー"
    >
      <FightingGame key={key} onGameOver={(s) => submitScore("fighting", s).then(setResult)} />
    </GameShell>
  );
}
