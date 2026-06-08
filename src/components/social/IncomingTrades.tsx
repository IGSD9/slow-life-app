"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PendingTrade {
  id: string;
  proposerId?: string;
  proposerName: string;
  receiverName: string;
  proposerItemNames: string[];
  receiverItemNames: string[];
  isProposer: boolean;
}

export function IncomingTrades() {
  const [trades, setTrades] = useState<PendingTrade[]>([]);
  const [message, setMessage] = useState("");

  const fetchTrades = useCallback(async () => {
    const res = await fetch("/api/trade");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && (data.length === 0 || "proposerItemNames" in (data[0] ?? {}))) {
        setTrades(data);
      }
    }
  }, []);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const respond = async (action: "accept" | "cancel", sessionId: string) => {
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sessionId }),
    });
    if (res.ok) {
      setMessage(action === "accept" ? "トレード完了！" : "キャンセルしました");
      fetchTrades();
    }
  };

  if (trades.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-yellow-500/30 p-3 space-y-2">
      <h3 className="text-xs font-bold text-yellow-400 flex items-center gap-1">
        <ArrowLeftRight size={12} />
        トレード申請 ({trades.length})
      </h3>
      {trades.map((t) => (
        <div key={t.id} className="bg-[#fff0f6] rounded-lg p-2 text-[10px]">
          <p className="font-bold">
            {t.isProposer ? `${t.receiverName} へ申請中` : `${t.proposerName} からの申請`}
          </p>
          <p className="text-[#9494b0]">提供: {t.proposerItemNames.join(", ") || "なし"}</p>
          <p className="text-[#9494b0]">希望: {t.receiverItemNames.join(", ") || "なし"}</p>
          <div className="flex gap-2 mt-1">
            {!t.isProposer && (
              <Button size="sm" onClick={() => respond("accept", t.id)}>
                承認
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => respond("cancel", t.id)}>
              キャンセル
            </Button>
          </div>
        </div>
      ))}
      {message && <p className="text-[10px] text-center text-[#ff6b9d]">{message}</p>}
    </div>
  );
}
