"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { LevelBar } from "@/components/ui/LevelBar";
import { Button } from "@/components/ui/Button";
import type { AvatarConfig } from "@/types/avatar";

interface AffinityEntry {
  displayName: string;
  affinity: number;
  level: number;
  title?: string;
}

interface ProfileData {
  id: string;
  email: string;
  profile: {
    displayName: string;
    level: number;
    exp: number;
    isAdmin: boolean;
    showAffinityRank: boolean;
    coins: number;
    gems: number;
    avatarConfig: AvatarConfig;
    title: { name: string } | null;
  };
  inventory: { item: { id: string; name: string; spriteKey: string } }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ranking, setRanking] = useState<AffinityEntry[]>([]);

  const fetchData = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/profile/ranking"),
    ]);
    if (pRes.ok) setProfile(await pRes.json());
    if (rRes.ok) setRanking(await rRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRanking = async () => {
    if (!profile) return;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showAffinityRank: !profile.profile.showAffinityRank }),
    });
    if (res.ok) fetchData();
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const p = profile.profile;
  const items = profile.inventory.map((i) => i.item);
  const config = (p.avatarConfig ?? {}) as AvatarConfig;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <h1 className="text-lg font-bold text-[#e94560]">プロフィール</h1>

      <div className="flex flex-col items-center gap-3 bg-[#0f0f1a] rounded-xl border border-[#e94560]/20 p-6">
        <AvatarRenderer config={config} items={items} size={96} />
        <div className="text-center">
          <h2 className="font-bold text-lg flex items-center justify-center gap-1.5">
            {p.displayName}
            {p.isAdmin && (
              <span className="text-xs text-[#e94560]">[管理者]</span>
            )}
          </h2>
          {p.title && <p className="text-sm text-yellow-400">{p.title.name}</p>}
          <p className="text-xs text-gray-500 mt-1">{profile.email}</p>
        </div>
        <div className="w-full max-w-xs">
          <LevelBar level={p.level} exp={p.exp} />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-400">🪙 {p.coins ?? 0}</span>
          <span className="text-blue-400">💎 {p.gems ?? 0}</span>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <Link href="/store" className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">ストア</Button>
          </Link>
          <Link href="/battle-pass" className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">バトルパス</Button>
          </Link>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-300">親密度ランキング</h3>
          <button
            onClick={toggleRanking}
            className="text-[10px] text-gray-400 underline"
          >
            {p.showAffinityRank ? "非公開にする" : "公開する"}
          </button>
        </div>
        {!p.showAffinityRank ? (
          <p className="text-sm text-gray-500 text-center py-4">非公開設定中</p>
        ) : ranking.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              フレンドがいません
            </p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#0f0f1a] rounded-lg border border-[#e94560]/20 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#e94560] font-bold w-5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{r.displayName}</p>
                      {r.title && (
                        <p className="text-[10px] text-yellow-400">{r.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#e94560]">{r.affinity}</p>
                    <p className="text-[10px] text-gray-500">Lv.{r.level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
