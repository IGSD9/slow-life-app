"use client";

import { useState } from "react";
import { TetrisGame } from "@/games/tetris";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import { GameShell } from "@/components/games/GameShell";
import { GAME_REGISTRY } from "@/games/engine";

export default function TetrisPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);
  const game = GAME_REGISTRY.tetris;

  const handleGameOver = async (score: number) => {
    setResult(await submitScore("tetris", score));
  };

  if (result) {
    return (
      <GameResultScreen
        title={game.name}
        result={result}
        onRetry={() => {
          setResult(null);
          setKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <GameShell
      title={game.name}
      subtitle="ライン消去でサイバーエフェクトが走るガチパズル"
    >
      <TetrisGame key={key} onGameOver={handleGameOver} />
    </GameShell>
  );
}
