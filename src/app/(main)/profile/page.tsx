"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Settings, Check, X, Camera, Sparkles } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { CharacterDetailModal } from "@/components/profile/CharacterDetailModal";
import { ImageLightbox } from "@/components/profile/ImageLightbox";
import { ImageEditorModal } from "@/components/profile/ImageEditorModal";
import { LevelBar } from "@/components/ui/LevelBar";
import { Button } from "@/components/ui/Button";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { useImageEditorUpload } from "@/hooks/useImageEditorUpload";
import type { AvatarConfig } from "@/types/avatar";

interface AffinityEntry {
  displayName: string;
  affinity: number;
  level: number;
  title?: string;
}

interface OwnedTitle {
  id: string;
  name: string;
  description?: string | null;
}

interface ProfileData {
  id: string;
  profile: {
    displayName: string;
    level: number;
    exp: number;
    isAdmin: boolean;
    showAffinityRank: boolean;
    coins: number;
    gems: number;
    avatarConfig: AvatarConfig;
    profileIconUrl?: string | null;
    portraitUrl?: string | null;
    title: { id: string; name: string } | null;
  };
  ownedTitles: OwnedTitle[];
  inventory: { item: { id: string; name: string; spriteKey: string } }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ranking, setRanking] = useState<AffinityEntry[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/profile", { cache: "no-store" }),
      fetch("/api/profile/ranking", { cache: "no-store" }),
    ]);
    if (pRes.ok) setProfile(await pRes.json());
    if (rRes.ok) setRanking(await rRes.json());
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onImageUploaded = useCallback(
    async (kind: "icon" | "portrait", url: string) => {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            ...(kind === "icon"
              ? { profileIconUrl: url }
              : { portraitUrl: url }),
          },
        };
      });
      fetchData().catch(() => {});
    },
    [fetchData],
  );

  const { upload, uploading, error: uploadError } = useProfileImageUpload(onImageUploaded);
  const editor = useImageEditorUpload(upload);

  const toggleRanking = async () => {
    if (!profile) return;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showAffinityRank: !profile.profile.showAffinityRank }),
    });
    if (res.ok) fetchData();
  };

  const startEditName = () => {
    if (!profile) return;
    setNameInput(profile.profile.displayName);
    setNameError("");
    setEditingName(true);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameError("");
  };

  const changeEquippedTitle = async (titleId: string) => {
    setSavingTitle(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equippedTitleId: titleId === "" ? null : titleId,
      }),
    });
    setSavingTitle(false);
    if (res.ok) fetchData();
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("名前を入力してください");
      return;
    }
    if (trimmed.length > 20) {
      setNameError("20文字以内で入力してください");
      return;
    }

    setSavingName(true);
    setNameError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: trimmed }),
    });
    setSavingName(false);

    if (res.ok) {
      setEditingName(false);
      fetchData();
    } else {
      const result = await res.json();
      setNameError(
        result.error === "INVALID_NAME" ? "1〜20文字で入力してください" : "保存に失敗しました",
      );
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  const p = profile.profile;
  const items = profile.inventory.map((i) => i.item);
  const config = (p.avatarConfig ?? {}) as AvatarConfig;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto w-full pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#e94560]">プロフィール</h1>
        <Link href="/settings">
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Settings size={14} />
            個人設定
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3 bg-[#0f0f1a] rounded-xl border border-[#e94560]/20 p-6">
        <ProfileAvatar
          profileIconUrl={p.profileIconUrl}
          config={config}
          items={items}
          size={96}
          onClick={() => setLightboxOpen(true)}
        />
        <p className="text-[10px] text-gray-500 -mt-1">
          画像タップで拡大表示
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            size="sm"
            variant="secondary"
            className="w-full gap-2"
            onClick={() => editor.openPicker("icon")}
            disabled={uploading === "icon" || editor.saving}
          >
            <Camera size={16} />
            {p.profileIconUrl ? "プロフィール画像を変更" : "プロフィール画像を設定"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-full gap-2 text-[#e94560]"
            onClick={() => setDetailOpen(true)}
          >
            <Sparkles size={16} />
            キャラ詳細を見る
          </Button>
        </div>
        <input
          ref={editor.inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={editor.onFileChange}
        />
        {uploadError && (
          <p className="text-xs text-red-400 text-center">{uploadError}</p>
        )}
        <div className="text-center w-full max-w-xs">
          {editingName ? (
            <div className="space-y-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#e94560]/40 text-white text-center font-bold outline-none focus:border-[#e94560]"
              />
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={saveName} disabled={savingName} className="gap-1">
                  <Check size={14} />
                  {savingName ? "保存中..." : "保存"}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditName} className="gap-1">
                  <X size={14} />
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-bold text-lg flex items-center gap-1.5">
                {p.displayName}
                {p.isAdmin && (
                  <span className="text-xs text-[#e94560]">[管理者]</span>
                )}
              </h2>
              <button
                onClick={startEditName}
                className="p-1.5 rounded-md text-gray-400 hover:text-[#e94560] hover:bg-[#e94560]/10 transition-colors"
                aria-label="名前を編集"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
          {p.title && (
            <p className="text-sm text-yellow-400 mt-1">{p.title.name}</p>
          )}
        </div>

        {profile.ownedTitles.length > 0 && (
          <div className="w-full max-w-xs space-y-1.5">
            <label className="text-xs text-gray-400 block">表示する称号</label>
            <select
              value={p.title?.id ?? ""}
              onChange={(e) => changeEquippedTitle(e.target.value)}
              disabled={savingTitle}
              className="w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#e94560]/20 text-white text-sm outline-none focus:border-[#e94560] disabled:opacity-50"
            >
              <option value="">なし</option>
              {profile.ownedTitles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500">
              獲得した称号から選んでプロフィールに表示できます
            </p>
          </div>
        )}

        <div className="w-full max-w-xs">
          <LevelBar level={p.level} exp={p.exp} />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-400">🪙 {p.coins ?? 0}</span>
          <span className="text-blue-400">💎 {p.gems ?? 0}</span>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <Link href="/store" className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">ストア</Button>
          </Link>
          <Link href="/battle-pass" className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">バトルパス</Button>
          </Link>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-300">親密度ランキング</h3>
          <button
            onClick={toggleRanking}
            className="text-[10px] text-gray-400 underline"
          >
            {p.showAffinityRank ? "非公開にする" : "公開する"}
          </button>
        </div>
        {!p.showAffinityRank ? (
          <p className="text-sm text-gray-500 text-center py-4">非公開設定中</p>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            フレンドがいません
          </p>
        ) : (
          <div className="space-y-2">
            {ranking.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#0f0f1a] rounded-lg border border-[#e94560]/20 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#e94560] font-bold w-5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{r.displayName}</p>
                    {r.title && (
                      <p className="text-[10px] text-yellow-400">{r.title}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#e94560]">{r.affinity}</p>
                  <p className="text-[10px] text-gray-500">Lv.{r.level}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={p.profileIconUrl}
        alt={p.displayName}
        fallbackConfig={config}
        fallbackItems={items}
      />

      <ImageEditorModal
        open={editor.editorOpen}
        file={editor.editorFile}
        mode={editor.editorMode}
        onClose={editor.closeEditor}
        onSave={editor.saveEdited}
        saving={editor.saving || uploading === editor.pendingKind}
      />

      <CharacterDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        isOwnProfile
        onPortraitPick={() => editor.openPicker("portrait")}
        uploadingPortrait={uploading === "portrait" || (editor.saving && editor.pendingKind === "portrait")}
        data={{
          displayName: p.displayName,
          level: p.level,
          exp: p.exp,
          isAdmin: p.isAdmin,
          profileIconUrl: p.profileIconUrl,
          portraitUrl: p.portraitUrl,
          title: p.title,
          coins: p.coins,
          gems: p.gems,
          config,
          items,
        }}
      />
    </div>
  );
}
