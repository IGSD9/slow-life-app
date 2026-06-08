"use client";

import { useEffect, useRef } from "react";
import { AVATAR_LAYERS, type AvatarConfig } from "@/types/avatar";

interface ItemInfo {
  id: string;
  spriteKey: string;
  name: string;
}

interface AvatarRendererProps {
  config: AvatarConfig;
  items: ItemInfo[];
  size?: number;
  className?: string;
}

const LAYER_COLORS: Record<string, string> = {
  clothing_bottom_default: "#4a90d9",
  clothing_top_default: "#e94560",
  clothing_hat_default: "#f5a623",
  clothing_shoes_default: "#7b68ee",
  clothing_accessory_default: "#50e3c2",
};

export function AvatarRenderer({
  config,
  items,
  size = 64,
  className = "",
}: AvatarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemMap = new Map(items.map((i) => [i.id, i]));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;

    // 体（ベース）
    ctx.fillStyle = "#ffcba4";
    ctx.fillRect(size * 0.35, size * 0.2, size * 0.3, size * 0.35);

    // 顔
    ctx.fillStyle = "#ffcba4";
    ctx.fillRect(size * 0.3, size * 0.1, size * 0.4, size * 0.25);
    ctx.fillStyle = "#333";
    ctx.fillRect(size * 0.38, size * 0.2, size * 0.06, size * 0.06);
    ctx.fillRect(size * 0.56, size * 0.2, size * 0.06, size * 0.06);

    for (const layer of AVATAR_LAYERS) {
      const itemId = config[layer];
      if (!itemId) continue;
      const item = itemMap.get(itemId);
      if (!item) continue;

      const color = LAYER_COLORS[item.spriteKey] ?? "#888";
      const yOffset = layer === "bottom" ? 0.45 : layer === "top" ? 0.3 : layer === "shoes" ? 0.7 : layer === "hat" ? 0.02 : 0.15;
      const h = layer === "bottom" ? 0.3 : layer === "top" ? 0.25 : layer === "shoes" ? 0.15 : layer === "hat" ? 0.12 : 0.1;

      ctx.fillStyle = color;
      ctx.fillRect(size * 0.25, size * yOffset, size * 0.5, size * h);
    }
  }, [config, items, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixelated ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
