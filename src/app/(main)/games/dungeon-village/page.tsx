"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitScore } from "@/components/games/GameResultScreen";
import type { AvatarConfig } from "@/types/avatar";

const PhaserGameContainer = dynamic(
  () => import("@/components/minigames/PhaserGameContainer").then((m) => m.PhaserGameContainer),
  { ssr: false, loading: () => <p className="text-center text-[#9494b0] p-8">Phaser読込中...</p> },
);

const PhaserWinScreen = dynamic(
  () => import("@/components/minigames/PhaserWinScreen").then((m) => m.PhaserWinScreen),
  { ssr: false },
);

interface ProfilePayload {
  displayName: string;
  avatarConfig: AvatarConfig;
}

export default function DungeonVillagePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [items, setItems] = useState<{ id: string; spriteKey: string }[]>([]);
  const [gameKey, setGameKey] = useState(0);
  const [winScore, setWinScore] = useState<number | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitScore>> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/room").then((r) => r.json()),
    ]).then(([prof, roomData]) => {
      setProfile({
        displayName: prof.profile?.displayName ?? "プレイヤー",
        avatarConfig: (prof.profile?.avatarConfig ?? {}) as AvatarConfig,
      });
      const inv = (roomData.user?.inventory ?? []) as { item: { id: string; spriteKey: string } }[];
      setItems(inv.map((i) => i.item));
    });
  }, []);

  const itemSpriteById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const it of items) map[it.id] = it.spriteKey;
    return map;
  }, [items]);

  const handleWin = async (score: number) => {
    setWinScore(score);
    const res = await submitScore("dungeon_village", score);
    setResult(res);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#9494b0]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/room"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
        <h1 className="text-lg font-bold text-[#ff6b9d]">冒険ダンジョン村</h1>
      </div>
      <p className="text-xs text-[#9494b0] text-center">Phaser.js · pixelArt モード</p>

      <PhaserGameContainer
        key={gameKey}
        avatarConfig={profile.avatarConfig}
        itemSpriteById={itemSpriteById}
        onWin={handleWin}
      />

      {winScore !== null && result && (
        <PhaserWinScreen
          avatarConfig={profile.avatarConfig}
          items={items}
          displayName={profile.displayName}
          score={winScore}
          expGain={result.expGain}
          onRetry={() => {
            setWinScore(null);
            setResult(null);
            setGameKey((k) => k + 1);
          }}
          onExit={() => { window.location.href = "/room"; }}
        />
      )}
    </div>
  );
}
