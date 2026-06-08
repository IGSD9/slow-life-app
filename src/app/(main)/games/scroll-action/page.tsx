"use client";

import { useState } from "react";
import { ScrollActionGame } from "@/games/scroll-action";
import { GameResultScreen, submitScore } from "@/components/games/GameResultScreen";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ScrollActionPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);
  const [key, setKey] = useState(0);

  if (result) {
    return (
      <GameResultScreen
        title="横スクロールアクション"
        result={result}
        onRetry={() => { setResult(null); setKey((k) => k + 1); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
        <h1 className="text-lg font-bold text-[#e94560]">横スクロールアクション</h1>
      </div>
      <ScrollActionGame key={key} onGameOver={(s) => submitScore("scroll_action", s).then(setResult)} />
    </div>
  );
}
