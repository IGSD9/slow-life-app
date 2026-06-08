"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Users, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import {
  CharacterDetailModal,
  type CharacterDetailData,
} from "@/components/profile/CharacterDetailModal";
import { usePresence } from "@/hooks/usePresence";
import type { AvatarConfig } from "@/types/avatar";

interface FriendEntry {
  friendshipId: string;
  userId: string;
  displayName: string;
  level: number;
  affinity: number;
  isAdmin: boolean;
  title?: string;
  profileIconUrl?: string | null;
  isMarried: boolean;
  marriageProposalFrom: string | null;
}

interface PendingEntry {
  friendshipId: string;
  userId: string;
  displayName: string;
  email?: string;
}

interface FriendsData {
  me: { id: string; email: string };
  friends: FriendEntry[];
  pendingReceived: PendingEntry[];
  pendingSent: PendingEntry[];
}

export default function FriendsPage() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [friendDetail, setFriendDetail] = useState<CharacterDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { isOnline } = usePresence(data?.me.id ?? null);

  const openFriendDetail = async (userId: string) => {
    const res = await fetch(`/api/profile/${userId}`);
    if (!res.ok) return;
    const p = await res.json();
    setFriendDetail({
      displayName: p.displayName,
      level: p.level,
      exp: p.exp,
      isAdmin: p.isAdmin,
      profileIconUrl: p.profileIconUrl,
      portraitUrl: p.portraitUrl,
      title: p.title,
      config: (p.avatarConfig ?? {}) as AvatarConfig,
      items: p.inventory?.map((inv: { item: { id: string; spriteKey: string; name: string } }) => inv.item) ?? [],
    });
    setDetailOpen(true);
  };

  const fetchFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = async () => {
    if (!email) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email }),
    });
    setLoading(false);
    const result = await res.json();
    if (res.ok) {
      setMessage(`${result.friend.displayName} さんに申請を送りました`);
      setEmail("");
      fetchFriends();
    } else {
      const errors: Record<string, string> = {
        USER_NOT_FOUND: "ユーザーが見つかりません",
        SELF: "自分自身は追加できません",
        ALREADY_FRIENDS: "すでにフレンドです",
        ALREADY_PENDING: "申請済みです",
      };
      setMessage(errors[result.error] ?? "申請に失敗しました");
    }
  };

  const respond = async (action: "accept" | "reject", friendshipId: string) => {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, friendshipId }),
    });
    fetchFriends();
  };

  const marriageAction = async (action: string, friendId: string) => {
    const res = await fetch("/api/marriage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, friendId }),
    });
    const result = await res.json();
    if (res.ok) {
      setMessage(action === "accept" ? "結婚おめでとう！" : "送信しました");
    } else {
      const errors: Record<string, string> = {
        INSUFFICIENT_AFFINITY: "親密度1000以上が必要です",
        ALREADY_MARRIED: "すでに結婚済みです",
        PROPOSAL_PENDING: "申請済みです",
      };
      setMessage(errors[result.error] ?? "操作に失敗しました");
    }
    fetchFriends();
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <h1 className="text-lg font-bold text-[#ff6b9d] flex items-center gap-2">
        <Users size={20} />
        フレンド
      </h1>

      <div className="bg-white rounded-xl border border-[#ff6b9d]/20 p-4 space-y-3">
        <p className="text-xs text-[#9494b0] flex items-center gap-1">
          <UserPlus size={14} />
          フレンド申請（相手のメールアドレス）
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="w-full px-3 py-2 rounded-lg bg-[#fff0f6] border border-[#ffd6e8] text-[#4a4a6a] text-sm outline-none focus:border-[#ff6b9d]"
        />
        <Button size="sm" onClick={sendRequest} disabled={loading} className="w-full">
          申請を送る
        </Button>
        {message && <p className="text-xs text-center text-[#ff6b9d]">{message}</p>}
      </div>

      {data && data.pendingReceived.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-[#6a6a88] mb-2">届いた申請</h2>
          <div className="space-y-2">
            {data.pendingReceived.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center justify-between bg-white rounded-lg border border-[#ff6b9d]/20 p-3"
              >
                <div>
                  <p className="text-sm font-bold">{r.displayName}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respond("accept", r.friendshipId)}>
                    承認
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => respond("reject", r.friendshipId)}
                  >
                    拒否
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data && data.pendingSent.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-[#6a6a88] mb-2">送信済み申請</h2>
          <div className="space-y-2">
            {data.pendingSent.map((s) => (
              <div
                key={s.friendshipId}
                className="bg-white rounded-lg border border-[#ffd6e8] p-3"
              >
                <p className="text-sm text-[#9494b0]">{s.displayName} — 承認待ち</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold text-[#6a6a88] mb-2">
          フレンド一覧 ({data?.friends.length ?? 0})
        </h2>
        {!data || data.friends.length === 0 ? (
          <p className="text-sm text-[#8888a8] text-center py-6">フレンドがいません</p>
        ) : (
          <div className="space-y-2">
            {data.friends.map((f) => (
              <div
                key={f.friendshipId}
                className="flex items-center justify-between bg-white rounded-lg border border-[#ff6b9d]/20 p-3"
              >
                <div className="flex items-center gap-2">
                  <Circle
                    size={8}
                    className={isOnline(f.userId) ? "text-green-400 fill-green-400" : "text-gray-600 fill-gray-600"}
                  />
                  <ProfileAvatar
                    profileIconUrl={f.profileIconUrl}
                    config={{}}
                    items={[]}
                    size={36}
                    onClick={() => openFriendDetail(f.userId)}
                  />
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1">
                      {f.displayName}
                      {f.isAdmin && (
                        <span className="text-[9px] text-[#ff6b9d]">[管理者]</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[#8888a8]">
                      Lv.{f.level} · 親密度 {f.affinity}
                      {f.title && ` · ${f.title}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Link href={`/room/${f.userId}`}>
                    <Button size="sm" variant="secondary">
                      お邪魔する
                    </Button>
                  </Link>
                  {f.isMarried ? (
                    <span className="text-[10px] text-pink-400">💍 結婚中</span>
                  ) : f.marriageProposalFrom === data?.me.id ? (
                    <span className="text-[10px] text-[#9494b0]">プロポーズ送信済</span>
                  ) : f.marriageProposalFrom === f.userId ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => marriageAction("accept", f.userId)}>
                        💍 承認
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => marriageAction("reject", f.userId)}>
                        拒否
                      </Button>
                    </div>
                  ) : f.affinity >= 1000 ? (
                    <Button size="sm" variant="ghost" onClick={() => marriageAction("propose", f.userId)}>
                      💍 プロポーズ
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {friendDetail && (
        <CharacterDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          data={friendDetail}
        />
      )}
    </div>
  );
}
