"use client";

import { useState } from "react";
import { SolitaireGame } from "@/games/solitaire";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import { GameShell } from "@/components/games/GameShell";
import { GAME_REGISTRY } from "@/games/engine";

export default function SolitairePage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);
  const game = GAME_REGISTRY.solitaire;

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
      subtitle="ゴールドを賭けてフリードとスコアを競うトランプゲーム"
    >
      <div className="absolute inset-0 overflow-auto p-2 flex items-center justify-center">
        <SolitaireGame key={key} onGameOver={(s) => submitScore("solitaire", s).then(setResult)} />
      </div>
    </GameShell>
  );
}
