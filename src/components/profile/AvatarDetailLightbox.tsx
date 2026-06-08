"use client";

import { X, Gamepad2 } from "lucide-react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import type { AvatarConfig } from "@/types/avatar";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
}

interface AvatarDetailLightboxProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  config: AvatarConfig;
  items: ItemInfo[];
}

const PREVIEW_SIZE = 56;
const ZOOM_SIZE = 320;

export function AvatarDetailLightbox({
  open,
  onClose,
  displayName,
  config,
  items,
}: AvatarDetailLightboxProps) {
  if (!open) return null;

  const equipped = items.filter((item) =>
    Object.values(config).includes(item.id),
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
        aria-label="閉じる"
      >
        <X size={22} />
      </button>

      <div
        className="flex flex-col items-center gap-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-[#e94560]">
          <Gamepad2 size={18} />
          <span className="text-sm font-bold tracking-wide">ゲーム内の姿</span>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#e94560]/50 shadow-[0_0_40px_rgba(233,69,96,0.25)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2d1b4e] via-[#1a1a2e] to-[#0f0f1a]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)",
            }}
          />
          <div className="relative flex flex-col items-center py-10 px-6">
            <AvatarRenderer
              config={config}
              items={items}
              size={ZOOM_SIZE}
              className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-white">{displayName}</p>
          <p className="text-xs text-gray-400">
            ドット絵 · {PREVIEW_SIZE}px → {ZOOM_SIZE}px 拡大表示
          </p>
        </div>

        {equipped.length > 0 && (
          <div className="w-full rounded-xl bg-[#1a1a2e]/80 border border-[#e94560]/20 p-3">
            <p className="text-[10px] text-gray-500 mb-2">装備中</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {equipped.map((item) => (
                <span
                  key={item.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#e94560]/15 text-[#e94560] border border-[#e94560]/30"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-gray-600">タップで閉じる</p>
      </div>
    </div>
  );
}

/** キャラ詳細内のサムネイル（タップで拡大） */
export function InGameAvatarPreview({
  config,
  items,
  onClick,
}: {
  config: AvatarConfig;
  items: ItemInfo[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-end gap-2 text-left group"
      aria-label="ゲーム内の姿を拡大表示"
    >
      <div className="rounded-lg border-2 border-white/80 bg-[#1a1a2e]/90 p-1 shadow-lg transition-transform group-hover:scale-105 group-hover:border-[#e94560]/80">
        <AvatarRenderer config={config} items={items} size={PREVIEW_SIZE} />
      </div>
      <div className="mb-1">
        <span className="text-[10px] text-white drop-shadow-md font-bold block">
          ゲーム内の姿
        </span>
        <span className="text-[9px] text-white/70 drop-shadow-md">
          タップで拡大
        </span>
      </div>
    </button>
  );
}
