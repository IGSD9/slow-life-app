"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setEmail(data.email ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, password }),
    });
    const result = await res.json();
    setSaving(false);

    if (res.ok) {
      setEmail(result.email);
      setNewEmail("");
      setPassword("");
      setMessage(
        result.pendingConfirmation
          ? "確認メールを送信しました。リンクを開いて変更を完了してください。"
          : "メールアドレスを変更しました。",
      );
    } else {
      const errors: Record<string, string> = {
        INVALID_EMAIL: "メールアドレスの形式が正しくありません",
        SAME_EMAIL: "現在と同じメールアドレスです",
        INVALID_PASSWORD: "パスワードが正しくありません",
        UPDATE_FAILED: result.message ?? "変更に失敗しました",
      };
      setError(errors[result.error] ?? "変更に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#9494b0]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center gap-2">
        <Link href="/profile" className="text-[#9494b0] hover:text-[#ff6b9d]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-[#ff6b9d] flex items-center gap-2">
          <Settings size={20} />
          個人設定
        </h1>
      </div>

      <section className="bg-white rounded-xl border border-[#ff6b9d]/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#6a6a88]">
          <Mail size={16} className="text-[#ff6b9d]" />
          <span className="font-bold">登録メールアドレス</span>
        </div>
        <p className="text-sm text-white break-all">{email}</p>
        <p className="text-[10px] text-[#8888a8]">
          アカウントの識別に使用します。部屋やプロフィールには表示されません。
        </p>
      </section>

      <section className="bg-white rounded-xl border border-[#ff6b9d]/20 p-4">
        <h2 className="text-sm font-bold text-[#6a6a88] mb-3">メールアドレスを変更</h2>
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label className="text-xs text-[#9494b0] block mb-1">新しいメールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[#fff0f6] border border-[#ffd6e8] text-[#4a4a6a] text-sm outline-none focus:border-[#ff6b9d]"
            />
          </div>
          <div>
            <label className="text-xs text-[#9494b0] block mb-1">現在のパスワード（確認用）</label>
            <PasswordInput value={password} onChange={setPassword} required />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {message && <p className="text-xs text-green-400">{message}</p>}
          <Button type="submit" size="sm" disabled={saving} className="w-full">
            {saving ? "変更中..." : "メールアドレスを変更"}
          </Button>
        </form>
      </section>
    </div>
  );
}
