"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Email not confirmed"
          ? "メール確認が完了していません。確認メールのリンクをパソコンで開くか、下記の手順をご確認ください。"
          : error.message,
      );
      setLoading(false);
      return;
    }

    window.location.href = "/room";
  };

  return (
    <div className="bg-white rounded-xl border border-[#ff6b9d]/30 p-6">
      <h1 className="text-2xl font-bold text-center mb-1 text-[#ff6b9d]">
        スローライフ
      </h1>
      <p className="text-center text-sm text-[#9494b0] mb-6">
        GBA風ライフシミュレーション
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-sm text-[#6a6a88] block mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#fff0f6] border border-[#ffd6e8] text-[#4a4a6a] focus:border-[#ff6b9d] outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-[#6a6a88] block mb-1">パスワード</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <p className="text-center text-sm text-[#9494b0] mt-4">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-[#ff6b9d] hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
