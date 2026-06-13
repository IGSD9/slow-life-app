"use client";

import { useEffect, useState } from "react";
import { Coins, Sparkles } from "lucide-react";
import { calcIdleGold } from "@/lib/idleRewards";
import { collectIdleRewards, getIdleRewardStatus } from "@/lib/actions/idle";

interface IdleRewardsPanelProps {
  compact?: boolean;
}

export function IdleRewardsPanel({ compact = false }: IdleRewardsPanelProps) {
  const [lastCollectedAt, setLastCollectedAt] = useState<string | null>(null);
  const [pendingGold, setPendingGold] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [popup, setPopup] = useState<number | null>(null);

  useEffect(() => {
    getIdleRewardStatus().then((res) => {
      if (res.success) {
        setLastCollectedAt(res.lastCollectedAt);
        setPendingGold(res.pendingGold);
      }
    });
  }, []);

  useEffect(() => {
    if (!lastCollectedAt) return;
    const tick = () => setPendingGold(calcIdleGold(lastCollectedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastCollectedAt]);

  const handleCollect = async () => {
    if (collecting || pendingGold <= 0) return;
    setCollecting(true);
    const res = await collectIdleRewards();
    setCollecting(false);
    if (res.success) {
      setLastCollectedAt(res.lastCollectedAt);
      setPendingGold(0);
      setPopup(res.goldGain);
      setTimeout(() => setPopup(null), 2500);
    }
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-[#ff6b9d]/30">
          <Coins size={14} className="text-yellow-400" />
          <span className="text-xs text-[#9494b0]">放置</span>
          <span className="text-sm font-bold text-yellow-300 tabular-nums">{pendingGold}G</span>
          <button
            type="button"
            disabled={pendingGold <= 0 || collecting}
            onClick={handleCollect}
            className="ml-auto text-[10px] px-2 py-1 rounded bg-[#ff6b9d]/20 text-[#ff6b9d] hover:bg-[#ff6b9d]/40 disabled:opacity-40 transition-colors"
          >
            回収
          </button>
        </div>
        {popup !== null && <GoldCollectPopup gold={popup} />}
      </>
    );
  }

  return (
    <>
      <div
        className="p-4 rounded-xl border-4 border-[#483830] bg-[#2a2040]"
        style={{ boxShadow: "inset 0 0 0 2px #ff6b9d40, 0 4px 0 #483830" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Coins size={18} className="text-yellow-400" />
          <h3 className="text-sm font-bold text-white">放置収益（盆栽）</h3>
        </div>
        <p className="text-[10px] text-[#9494b0] mb-3">最大24時間（1,440G）まで貯まります</p>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-3xl font-bold text-yellow-300 tabular-nums animate-pulse">
            {pendingGold}
          </span>
          <span className="text-sm text-yellow-400">ゴールド</span>
        </div>
        <button
          type="button"
          disabled={pendingGold <= 0 || collecting}
          onClick={handleCollect}
          className="w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-yellow-600 to-yellow-500 border-2 border-[#483830] disabled:opacity-40 hover:brightness-110 transition-all"
          style={{ boxShadow: "0 3px 0 #483830" }}
        >
          {collecting ? "回収中..." : "報酬を回収する"}
        </button>
      </div>
      {popup !== null && <GoldCollectPopup gold={popup} />}
    </>
  );
}

function GoldCollectPopup({ gold }: { gold: number }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div
        className="animate-bounce px-8 py-6 text-center"
        style={{
          background: "linear-gradient(180deg, #3d2818 0%, #2a2040 100%)",
          border: "4px solid #483830",
          boxShadow: "inset 0 0 0 2px #ffd700, 0 8px 0 #483830",
          imageRendering: "pixelated",
        }}
      >
        <Sparkles className="mx-auto text-yellow-300 mb-2" size={32} />
        <p className="text-yellow-300 text-2xl font-bold">{gold}ゴールド獲得！</p>
      </div>
    </div>
  );
}
