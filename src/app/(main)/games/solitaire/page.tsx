"use client";

import { useState } from "react";
import { SolitaireGame } from "@/games/solitaire";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SolitairePage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);

  if (result) {
    return (
      <GameResultScreen
        title="ソリティア"
        result={result}
        onRetry={() => { setResult(null); setKey((k) => k + 1); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
        <h1 className="text-lg font-bold text-[#e94560]">ソリティア</h1>
      </div>
      <SolitaireGame key={key} onGameOver={(s) => submitScore("solitaire", s).then(setResult)} />
    </div>
  );
}
