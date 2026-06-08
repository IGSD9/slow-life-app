"use client";

import { Camera } from "lucide-react";
import { AvatarRenderer } from "@/components/avatar/AvatarRenderer";
import type { AvatarConfig } from "@/types/avatar";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
}

interface ProfileAvatarProps {
  profileIconUrl?: string | null;
  config: AvatarConfig;
  items: ItemInfo[];
  size?: number;
  onClick?: () => void;
  editable?: boolean;
  onUpload?: (file: File) => void;
  uploading?: boolean;
  className?: string;
}

export function ProfileAvatar({
  profileIconUrl,
  config,
  items,
  size = 48,
  onClick,
  editable = false,
  onUpload,
  uploading = false,
  className = "",
}: ProfileAvatarProps) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = "";
  };

  const inner = profileIconUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profileIconUrl}
      alt=""
      width={size}
      height={size}
      className="w-full h-full object-cover"
    />
  ) : (
    <AvatarRenderer config={config} items={items} size={size} className="w-full h-full" />
  );

  const Wrapper = onClick || editable ? "button" : "div";

  return (
    <Wrapper
      type={onClick || editable ? "button" : undefined}
      onClick={onClick}
      className={`relative shrink-0 rounded-full overflow-hidden border-2 border-[#e94560]/40 bg-[#1a1a2e] ${onClick || editable ? "cursor-pointer hover:border-[#e94560]/70 transition-colors" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-label={onClick ? "キャラ詳細を開く" : editable ? "アイコンを変更" : undefined}
    >
      {inner}
      {editable && onUpload && (
        <label
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
          />
          {uploading ? (
            <span className="text-[10px] text-white">...</span>
          ) : (
            <Camera size={Math.max(14, size * 0.28)} className="text-white" />
          )}
        </label>
      )}
    </Wrapper>
  );
}
