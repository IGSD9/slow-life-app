"use client";

import Link from "next/link";
import { X, Camera, Sparkles } from "lucide-react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import { LevelBar } from "@/components/ui/LevelBar";
import { Button } from "@/components/ui/Button";
import type { AvatarConfig } from "@/types/avatar";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
}

export interface CharacterDetailData {
  displayName: string;
  level: number;
  exp: number;
  isAdmin?: boolean;
  profileIconUrl?: string | null;
  portraitUrl?: string | null;
  title?: { name: string } | string | null;
  coins?: number;
  gems?: number;
  config: AvatarConfig;
  items: ItemInfo[];
}

interface CharacterDetailModalProps {
  open: boolean;
  onClose: () => void;
  data: CharacterDetailData;
  isOwnProfile?: boolean;
  onPortraitUpload?: (file: File) => void;
  uploadingPortrait?: boolean;
}

function titleName(title: CharacterDetailData["title"]) {
  if (!title) return null;
  return typeof title === "string" ? title : title.name;
}

export function CharacterDetailModal({
  open,
  onClose,
  data,
  isOwnProfile = false,
  onPortraitUpload,
  uploadingPortrait = false,
}: CharacterDetailModalProps) {
  if (!open) return null;

  const hqSrc = data.portraitUrl ?? data.profileIconUrl;
  const tName = titleName(data.title);

  const handlePortraitFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPortraitUpload) onPortraitUpload(file);
    e.target.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[95vh] overflow-y-auto bg-[#0f0f1a] rounded-t-2xl sm:rounded-2xl border border-[#e94560]/30 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>

        {/* 高画質イラストエリア */}
        <div className="relative aspect-[3/4] max-h-[55vh] overflow-hidden rounded-t-2xl sm:rounded-t-2xl bg-gradient-to-b from-[#87CEEB] via-[#b8e4f5] to-[#f5d0c0]">
          {hqSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hqSrc}
              alt={data.displayName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <Sparkles className="text-[#e94560]" size={32} />
              <p className="text-sm text-[#2d2d44] font-medium">
                {isOwnProfile
                  ? "高画質イラストを設定すると\nここに表示されます"
                  : "イラスト未設定"}
              </p>
              {isOwnProfile && (
                <p className="text-xs text-[#555]">
                  お気に入りのイラストや写真をアップロードできます
                </p>
              )}
            </div>
          )}

          {/* ゲーム内ドット絵（コーナー） */}
          <div className="absolute bottom-3 left-3 flex items-end gap-2">
            <div className="rounded-lg border-2 border-white/80 bg-[#1a1a2e]/90 p-1 shadow-lg">
              <AvatarRenderer config={data.config} items={data.items} size={56} />
            </div>
            <span className="text-[10px] text-white drop-shadow-md font-bold mb-1">
              ゲーム内の姿
            </span>
          </div>

          {isOwnProfile && onPortraitUpload && (
            <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs cursor-pointer hover:bg-black/80 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handlePortraitFile}
                disabled={uploadingPortrait}
              />
              <Camera size={14} />
              {uploadingPortrait ? "アップロード中..." : "高画質イラスト"}
            </label>
          )}
        </div>

        {/* プロフィール情報 */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {data.displayName}
              {data.isAdmin && (
                <span className="text-xs text-[#e94560]">[管理者]</span>
              )}
            </h2>
            {tName && <p className="text-sm text-yellow-400 mt-0.5">{tName}</p>}
          </div>

          <LevelBar level={data.level} exp={data.exp} />

          {(data.coins !== undefined || data.gems !== undefined) && (
            <div className="flex gap-4 text-sm">
              {data.coins !== undefined && (
                <span className="text-yellow-400">🪙 {data.coins}</span>
              )}
              {data.gems !== undefined && (
                <span className="text-blue-400">💎 {data.gems}</span>
              )}
            </div>
          )}

          {isOwnProfile && (
            <div className="flex gap-2">
              <Link href="/avatar" className="flex-1" onClick={onClose}>
                <Button size="sm" variant="secondary" className="w-full">
                  着せ替え
                </Button>
              </Link>
              <Link href="/profile" className="flex-1" onClick={onClose}>
                <Button size="sm" variant="secondary" className="w-full">
                  プロフィール
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
