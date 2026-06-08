"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TradeItem {
  id: string;
  quantity: number;
  item: { id: string; name: string; category: string; spriteKey: string; rarity: number };
}

interface PendingTrade {
  id: string;
  proposerId: string;
  receiverId: string;
  proposerName: string;
  receiverName: string;
  proposerItems: string[];
  receiverItems: string[];
  proposerItemNames: string[];
  receiverItemNames: string[];
  isProposer: boolean;
}

interface TradePanelProps {
  hostUserId: string;
  hostName: string;
  onTradeProposed?: (sessionId: string) => void;
}

export function TradePanel({ hostUserId, hostName, onTradeProposed }: TradePanelProps) {
  const [open, setOpen] = useState(false);
  const [myItems, setMyItems] = useState<TradeItem[]>([]);
  const [hostItems, setHostItems] = useState<TradeItem[]>([]);
  const [mySelected, setMySelected] = useState<Set<string>>(new Set());
  const [hostSelected, setHostSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingTrade[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [myRes, hostRes, tradeRes] = await Promise.all([
      fetch("/api/trade?self=1"),
      fetch(`/api/trade?userId=${hostUserId}`),
      fetch("/api/trade"),
    ]);
    if (myRes.ok) setMyItems(await myRes.json());
    if (hostRes.ok) setHostItems(await hostRes.json());
    if (tradeRes.ok) {
      const data = await tradeRes.json();
      if (Array.isArray(data) && (data.length === 0 || "proposerItemNames" in (data[0] ?? {}))) {
        setPending(data.filter((t: PendingTrade) =>
          t.proposerId === hostUserId || (t as { receiverId?: string }).receiverId === hostUserId
        ));
      } else {
        setPending([]);
      }
    }
  }, [hostUserId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const propose = async () => {
    if (mySelected.size === 0 && hostSelected.size === 0) {
      setMessage("アイテムを選択してください");
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "propose",
        receiverId: hostUserId,
        proposerItems: [...mySelected],
        receiverItems: [...hostSelected],
      }),
    });
    setLoading(false);
    const result = await res.json();
    if (res.ok) {
      setMessage("トレード申請を送りました");
      setMySelected(new Set());
      setHostSelected(new Set());
      onTradeProposed?.(result.sessionId);
      fetchData();
    } else {
      const errors: Record<string, string> = {
        TRADE_PENDING: "進行中のトレードがあります",
        NOT_FRIENDS: "フレンドのみトレード可能です",
        ITEM_PLACED: "配置中のアイテムは交換できません",
        NOT_TRADEABLE: "交換不可のアイテムが含まれています",
      };
      setMessage(errors[result.error] ?? "申請に失敗しました");
    }
  };

  const respond = async (action: "accept" | "cancel", sessionId: string) => {
    setLoading(true);
    const res = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sessionId }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage(action === "accept" ? "トレード完了！" : "キャンセルしました");
      fetchData();
    }
  };

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)} className="w-full">
        <ArrowLeftRight size={14} className="mr-1" />
        アイテム交換
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#ff6b9d]/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#ff6b9d] flex items-center gap-1">
          <ArrowLeftRight size={14} />
          {hostName} と交換
        </h3>
        <button onClick={() => setOpen(false)} className="text-[#8888a8] hover:text-[#ff6b9d]">
          <X size={16} />
        </button>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((t) => (
            <div key={t.id} className="bg-[#fff0f6] rounded-lg p-3 text-xs">
              <p className="font-bold mb-1">
                {t.isProposer ? "送信した申請" : `${t.proposerName} からの申請`}
              </p>
              <p className="text-[#9494b0]">
                提供: {t.proposerItemNames.join(", ") || "なし"}
              </p>
              <p className="text-[#9494b0]">
                希望: {t.receiverItemNames.join(", ") || "なし"}
              </p>
              <div className="flex gap-2 mt-2">
                {!t.isProposer && (
                  <Button size="sm" onClick={() => respond("accept", t.id)} disabled={loading}>
                    承認
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => respond("cancel", t.id)} disabled={loading}>
                  キャンセル
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-[#9494b0] mb-1">あなたが渡すアイテム</p>
        <div className="flex flex-wrap gap-1">
          {myItems.length === 0 ? (
            <p className="text-xs text-[#8888a8]">交換可能なアイテムなし</p>
          ) : (
            myItems.map((inv) => (
              <button
                key={inv.id}
                onClick={() => toggle(mySelected, inv.id, setMySelected)}
                className={`px-2 py-1 rounded text-[10px] border ${
                  mySelected.has(inv.id)
                    ? "border-[#ff6b9d] bg-[#ff6b9d]/20 text-white"
                    : "border-[#ffd6e8] text-[#9494b0]"
                }`}
              >
                {inv.item.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-[#9494b0] mb-1">相手から欲しいアイテム</p>
        <div className="flex flex-wrap gap-1">
          {hostItems.length === 0 ? (
            <p className="text-xs text-[#8888a8]">相手に交換可能なアイテムなし</p>
          ) : (
            hostItems.map((inv) => (
              <button
                key={inv.id}
                onClick={() => toggle(hostSelected, inv.id, setHostSelected)}
                className={`px-2 py-1 rounded text-[10px] border ${
                  hostSelected.has(inv.id)
                    ? "border-[#ff6b9d] bg-[#ff6b9d]/20 text-white"
                    : "border-[#ffd6e8] text-[#9494b0]"
                }`}
              >
                {inv.item.name}
              </button>
            ))
          )}
        </div>
      </div>

      <Button size="sm" onClick={propose} disabled={loading} className="w-full">
        交換を申請
      </Button>
      {message && <p className="text-xs text-center text-[#ff6b9d]">{message}</p>}
    </div>
  );
}
