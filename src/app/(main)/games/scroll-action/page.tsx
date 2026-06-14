"use client";

import { useState } from "react";
import { ScrollActionGame } from "@/games/scroll-action";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import { GameShell } from "@/components/games/GameShell";
import { GAME_REGISTRY } from "@/games/engine";

export default function ScrollActionPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);
  const game = GAME_REGISTRY.scroll_action;

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
      subtitle="自分のアバターがそのまま走る、マリオ風のガチアクション"
    >
      <ScrollActionGame key={key} onGameOver={(s) => submitScore("scroll_action", s).then(setResult)} />
    </GameShell>
  );
}
