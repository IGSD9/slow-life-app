/** GBA風ドット絵キャラクター（部屋・アバター共通） */

import type { AvatarConfig } from "@/types/avatar";
import type { Direction } from "@/types/room";

export interface PixelCharacterColors {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  hat?: string;
}

export const DEFAULT_CHAR_COLORS: PixelCharacterColors = {
  skin: "#ffcba4",
  hair: "#5c3d2e",
  shirt: "#ff6b9d",
  pants: "#4a90d9",
  shoes: "#7b68ee",
};

const LAYER_COLORS: Record<string, string> = {
  clothing_bottom_default: "#4a90d9",
  clothing_top_default: "#ff6b9d",
  clothing_hat_default: "#f5a623",
  clothing_shoes_default: "#7b68ee",
  clothing_accessory_default: "#50e3c2",
};

export function resolveCharacterColors(
  config: AvatarConfig | undefined,
  itemSpriteById: Map<string, string>,
): PixelCharacterColors {
  const colors = { ...DEFAULT_CHAR_COLORS };
  if (!config) return colors;

  const topKey = config.top ? itemSpriteById.get(config.top) : undefined;
  const bottomKey = config.bottom ? itemSpriteById.get(config.bottom) : undefined;
  const shoesKey = config.shoes ? itemSpriteById.get(config.shoes) : undefined;
  const hatKey = config.hat ? itemSpriteById.get(config.hat) : undefined;

  if (topKey && LAYER_COLORS[topKey]) colors.shirt = LAYER_COLORS[topKey];
  if (bottomKey && LAYER_COLORS[bottomKey]) colors.pants = LAYER_COLORS[bottomKey];
  if (shoesKey && LAYER_COLORS[shoesKey]) colors.shoes = LAYER_COLORS[shoesKey];
  if (hatKey && LAYER_COLORS[hatKey]) colors.hat = LAYER_COLORS[hatKey];

  return colors;
}

const OUTLINE = "#2a1a10";
const EYE = "#1a1a2e";
const EYE_SHINE = "#ffffff";
const CHEEK = "#ffb0a0";
const SHIRT_SHADE = "#d4567a";
const PANTS_SHADE = "#3060a8";
const HAIR_SHADE = "#3d2818";
const SKIN_SHADE = "#e8a880";

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawDown(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  // 頭・髪
  px(ctx, ox + 5, oy + 0, 6, 1, OUTLINE);
  px(ctx, ox + 4, oy + 1, 8, 1, OUTLINE);
  px(ctx, ox + 3, oy + 2, 10, 1, c.hair);
  px(ctx, ox + 3, oy + 2, 10, 1, OUTLINE);
  px(ctx, ox + 2, oy + 3, 12, 4, c.hair);
  px(ctx, ox + 3, oy + 3, 10, 3, c.hair);
  px(ctx, ox + 4, oy + 5, 8, 1, HAIR_SHADE);

  if (c.hat) {
    px(ctx, ox + 2, oy + 1, 12, 2, c.hat);
    px(ctx, ox + 1, oy + 3, 14, 1, c.hat);
    px(ctx, ox + 1, oy + 3, 14, 1, OUTLINE);
  }

  // 顔
  px(ctx, ox + 3, oy + 5, 10, 5, c.skin);
  px(ctx, ox + 2, oy + 6, 1, 3, OUTLINE);
  px(ctx, ox + 13, oy + 6, 1, 3, OUTLINE);
  px(ctx, ox + 4, oy + 10, 8, 1, OUTLINE);

  // 目
  px(ctx, ox + 4, oy + 7, 3, 3, EYE);
  px(ctx, ox + 9, oy + 7, 3, 3, EYE);
  px(ctx, ox + 5, oy + 7, 1, 1, EYE_SHINE);
  px(ctx, ox + 10, oy + 7, 1, 1, EYE_SHINE);

  // ほっぺ
  px(ctx, ox + 3, oy + 9, 2, 1, CHEEK);
  px(ctx, ox + 11, oy + 9, 2, 1, CHEEK);

  // 体（シャツ）
  px(ctx, ox + 3, oy + 11, 10, 1, OUTLINE);
  px(ctx, ox + 2, oy + 12, 12, 5, c.shirt);
  px(ctx, ox + 2, oy + 12, 1, 5, OUTLINE);
  px(ctx, ox + 13, oy + 12, 1, 5, OUTLINE);
  px(ctx, ox + 4, oy + 14, 8, 2, SHIRT_SHADE);

  // 腕
  px(ctx, ox + 0, oy + 12, 2, 4, c.skin);
  px(ctx, ox + 14, oy + 12, 2, 4, c.skin);
  px(ctx, ox + 0, oy + 12, 1, 4, OUTLINE);
  px(ctx, ox + 15, oy + 12, 1, 4, OUTLINE);

  // スカート/パンツ
  px(ctx, ox + 3, oy + 17, 10, 1, OUTLINE);
  px(ctx, ox + 3, oy + 18, 4, 3, c.pants);
  px(ctx, ox + 9, oy + 18, 4, 3, c.pants);
  px(ctx, ox + 4, oy + 19, 3, 1, PANTS_SHADE);
  px(ctx, ox + 9, oy + 19, 3, 1, PANTS_SHADE);

  // 足
  px(ctx, ox + 3, oy + 21, 4, 2, c.shoes);
  px(ctx, ox + 9, oy + 21, 4, 2, c.shoes);
  px(ctx, ox + 3, oy + 21, 4, 1, OUTLINE);
  px(ctx, ox + 9, oy + 21, 4, 1, OUTLINE);
}

function drawUp(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  px(ctx, ox + 5, oy + 0, 6, 1, OUTLINE);
  px(ctx, ox + 3, oy + 1, 10, 1, c.hair);
  px(ctx, ox + 2, oy + 2, 12, 5, c.hair);
  px(ctx, ox + 3, oy + 6, 10, 1, HAIR_SHADE);
  if (c.hat) {
    px(ctx, ox + 2, oy + 0, 12, 3, c.hat);
    px(ctx, ox + 1, oy + 3, 14, 1, OUTLINE);
  }

  px(ctx, ox + 3, oy + 7, 10, 4, c.shirt);
  px(ctx, ox + 2, oy + 7, 1, 4, OUTLINE);
  px(ctx, ox + 13, oy + 7, 1, 4, OUTLINE);
  px(ctx, ox + 4, oy + 8, 8, 2, SHIRT_SHADE);

  px(ctx, ox + 0, oy + 8, 2, 3, c.skin);
  px(ctx, ox + 14, oy + 8, 2, 3, c.skin);

  px(ctx, ox + 3, oy + 11, 10, 1, OUTLINE);
  px(ctx, ox + 4, oy + 12, 8, 3, c.pants);
  px(ctx, ox + 3, oy + 15, 4, 2, c.shoes);
  px(ctx, ox + 9, oy + 15, 4, 2, c.shoes);
}

function drawLeft(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  px(ctx, ox + 4, oy + 1, 8, 2, c.hair);
  px(ctx, ox + 3, oy + 3, 9, 4, c.hair);
  px(ctx, ox + 5, oy + 5, 1, 2, HAIR_SHADE);
  if (c.hat) {
    px(ctx, ox + 3, oy + 0, 10, 2, c.hat);
  }

  px(ctx, ox + 5, oy + 5, 6, 5, c.skin);
  px(ctx, ox + 5, oy + 5, 6, 5, OUTLINE);
  px(ctx, ox + 8, oy + 7, 2, 2, EYE);
  px(ctx, ox + 9, oy + 7, 1, 1, EYE_SHINE);
  px(ctx, ox + 7, oy + 9, 2, 1, CHEEK);

  px(ctx, ox + 3, oy + 11, 10, 5, c.shirt);
  px(ctx, ox + 2, oy + 11, 1, 5, OUTLINE);
  px(ctx, ox + 5, oy + 13, 5, 2, SHIRT_SHADE);

  px(ctx, ox + 1, oy + 12, 2, 3, c.skin);
  px(ctx, ox + 4, oy + 16, 5, 3, c.pants);
  px(ctx, ox + 3, oy + 19, 5, 2, c.shoes);
}

function drawRight(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  px(ctx, ox + 4, oy + 1, 8, 2, c.hair);
  px(ctx, ox + 4, oy + 3, 9, 4, c.hair);
  if (c.hat) {
    px(ctx, ox + 3, oy + 0, 10, 2, c.hat);
  }

  px(ctx, ox + 5, oy + 5, 6, 5, c.skin);
  px(ctx, ox + 5, oy + 5, 6, 5, OUTLINE);
  px(ctx, ox + 5, oy + 7, 2, 2, EYE);
  px(ctx, ox + 5, oy + 7, 1, 1, EYE_SHINE);
  px(ctx, ox + 7, oy + 9, 2, 1, CHEEK);

  px(ctx, ox + 3, oy + 11, 10, 5, c.shirt);
  px(ctx, ox + 13, oy + 11, 1, 5, OUTLINE);
  px(ctx, ox + 6, oy + 13, 5, 2, SHIRT_SHADE);

  px(ctx, ox + 13, oy + 12, 2, 3, c.skin);
  px(ctx, ox + 8, oy + 16, 5, 3, c.pants);
  px(ctx, ox + 8, oy + 19, 5, 2, c.shoes);
}

const SPRITE_W = 16;
const SPRITE_H = 23;
const SCALE = 2;

/** 床タイル上にGBA風キャラを描画（足元を sx, footY に合わせる） */
export function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  sx: number,
  footY: number,
  direction: Direction,
  colors: PixelCharacterColors,
) {
  const drawW = SPRITE_W * SCALE;
  const ox = Math.round(sx - drawW / 2);
  const oy = Math.round(footY - SPRITE_H * SCALE);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 足元の影
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(sx, footY + 1, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const draw =
    direction === "up"
      ? drawUp
      : direction === "left"
        ? drawLeft
        : direction === "right"
          ? drawRight
          : drawDown;

  draw(ctx, ox, oy, colors);
  ctx.restore();
}
