"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface Mission {
  id: string;
  type: string;
  title: string;
  description: string;
  targetValue: number;
  expReward: number;
  coinReward: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/missions");
    if (res.ok) {
      const data = await res.json();
      setMissions(data);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const claim = async (missionId: string) => {
    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", missionId }),
    });
    if (res.ok) fetchData();
  };

  const daily = missions.filter((m) => m.type === "DAILY");
  const achievements = missions.filter((m) => m.type === "ACHIEVEMENT");

  return (
    <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto w-full">
      <h1 className="text-lg font-bold text-[#ff6b9d]">ミッション</h1>

      <section>
        <h2 className="text-sm font-bold text-[#6a6a88] mb-3">デイリーミッション</h2>
        <div className="space-y-2">
          {daily.map((m) => (
            <MissionCard key={m.id} mission={m} onClaim={claim} />
          ))}
          {daily.length === 0 && (
            <p className="text-sm text-[#8888a8]">ミッションがありません</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-[#6a6a88] mb-3">アチーブメント</h2>
        <div className="space-y-2">
          {achievements.map((m) => (
            <MissionCard key={m.id} mission={m} onClaim={claim} />
          ))}
          {achievements.length === 0 && (
            <p className="text-sm text-[#8888a8]">アチーブメントがありません</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MissionCard({
  mission,
  onClaim,
}: {
  mission: Mission;
  onClaim: (id: string) => void;
}) {
  const percent = Math.min(
    100,
    Math.round((mission.progress / mission.targetValue) * 100),
  );

  return (
    <div className="bg-white rounded-lg border border-[#ff6b9d]/20 p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-bold">{mission.title}</p>
          <p className="text-[10px] text-[#9494b0]">{mission.description}</p>
        </div>
        <span className="text-[10px] text-[#ff6b9d] whitespace-nowrap">
          +{mission.expReward} EXP
          {mission.coinReward > 0 && ` / +${mission.coinReward} 🪙`}
        </span>
      </div>
      <div className="h-1.5 bg-[#fff0f6] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#ff6b9d] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[10px] text-[#8888a8] mt-1">
        {mission.progress}/{mission.targetValue}
        {mission.completed && !mission.claimed && (
          <button
            onClick={() => onClaim(mission.id)}
            className="text-green-400 ml-2 underline"
          >
            報酬を受け取る
          </button>
        )}
        {mission.claimed && (
          <span className="text-gray-600 ml-2">受取済</span>
        )}
      </p>
    </div>
  );
}
