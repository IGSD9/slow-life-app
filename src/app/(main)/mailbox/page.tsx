"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMailRewardsSummary } from "@/lib/mailbox";
import type { MailMessageView } from "@/types/mailbox";

export default function MailboxPage() {
  const [mails, setMails] = useState<MailMessageView[]>([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchMailbox = useCallback(async () => {
    const res = await fetch("/api/mailbox");
    if (res.ok) {
      const data = await res.json();
      setMails(data.mails ?? []);
      setUnclaimedCount(data.unclaimedCount ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMailbox();
  }, [fetchMailbox]);

  const markRead = async (mailId: string) => {
    await fetch("/api/mailbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", mailId }),
    });
    setMails((prev) =>
      prev.map((m) => (m.id === mailId ? { ...m, isRead: true } : m)),
    );
  };

  const claim = async (mailId: string) => {
    setClaimingId(mailId);
    setMessage("");
    const res = await fetch("/api/mailbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", mailId }),
    });
    setClaimingId(null);
    if (res.ok) {
      setMessage("報酬を受け取りました！");
      fetchMailbox();
    } else {
      setMessage("受け取りに失敗しました");
    }
  };

  const claimAll = async () => {
    setMessage("");
    const res = await fetch("/api/mailbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim_all" }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessage(`${data.claimed ?? 0}件の報酬を受け取りました！`);
      fetchMailbox();
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
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#ff6b9d] flex items-center gap-2">
          <Mail size={20} />
          メールボックス
        </h1>
        {unclaimedCount > 0 && (
          <Button size="sm" onClick={claimAll} className="gap-1">
            <Gift size={14} />
            すべて受け取る
          </Button>
        )}
      </div>

      {message && (
        <p className="text-xs text-center text-[#ff6b9d]">{message}</p>
      )}

      {mails.length === 0 ? (
        <div className="text-center py-12 text-[#8888a8]">
          <Mail size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">メールはありません</p>
          <p className="text-[10px] mt-1">毎日ログインするとデイリー報酬が届きます</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mails.map((mail) => {
            const summary = formatMailRewardsSummary(mail.payload);
            return (
              <div
                key={mail.id}
                className={`rounded-xl border p-4 transition-colors ${
                  mail.isClaimed
                    ? "bg-white/50 border-[#ffd6e8]/50 opacity-70"
                    : mail.isRead
                      ? "bg-white border-[#ff6b9d]/20"
                      : "bg-white border-[#ff6b9d]/40 shadow-sm shadow-[#ff6b9d]/10"
                }`}
                onClick={() => !mail.isRead && markRead(mail.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!mail.isRead && !mail.isClaimed && (
                        <span className="w-2 h-2 rounded-full bg-[#ff6b9d] shrink-0" />
                      )}
                      <p className="text-sm font-bold truncate">{mail.subject}</p>
                    </div>
                    {mail.body && (
                      <p className="text-[10px] text-[#9494b0] mt-1">{mail.body}</p>
                    )}
                    <p className="text-xs text-yellow-400/90 mt-2">{summary}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(mail.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  {!mail.isClaimed && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        claim(mail.id);
                      }}
                      disabled={claimingId === mail.id}
                      className="shrink-0"
                    >
                      {claimingId === mail.id ? "..." : "受け取る"}
                    </Button>
                  )}
                  {mail.isClaimed && (
                    <span className="text-[10px] text-[#8888a8] shrink-0">受取済</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
