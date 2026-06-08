"use client";

import { X } from "lucide-react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import type { AvatarConfig } from "@/types/avatar";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
}

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  alt?: string;
  /** 画像未設定時にドット絵を拡大表示 */
  fallbackConfig?: AvatarConfig;
  fallbackItems?: ItemInfo[];
}

export function ImageLightbox({
  open,
  onClose,
  imageUrl,
  alt = "プロフィール画像",
  fallbackConfig,
  fallbackItems = [],
}: ImageLightboxProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#ff6b9d]/30 backdrop-blur-sm p-4"
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
        className="relative max-w-[min(90vw,420px)] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={imageUrl}
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        ) : fallbackConfig ? (
          <div className="rounded-2xl border-4 border-[#ff6b9d]/40 bg-[#fff0f6] p-6">
            <AvatarRenderer
              config={fallbackConfig}
              items={fallbackItems}
              size={200}
            />
            <p className="text-center text-sm text-[#9494b0] mt-3">
              プロフィール画像未設定
            </p>
          </div>
        ) : null}
      </div>

      <p className="absolute bottom-6 text-xs text-[#8888a8]">タップで閉じる</p>
    </div>
  );
}
