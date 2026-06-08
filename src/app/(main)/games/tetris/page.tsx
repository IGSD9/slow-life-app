"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TetrisGame } from "@/games/tetris";
import { Button } from "@/components/ui/Button";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";

export default function TetrisPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);

  const handleGameOver = async (score: number) => {
    setResult(await submitScore("tetris", score));
  };

  if (result) {
    return (
      <GameResultScreen
        title="テトリス"
        result={result}
        onRetry={() => {
          setResult(null);
          setKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/room">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-lg font-bold text-[#e94560]">テトリス</h1>
      </div>
      <TetrisGame key={key} onGameOver={handleGameOver} />
    </div>
  );
}
