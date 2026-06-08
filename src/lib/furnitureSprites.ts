/** GBA風家具ドット絵スプライト */

import {
  drawIsoVoxel,
  gridToScreen,
  ISO_BLOCK_H,
  ISO_TILE_H,
  tileFootY,
} from "./isometric";
import { px, shade, snap, voxelFaces } from "./pixelDraw";

const DESK = voxelFaces("#8b6914");
const DESK_DARK = voxelFaces("#6b4e10");
const CHAIR = voxelFaces("#c0392b");
const PLANT = voxelFaces("#27ae60");
const PC_BODY = voxelFaces("#4a5568");
const MONITOR = { top: "#5a6a7a", left: "#3a4555", right: "#2a3545", edge: "#1a2535" };
const SCREEN_ON = "#4af0c8";
const SCREEN_GLOW = "#2a8a78";

function footY(sy: number): number {
  return tileFootY(sy);
}

/** PCデスク（インタラクト用・ネオンバッジ付き） */
export function drawPcDeskSprite(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  layers = 2,
) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, DESK.top, DESK.left, DESK.right, layers);

  const topY = snap(fy - ISO_BLOCK_H * layers - ISO_TILE_H * 0.15);
  px(ctx, sx - 14, topY, 28, 3, DESK.edge);
  px(ctx, sx - 12, topY + 3, 24, 2, shade(DESK.top, 10));

  const monY = snap(fy - ISO_BLOCK_H * layers - 22);
  px(ctx, sx - 12, monY, 24, 18, MONITOR.left);
  px(ctx, sx - 10, monY + 2, 20, 14, MONITOR.right);
  px(ctx, sx - 8, monY + 4, 16, 10, SCREEN_ON);
  px(ctx, sx - 6, monY + 6, 4, 3, "#ffffff");
  px(ctx, sx - 2, monY + 8, 6, 2, SCREEN_GLOW);

  px(ctx, sx - 10, monY + 16, 20, 2, PC_BODY.left);
  px(ctx, sx - 6, monY + 18, 12, 4, PC_BODY.right);

  px(ctx, sx - 14, fy - ISO_BLOCK_H * layers - 6, 28, 4, "#2a2a3a");
  for (let k = 0; k < 7; k++) {
    px(ctx, sx - 12 + k * 4, fy - ISO_BLOCK_H * layers - 5, 2, 2, k % 2 === 0 ? "#4af0ff" : "#3a9090");
  }

  drawPcBadge(ctx, sx, snap(fy - ISO_BLOCK_H * layers - 30));
}

function drawPcBadge(ctx: CanvasRenderingContext2D, sx: number, y: number) {
  const label = "PC";
  ctx.font = "bold 10px monospace";
  const tw = ctx.measureText(label).width;
  const bw = snap(tw + 10);
  const bh = 14;
  const bx = snap(sx - bw / 2);
  const by = snap(y);

  px(ctx, bx, by, bw, bh, "#1a2838");
  px(ctx, bx, by, bw, 2, "#4af0ff");
  px(ctx, bx, by + bh - 2, bw, 2, "#2a6878");
  px(ctx, bx, by, 2, bh, "#4af0ff");
  px(ctx, bx + bw - 2, by, 2, bh, "#2a6878");

  ctx.fillStyle = "#4af0ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, sx, by + bh / 2 + 1);

  px(ctx, bx - 2, by + 2, 2, 2, "#4af0ff");
  px(ctx, bx + bw, by + 2, 2, 2, "#4af0ff");
  px(ctx, bx + 2, by - 2, 2, 2, "#7affff");
  px(ctx, bx + bw - 4, by - 2, 2, 2, "#7affff");
}

/** 木製デスク */
export function drawDeskSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, DESK.top, DESK.left, DESK.right, 1);
  px(ctx, sx - 10, snap(fy - ISO_BLOCK_H - 2), 20, 2, shade(DESK.top, 14));
  px(ctx, sx - 8, snap(fy - ISO_BLOCK_H), 16, 1, DESK.edge);
}

/** 椅子 */
export function drawChairSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, CHAIR.top, CHAIR.left, CHAIR.right, 1);
  px(ctx, sx - 6, snap(fy - ISO_BLOCK_H - 8), 12, 6, CHAIR.left);
  px(ctx, sx - 4, snap(fy - ISO_BLOCK_H - 7), 8, 4, shade(CHAIR.top, 10));
  px(ctx, sx - 5, snap(fy - 2), 10, 2, CHAIR.right);
}

/** 観葉植物 */
export function drawPlantSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const fy = footY(sy);
  drawIsoVoxel(ctx, sx, sy, "#8b5a2b", "#6b4020", "#4a3018", 1);
  px(ctx, sx - 4, snap(fy - ISO_BLOCK_H - 2), 8, 4, "#6b4020");

  const potTop = snap(fy - ISO_BLOCK_H - 4);
  px(ctx, sx - 3, potTop - 14, 6, 6, PLANT.top);
  px(ctx, sx - 5, potTop - 12, 4, 4, shade(PLANT.top, 12));
  px(ctx, sx + 1, potTop - 10, 4, 5, PLANT.left);
  px(ctx, sx - 1, potTop - 16, 2, 4, shade(PLANT.top, 20));
  px(ctx, sx - 6, potTop - 8, 3, 3, PLANT.right);
  px(ctx, sx + 3, potTop - 13, 3, 3, PLANT.left);
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
      drawIsoVoxel(ctx, sx, sy, "#888888", "#666666", "#444444", layers);
  }
}

/** テンプレ用ゲーミングデスク（左=シアン / 右=マゼンタ） */
export function drawTemplateGamingDesk(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  neonColor: string,
  screenColor: string,
) {
  drawPcDeskSprite(ctx, sx, sy, 1);
  const fy = footY(sy);
  const monY = snap(fy - ISO_BLOCK_H - 20);
  px(ctx, sx - 8, monY + 4, 16, 10, screenColor);
  px(ctx, sx - 14, fy - 3, 28, 3, neonColor);
  px(ctx, sx - 12, fy - 1, 24, 2, shade(neonColor, -30));
}

export function gridFootScreen(
  gridX: number,
  gridY: number,
  gridW: number,
  gridH: number,
  z = 0,
) {
  const { x: sx, y: sy } = gridToScreen(gridX, gridY, gridW, gridH, z);
  return { sx, sy, footY: footY(sy) };
}
