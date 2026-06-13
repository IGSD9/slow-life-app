/** カイロソフト風施設・家具ドット絵 */

import {
  drawIsoVoxel,
  ISO_BLOCK_H,
  tileFootY,
} from "./isometric";
import { px, shade, snap, KAIRO_OUTLINE, KAIRO_OUTLINE_DARK, voxelFaces } from "./pixelDraw";

const WALL = { top: "#f8f0d8", left: "#e8d8b8", right: "#c8b898" };

function footY(sy: number): number {
  return tileFootY(sy);
}

function drawSignBoard(
  ctx: CanvasRenderingContext2D,
  sx: number,
  y: number,
  text: string,
  bg: string,
) {
  ctx.font = "bold 11px monospace";
  const tw = ctx.measureText(text).width;
  const bw = snap(Math.max(tw + 12, 24));
  const bh = 16;
  const bx = snap(sx - bw / 2);
  const by = snap(y);

  px(ctx, bx - 2, by + bh, 4, 6, "#886040");
  px(ctx, bx + bw - 2, by + bh, 4, 6, "#886040");
  px(ctx, bx, by, bw, bh, bg);
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, sx, by + bh / 2 + 1);
}

function drawColoredRoof(
  ctx: CanvasRenderingContext2D,
  sx: number,
  roofY: number,
  roofColor: string,
  width = 32,
) {
  const w = width;
  px(ctx, sx - w / 2, roofY, w, 6, shade(roofColor, -20));
  px(ctx, sx - w / 2 + 3, roofY - 6, w - 6, 6, roofColor);
  px(ctx, sx - w / 2 + 6, roofY - 10, w - 12, 4, shade(roofColor, 16));
  px(ctx, sx - w / 2, roofY, w, 2, KAIRO_OUTLINE);
  px(ctx, sx - w / 2 + 3, roofY - 6, w - 6, 2, KAIRO_OUTLINE_DARK);
}

function drawKairoFacility(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  roofColor: string,
  signText: string,
  signBg: string,
  accentColor: string,
) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, WALL.top, WALL.left, WALL.right, 2);

  const roofY = snap(fy - ISO_BLOCK_H * 2 - 18);
  drawColoredRoof(ctx, sx, roofY, roofColor);

  px(ctx, sx - 8, fy - ISO_BLOCK_H * 2 - 4, 16, 12, "#a8d8f8");
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(snap(sx - 8), snap(fy - ISO_BLOCK_H * 2 - 4), 16, 12);
  px(ctx, sx - 6, fy - ISO_BLOCK_H * 2 - 2, 4, 8, accentColor);
  px(ctx, sx + 2, fy - ISO_BLOCK_H * 2 - 2, 4, 8, shade(accentColor, -20));

  px(ctx, sx - 10, fy - 3, 20, 3, shade(roofColor, -30));
  drawSignBoard(ctx, sx, roofY - 24, signText, signBg);
}

/** 武器屋（テンプレ左） */
export function drawWeaponShopFacility(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
) {
  drawKairoFacility(ctx, sx, sy, "#4080d8", "武器", "#4080d8", "#5090e8");
  const fy = footY(sy);
  px(ctx, sx + 8, fy - ISO_BLOCK_H * 2 - 2, 2, 10, "#c0c0c8");
  px(ctx, sx + 6, fy - ISO_BLOCK_H * 2 - 4, 6, 3, "#886848");
}

/** 宿屋（テンプレ右） */
export function drawInnFacility(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
) {
  drawKairoFacility(ctx, sx, sy, "#e84848", "宿", "#e84848", "#f8a878");
  const fy = footY(sy);
  px(ctx, sx - 4, fy - ISO_BLOCK_H * 2 - 6, 8, 4, "#ffffff");
  px(ctx, sx - 2, fy - ISO_BLOCK_H * 2 - 4, 4, 2, "#f0e0d0");
}

/** PC協会（インタラクト用） */
export function drawPcDeskSprite(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  layers = 2,
) {
  drawKairoFacility(ctx, sx, sy, "#f0c030", "PC", "#f0a820", "#88e8f8");

  const fy = footY(sy);
  const monY = snap(fy - ISO_BLOCK_H * layers - 14);
  px(ctx, sx - 10, monY, 20, 14, "#505868");
  px(ctx, sx - 8, monY + 2, 16, 10, "#68e8d8");
  px(ctx, sx - 6, monY + 4, 4, 3, "#ffffff");

  px(ctx, sx - 12, fy - ISO_BLOCK_H * layers - 4, 24, 3, "#886848");
  for (let k = 0; k < 6; k++) {
    px(ctx, sx - 10 + k * 4, fy - ISO_BLOCK_H * layers - 3, 2, 2, k % 2 === 0 ? "#f0c030" : "#d0a020");
  }

  drawPcBadge(ctx, sx, snap(fy - ISO_BLOCK_H * layers - 32));
}

function drawPcBadge(ctx: CanvasRenderingContext2D, sx: number, y: number) {
  const label = "PC";
  ctx.font = "bold 10px monospace";
  const tw = ctx.measureText(label).width;
  const bw = snap(tw + 10);
  const bh = 14;
  const bx = snap(sx - bw / 2);
  const by = snap(y);

  px(ctx, bx, by, bw, bh, "#f0c030");
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = "#483830";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, sx, by + bh / 2 + 1);
  px(ctx, bx + 2, by + 2, 2, 2, "#fff8a0");
}

const COUNTER = voxelFaces("#c09848");

export function drawDeskSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, COUNTER.top, COUNTER.left, COUNTER.right, 1);
  px(ctx, sx - 12, fy - ISO_BLOCK_H - 2, 24, 3, shade(COUNTER.top, 14));
  drawSignBoard(ctx, sx, fy - ISO_BLOCK_H - 22, "店", "#e87848");
}

const CHAIR = voxelFaces("#e85848");

export function drawChairSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, CHAIR.top, CHAIR.left, CHAIR.right, 1);
  px(ctx, sx - 6, fy - ISO_BLOCK_H - 8, 12, 6, CHAIR.left);
  px(ctx, sx - 4, fy - ISO_BLOCK_H - 7, 8, 4, shade(CHAIR.top, 10));
  px(ctx, sx - 5, fy - 2, 10, 2, KAIRO_OUTLINE);
}

export function drawPlantSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, "#886040", "#684830", "#483020", 1);

  const top = snap(fy - ISO_BLOCK_H - 4);
  px(ctx, sx - 2, top - 18, 4, 8, "#684830");
  px(ctx, sx - 8, top - 14, 16, 12, "#48a830");
  px(ctx, sx - 6, top - 16, 12, 8, "#58c838");
  px(ctx, sx - 4, top - 20, 8, 6, "#68d848");
  px(ctx, sx - 10, top - 10, 6, 6, "#388028");
  px(ctx, sx + 4, top - 12, 5, 5, "#388028");
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(snap(sx - 8), top - 14, 16, 12);
}

export function drawFurnitureSprite(
  ctx: CanvasRenderingContext2D,
  spriteKey: string,
  sx: number,
  sy: number,
  layers = 1,
) {
  switch (spriteKey) {
    case "furniture_pc_01":
      drawPcDeskSprite(ctx, sx, sy, layers);
      break;
    case "furniture_desk_01":
      drawDeskSprite(ctx, sx, sy);
      break;
    case "furniture_chair_01":
      drawChairSprite(ctx, sx, sy);
      break;
    case "furniture_plant_01":
      drawPlantSprite(ctx, sx, sy);
      break;
    default:
      drawIsoVoxel(ctx, sx, sy, "#c8c8c8", "#a8a8a8", "#888888", layers);
  }
}

/** @deprecated drawWeaponShopFacility / drawInnFacility を使用 */
export function drawTemplateGamingDesk(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  _neonColor: string,
  _screenColor: string,
) {
  drawWeaponShopFacility(ctx, sx, sy);
}
