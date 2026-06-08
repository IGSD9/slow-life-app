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

const OUTLINE = "#2d1f14";
const EYE = "#1e1e3a";
const EYE_WHITE = "#faf8f5";
const EYE_SHINE = "#ffffff";
const CHEEK = "#ffa8a0";
const HAIR_HI = "#7a5540";
const HAIR_SHADE = "#3d2818";
const SKIN_SHADE = "#e8a880";
const SHIRT_SHADE = "#c44d72";
const SHIRT_HI = "#ff8fb3";
const PANTS_SHADE = "#2d5090";
const PANTS_HI = "#5aa0d9";
const HAT_BAND = "#c0392b";

const SPRITE_W = 24;
const SPRITE_H = 34;
const SCALE = 2;

export const CHARACTER_DISPLAY_HEIGHT = SPRITE_H * SCALE;
export const CHARACTER_DISPLAY_WIDTH = SPRITE_W * SCALE;

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

function drawHat(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  hatColor: string,
  front: boolean,
) {
  const shade = shadeColor(hatColor, -18);
  if (front) {
    px(ctx, ox + 4, oy + 1, 16, 1, OUTLINE);
    px(ctx, ox + 2, oy + 2, 20, 2, hatColor);
    px(ctx, ox + 1, oy + 4, 22, 1, hatColor);
    px(ctx, ox + 0, oy + 5, 24, 1, OUTLINE);
    px(ctx, ox + 6, oy + 3, 12, 3, shade);
    px(ctx, ox + 7, oy + 5, 10, 1, HAT_BAND);
    px(ctx, ox + 8, oy + 0, 8, 2, hatColor);
    px(ctx, ox + 7, oy + 0, 10, 1, OUTLINE);
  } else {
    px(ctx, ox + 6, oy + 1, 12, 3, hatColor);
    px(ctx, ox + 5, oy + 4, 14, 1, shade);
    px(ctx, ox + 4, oy + 5, 16, 1, OUTLINE);
  }
}

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** 正面（参考: キャンプファイヤー風チビキャラ） */
function drawDown(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  if (c.hat) drawHat(ctx, ox, oy, c.hat, true);

  const hairY = c.hat ? 5 : 0;

  // 髪（後ろ）
  px(ctx, ox + 5, oy + hairY + 1, 14, 1, OUTLINE);
  px(ctx, ox + 4, oy + hairY + 2, 16, 2, c.hair);
  px(ctx, ox + 3, oy + hairY + 4, 18, 5, c.hair);
  px(ctx, ox + 4, oy + hairY + 4, 3, 4, HAIR_HI);
  px(ctx, ox + 14, oy + hairY + 5, 4, 3, HAIR_SHADE);
  // あほ毛
  px(ctx, ox + 11, oy + hairY + 0, 2, 2, c.hair);
  px(ctx, ox + 11, oy + hairY + 0, 2, 1, OUTLINE);

  // 顔
  px(ctx, ox + 4, oy + hairY + 7, 16, 1, OUTLINE);
  px(ctx, ox + 5, oy + hairY + 8, 14, 8, c.skin);
  px(ctx, ox + 4, oy + hairY + 9, 1, 6, OUTLINE);
  px(ctx, ox + 19, oy + hairY + 9, 1, 6, OUTLINE);
  px(ctx, ox + 7, oy + hairY + 14, 10, 1, OUTLINE);
  px(ctx, ox + 6, oy + hairY + 10, 2, 4, SKIN_SHADE);
  px(ctx, ox + 16, oy + hairY + 10, 2, 4, SKIN_SHADE);

  // 前髪
  px(ctx, ox + 6, oy + hairY + 7, 4, 2, c.hair);
  px(ctx, ox + 14, oy + hairY + 7, 4, 2, c.hair);
  px(ctx, ox + 10, oy + hairY + 7, 4, 1, c.hair);

  // 目
  px(ctx, ox + 7, oy + hairY + 10, 4, 4, EYE_WHITE);
  px(ctx, ox + 13, oy + hairY + 10, 4, 4, EYE_WHITE);
  px(ctx, ox + 8, oy + hairY + 11, 2, 3, EYE);
  px(ctx, ox + 14, oy + hairY + 11, 2, 3, EYE);
  px(ctx, ox + 8, oy + hairY + 11, 1, 1, EYE_SHINE);
  px(ctx, ox + 14, oy + hairY + 11, 1, 1, EYE_SHINE);
  px(ctx, ox + 7, oy + hairY + 10, 4, 1, OUTLINE);
  px(ctx, ox + 13, oy + hairY + 10, 4, 1, OUTLINE);

  // ほっぺ・口
  px(ctx, ox + 6, oy + hairY + 13, 2, 1, CHEEK);
  px(ctx, ox + 16, oy + hairY + 13, 2, 1, CHEEK);
  px(ctx, ox + 11, oy + hairY + 14, 2, 1, "#c07070");

  const bodyY = oy + hairY + 15;

  // シャツ（襟付き）
  px(ctx, ox + 5, bodyY, 14, 1, OUTLINE);
  px(ctx, ox + 4, bodyY + 1, 16, 8, c.shirt);
  px(ctx, ox + 3, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 20, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 8, bodyY + 1, 8, 2, SHIRT_HI);
  px(ctx, ox + 7, bodyY + 2, 2, 2, EYE_WHITE);
  px(ctx, ox + 15, bodyY + 2, 2, 2, EYE_WHITE);
  px(ctx, ox + 6, bodyY + 5, 12, 3, SHIRT_SHADE);

  // 腕
  px(ctx, ox + 1, bodyY + 2, 3, 5, c.skin);
  px(ctx, ox + 20, bodyY + 2, 3, 5, c.skin);
  px(ctx, ox + 1, bodyY + 2, 1, 5, OUTLINE);
  px(ctx, ox + 22, bodyY + 2, 1, 5, OUTLINE);
  px(ctx, ox + 2, bodyY + 4, 1, 2, SKIN_SHADE);

  // スカート風ボトム
  const skirtY = bodyY + 9;
  px(ctx, ox + 5, skirtY, 14, 1, OUTLINE);
  px(ctx, ox + 4, skirtY + 1, 16, 6, c.pants);
  px(ctx, ox + 3, skirtY + 2, 1, 4, OUTLINE);
  px(ctx, ox + 20, skirtY + 2, 1, 4, OUTLINE);
  px(ctx, ox + 5, skirtY + 2, 14, 2, PANTS_HI);
  px(ctx, ox + 6, skirtY + 5, 12, 1, PANTS_SHADE);
  px(ctx, ox + 4, skirtY + 7, 16, 1, OUTLINE);

  // 足
  const legY = skirtY + 8;
  px(ctx, ox + 6, legY, 5, 3, c.shoes);
  px(ctx, ox + 13, legY, 5, 3, c.shoes);
  px(ctx, ox + 6, legY, 5, 1, OUTLINE);
  px(ctx, ox + 13, legY, 5, 1, OUTLINE);
  px(ctx, ox + 7, legY + 2, 3, 1, shadeColor(c.shoes, -20));
  px(ctx, ox + 14, legY + 2, 3, 1, shadeColor(c.shoes, -20));
}

function drawUp(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  if (c.hat) drawHat(ctx, ox, oy, c.hat, false);

  const hairY = c.hat ? 5 : 0;
  px(ctx, ox + 5, oy + hairY + 1, 14, 1, OUTLINE);
  px(ctx, ox + 4, oy + hairY + 2, 16, 7, c.hair);
  px(ctx, ox + 5, oy + hairY + 3, 4, 5, HAIR_HI);
  px(ctx, ox + 4, oy + hairY + 9, 16, 1, HAIR_SHADE);

  const bodyY = oy + hairY + 10;
  px(ctx, ox + 5, bodyY, 14, 1, OUTLINE);
  px(ctx, ox + 4, bodyY + 1, 16, 8, c.shirt);
  px(ctx, ox + 3, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 20, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 6, bodyY + 3, 12, 3, SHIRT_SHADE);

  px(ctx, ox + 1, bodyY + 2, 3, 4, c.skin);
  px(ctx, ox + 20, bodyY + 2, 3, 4, c.skin);

  const skirtY = bodyY + 9;
  px(ctx, ox + 5, skirtY, 14, 1, OUTLINE);
  px(ctx, ox + 6, skirtY + 1, 12, 5, c.pants);
  px(ctx, ox + 6, skirtY + 6, 5, 2, c.shoes);
  px(ctx, ox + 13, skirtY + 6, 5, 2, c.shoes);
}

function drawLeft(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  if (c.hat) {
    px(ctx, ox + 5, oy + 1, 14, 2, c.hat);
    px(ctx, ox + 4, oy + 3, 16, 1, shadeColor(c.hat, -18));
  }

  px(ctx, ox + 6, oy + 3, 12, 4, c.hair);
  px(ctx, ox + 5, oy + 4, 3, 2, HAIR_HI);
  px(ctx, ox + 7, oy + 7, 12, 1, OUTLINE);
  px(ctx, ox + 8, oy + 8, 10, 8, c.skin);
  px(ctx, ox + 7, oy + 9, 1, 6, OUTLINE);
  px(ctx, ox + 13, oy + 11, 3, 3, EYE_WHITE);
  px(ctx, ox + 14, oy + 12, 2, 2, EYE);
  px(ctx, ox + 14, oy + 12, 1, 1, EYE_SHINE);
  px(ctx, ox + 12, oy + 14, 2, 1, CHEEK);

  const bodyY = oy + 16;
  px(ctx, ox + 6, bodyY, 13, 1, OUTLINE);
  px(ctx, ox + 5, bodyY + 1, 14, 8, c.shirt);
  px(ctx, ox + 4, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 7, bodyY + 3, 8, 3, SHIRT_SHADE);
  px(ctx, ox + 2, bodyY + 2, 3, 5, c.skin);

  px(ctx, ox + 7, bodyY + 9, 10, 6, c.pants);
  px(ctx, ox + 6, bodyY + 15, 6, 2, c.shoes);
}

function drawRight(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  c: PixelCharacterColors,
) {
  if (c.hat) {
    px(ctx, ox + 5, oy + 1, 14, 2, c.hat);
    px(ctx, ox + 4, oy + 3, 16, 1, shadeColor(c.hat, -18));
  }

  px(ctx, ox + 6, oy + 3, 12, 4, c.hair);
  px(ctx, ox + 14, oy + 4, 3, 2, HAIR_SHADE);
  px(ctx, ox + 7, oy + 7, 12, 1, OUTLINE);
  px(ctx, ox + 6, oy + 8, 10, 8, c.skin);
  px(ctx, ox + 16, oy + 9, 1, 6, OUTLINE);
  px(ctx, ox + 8, oy + 11, 3, 3, EYE_WHITE);
  px(ctx, ox + 8, oy + 12, 2, 2, EYE);
  px(ctx, ox + 8, oy + 12, 1, 1, EYE_SHINE);
  px(ctx, ox + 10, oy + 14, 2, 1, CHEEK);

  const bodyY = oy + 16;
  px(ctx, ox + 5, bodyY, 13, 1, OUTLINE);
  px(ctx, ox + 5, bodyY + 1, 14, 8, c.shirt);
  px(ctx, ox + 19, bodyY + 2, 1, 6, OUTLINE);
  px(ctx, ox + 9, bodyY + 3, 8, 3, SHIRT_SHADE);
  px(ctx, ox + 19, bodyY + 2, 3, 5, c.skin);

  px(ctx, ox + 7, bodyY + 9, 10, 6, c.pants);
  px(ctx, ox + 12, bodyY + 15, 6, 2, c.shoes);
}

/** 床タイル上にGBA風キャラを描画（足元を sx, footY に合わせる） */
export function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  sx: number,
  footY: number,
  direction: Direction,
  colors: PixelCharacterColors,
) {
  const drawW = CHARACTER_DISPLAY_WIDTH;
  const ox = Math.round(sx - drawW / 2);
  const oy = Math.round(footY - SPRITE_H * SCALE);

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const shadowGrad = ctx.createRadialGradient(sx, footY + 2, 0, sx, footY + 2, 22);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.45)");
  shadowGrad.addColorStop(0.6, "rgba(0,0,0,0.2)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(sx, footY + 2, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const draw =
    direction === "up"
      ? drawUp
      : direction === "left"
        ? drawLeft
        : direction === "right"
          ? drawRight
          : drawDown;

  ctx.translate(ox, oy);
  ctx.scale(SCALE, SCALE);
  draw(ctx, 0, 0, colors);
  ctx.restore();
}
