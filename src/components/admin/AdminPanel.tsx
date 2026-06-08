"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ItemOption {
  id: string;
  name: string;
  category: string;
}

export function AdminPanel() {
  const [items, setItems] = useState<ItemOption[]>([]);
  const [targetEmail, setTargetEmail] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [level, setLevel] = useState("10");
  const [exp, setExp] = useState("500");
  const [gems, setGems] = useState("500");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/admin/items");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      if (data.length > 0) setSelectedItemId(data[0].id);
    }
  }, []);

  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  const grant = async (body: Record<string, unknown>) => {
    if (!targetEmail) {
      setMessage("相手のメールアドレスを入力してください");
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, targetEmail }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("プレゼントを付与しました！");
    } else {
      const data = await res.json();
      setMessage(
        data.error === "USER_NOT_FOUND"
          ? "ユーザーが見つかりません"
          : data.error === "FORBIDDEN"
            ? "管理者権限がありません"
            : "付与に失敗しました",
      );
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-yellow-500/90 text-black text-xs font-bold shadow-lg"
      >
        <Shield size={14} />
        管理者パネル
      </button>
    );
  }

  return (
    <div className="bg-[#0f0f1a] rounded-xl border border-yellow-500/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
          <Shield size={16} />
          管理者パネル
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-white"
        >
          閉じる
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">
          相手のメールアドレス
        </label>
        <input
          type="email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          placeholder="user@example.com"
          className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-yellow-500/20 text-white text-sm outline-none focus:border-yellow-500/60"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Gift size={12} /> アイテムをプレゼント（交換不要・無条件）
        </p>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-yellow-500/20 text-white text-sm"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              [{item.category}] {item.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          className="w-full border-yellow-500/30"
          disabled={loading}
          onClick={() =>
            grant({ type: "item", itemId: selectedItemId })
          }
        >
          アイテムを付与
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">レベル設定</label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            min={1}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-yellow-500/20 text-white text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="self-end border-yellow-500/30"
          disabled={loading}
          onClick={() =>
            grant({ type: "level", level: parseInt(level, 10) })
          }
        >
          設定
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">EXP付与</label>
          <input
            type="number"
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            min={1}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-yellow-500/20 text-white text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="self-end border-yellow-500/30"
          disabled={loading}
          onClick={() =>
            grant({ type: "exp", amount: parseInt(exp, 10) })
          }
        >
          付与
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">ジェム付与</label>
          <input
            type="number"
            value={gems}
            onChange={(e) => setGems(e.target.value)}
            min={1}
            className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-yellow-500/20 text-white text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="self-end border-yellow-500/30"
          disabled={loading}
          onClick={() =>
            grant({ type: "gems", amount: parseInt(gems, 10) })
          }
        >
          付与
        </Button>
      </div>

      {message && (
        <p className="text-xs text-center text-yellow-400">{message}</p>
      )}
    </div>
  );
}
