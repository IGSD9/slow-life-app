"use client";

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
  className?: string;
}

export function ProfileAvatar({
  profileIconUrl,
  config,
  items,
  size = 48,
  onClick,
  className = "",
}: ProfileAvatarProps) {
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

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative shrink-0 rounded-full overflow-hidden border-2 border-[#e94560]/40 bg-[#1a1a2e] ${onClick ? "cursor-pointer hover:border-[#e94560]/70 hover:scale-[1.02] transition-all" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-label={onClick ? "プロフィール画像を拡大表示" : undefined}
    >
      {inner}
    </Wrapper>
  );
}
