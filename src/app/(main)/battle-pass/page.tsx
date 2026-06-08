"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BATTLE_PASS_EXP_PER_TIER } from "@/lib/constants";

interface BattlePassData {
  season: { id: string; name: string; maxTier: number; endDate: string } | null;
  progress: { currentTier: number; currentExp: number; isPremium: boolean };
  rewards: {
    tier: number;
    isPremium: boolean;
    item: { id: string; name: string; spriteKey: string };
    claimable: boolean;
    claimed: boolean;
  }[];
}

export default function BattlePassPage() {
  const [data, setData] = useState<BattlePassData | null>(null);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/battle-pass");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const claim = async (tier: number, isPremium: boolean) => {
    const res = await fetch("/api/battle-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", tier, isPremium }),
    });
    if (res.ok) {
      setMessage("報酬を受け取りました！");
      fetchData();
    }
  };

  const buyPremium = async () => {
    const res = await fetch("/api/battle-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "premium" }),
    });
    const result = await res.json();
    if (res.ok) {
      setMessage("プレミアムパスを購入しました！");
      fetchData();
    } else {
      setMessage(result.error === "INSUFFICIENT_GEMS" ? "ジェムが足りません" : "購入失敗");
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  if (!data.season) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 min-h-[60vh] justify-center">
        <p className="text-gray-400">現在アクティブなシーズンがありません</p>
        <Link href="/room"><Button variant="secondary">部屋に戻る</Button></Link>
      </div>
    );
  }

  const { season, progress } = data;
  const nextTierExp = (progress.currentTier + 1) * BATTLE_PASS_EXP_PER_TIER;
  const expPercent = Math.min(100, Math.round((progress.currentExp / nextTierExp) * 100));

  const freeRewards = data.rewards.filter((r) => !r.isPremium);
  const premiumRewards = data.rewards.filter((r) => r.isPremium);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <h1 className="text-lg font-bold text-[#e94560] flex items-center gap-2">
        <Crown size={20} />
        バトルパス
      </h1>

      <div className="bg-[#0f0f1a] rounded-xl border border-[#e94560]/20 p-4">
        <h2 className="font-bold">{season.name}</h2>
        <p className="text-xs text-gray-400">
          終了: {new Date(season.endDate).toLocaleDateString("ja-JP")}
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Tier {progress.currentTier}</span>
            <span>{progress.currentExp}/{nextTierExp} EXP</span>
          </div>
          <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div className="h-full bg-[#e94560]" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
        {!progress.isPremium && (
          <Button size="sm" onClick={buyPremium} className="w-full mt-3">
            プレミアムパス (500 💎)
          </Button>
        )}
        {progress.isPremium && (
          <p className="text-xs text-yellow-400 mt-2 text-center">プレミアム有効</p>
        )}
      </div>

      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-2">フリーパス報酬</h3>
        <div className="space-y-2">
          {freeRewards.map((r) => (
            <RewardRow key={`f-${r.tier}`} reward={r} onClaim={claim} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-yellow-400 mb-2">プレミアム報酬</h3>
        <div className="space-y-2">
          {premiumRewards.map((r) => (
            <RewardRow key={`p-${r.tier}`} reward={r} onClaim={claim} premium />
          ))}
        </div>
      </section>

      {message && <p className="text-xs text-center text-[#e94560]">{message}</p>}
    </div>
  );
}

function RewardRow({
  reward,
  onClaim,
  premium,
}: {
  reward: BattlePassData["rewards"][0];
  onClaim: (tier: number, isPremium: boolean) => void;
  premium?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${
      premium ? "border-yellow-500/30 bg-[#0f0f1a]" : "border-[#e94560]/20 bg-[#0f0f1a]"
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#e94560] font-bold w-6">T{reward.tier}</span>
        <Gift size={14} className="text-gray-400" />
        <span className="text-sm">{reward.item.name}</span>
      </div>
      {reward.claimable && !reward.claimed && (
        <Button size="sm" onClick={() => onClaim(reward.tier, reward.isPremium)}>
          受取
        </Button>
      )}
      {reward.claimed && (
        <span className="text-[10px] text-gray-500">受取済</span>
      )}
    </div>
  );
}
