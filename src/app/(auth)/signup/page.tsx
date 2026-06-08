"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // メール確認OFFの場合は即ログイン可能
    if (data.session) {
      window.location.href = "/room";
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-[#0f0f1a] rounded-xl border border-[#e94560]/30 p-6 text-center">
        <h2 className="text-lg font-bold text-[#e94560] mb-2">登録完了</h2>
        <p className="text-sm text-gray-300 mb-3">
          確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <div className="bg-[#1a1a2e] rounded-lg border border-yellow-500/30 p-3 mb-4 text-left">
          <p className="text-xs text-yellow-400 font-bold mb-1">⚠️ 重要</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            確認メールのリンクは
            <span className="text-white font-medium"> パソコン（開発中のPC）のブラウザ </span>
            で開いてください。スマホでは「サーバに接続できません」と表示されます。
          </p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          開発中は Supabase でメール確認を OFF にすると、すぐログインできます。
        </p>
        <Link href="/login">
          <Button>ログイン画面へ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f1a] rounded-xl border border-[#e94560]/30 p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-[#e94560]">
        新規登録
      </h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#e94560]/20 text-white focus:border-[#e94560] outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-300 block mb-1">パスワード（6文字以上）</label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "登録中..." : "アカウント作成"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-4">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-[#e94560] hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
