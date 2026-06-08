"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  rarity: number;
  priceCoins: number;
  priceGems: number;
  owned: boolean;
}

interface StoreData {
  coins: number;
  gems: number;
  items: StoreItem[];
}

const RARITY_COLORS = ["", "text-gray-400", "text-blue-400", "text-yellow-400"];

export default function StorePage() {
  const [data, setData] = useState<StoreData | null>(null);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/store");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buy = async (itemId: string, currency: "coins" | "gems") => {
    setMessage("");
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, currency }),
    });
    const result = await res.json();
    if (res.ok) {
      setMessage(`${result.item.name} を購入しました！`);
      fetchData();
    } else {
      const errors: Record<string, string> = {
        INSUFFICIENT_FUNDS: "通貨が足りません",
        NOT_FOR_SALE: "購入できません",
      };
      setMessage(errors[result.error] ?? "購入失敗");
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <h1 className="text-lg font-bold text-[#e94560] flex items-center gap-2">
        <ShoppingBag size={20} />
        ストア
      </h1>

      <div className="flex gap-4 justify-center bg-[#0f0f1a] rounded-xl border border-[#e94560]/20 p-4">
        <div className="text-center">
          <p className="text-xs text-gray-400">コイン</p>
          <p className="text-lg font-bold text-yellow-400">{data.coins}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">ジェム</p>
          <p className="text-lg font-bold text-blue-400">{data.gems}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-300">ジェム購入（Stripe）</h2>
        <GemPacks onMessage={setMessage} onSuccess={fetchData} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-gray-300">アイテム</h2>
        {data.items.map((item) => (
          <div
            key={item.id}
            className="bg-[#0f0f1a] rounded-lg border border-[#e94560]/20 p-3"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`text-sm font-bold ${RARITY_COLORS[item.rarity] ?? ""}`}>
                  {item.name}
                  {item.owned && <span className="text-[10px] text-gray-500 ml-1">所持済</span>}
                </p>
                <p className="text-[10px] text-gray-400">{item.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {item.priceCoins > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => buy(item.id, "coins")}
                  disabled={data.coins < item.priceCoins}
                  className="flex-1"
                >
                  {item.priceCoins} 🪙
                </Button>
              )}
              {item.priceGems > 0 && (
                <Button
                  size="sm"
                  onClick={() => buy(item.id, "gems")}
                  disabled={data.gems < item.priceGems}
                  className="flex-1"
                >
                  {item.priceGems} 💎
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && <p className="text-xs text-center text-[#e94560]">{message}</p>}
    </div>
  );
}

function GemPacks({
  onMessage,
  onSuccess,
}: {
  onMessage: (m: string) => void;
  onSuccess: () => void;
}) {
  const [packs, setPacks] = useState<{ id: string; gems: number; priceYen: number }[]>([]);

  useEffect(() => {
    fetch("/api/store/checkout")
      .then((r) => r.json())
      .then((d) => setPacks(d.packs ?? []));
  }, []);

  const buy = async (packId: string) => {
    onMessage("");
    const res = await fetch("/api/store/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const result = await res.json();
    if (res.ok && result.url) {
      window.location.href = result.url;
    } else if (result.error === "STRIPE_NOT_CONFIGURED") {
      onMessage("Stripe未設定（管理者に STRIPE_SECRET_KEY を設定してもらってください）");
    } else {
      onMessage("購入ページの作成に失敗しました");
    }
    onSuccess();
  };

  if (packs.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {packs.map((p) => (
        <button
          key={p.id}
          onClick={() => buy(p.id)}
          className="bg-[#0f0f1a] rounded-lg border border-blue-500/30 p-3 text-center hover:border-blue-400"
        >
          <p className="text-lg font-bold text-blue-400">{p.gems}💎</p>
          <p className="text-[10px] text-gray-400">¥{p.priceYen}</p>
        </button>
      ))}
    </div>
  );
}
