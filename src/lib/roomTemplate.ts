/** GBA風クラシック・マイルームテンプレート */

import {
  drawIsoFloorTile,
  drawIsoVoxel,
  gridToScreen,
  ISO_BLOCK_H,
  ISO_TILE_H,
  ISO_TILE_W,
  LOFT_BOUNDS,
  shade,
} from "./isometric";
import { drawTemplateGamingDesk } from "./furnitureSprites";
import { px, snap, voxelFaces } from "./pixelDraw";

export const RAMP_CELLS = [
  { x: 5, y: 4 },
  { x: 5, y: 5 },
] as const;

export const RUG_CELLS = [
  { x: 6, y: 7 },
  { x: 7, y: 7 },
] as const;

export const COUCH_POS = { x: 2, y: 2 };
export const DESK_LEFT = { x: 2, y: 9 };
export const DESK_RIGHT = { x: 9, y: 9 };

export const ROOM_COLORS = {
  loftFloor: "#b89868",
  loftEdge: "#786040",
  floorA: "#c8a868",
  floorB: "#a88048",
  rampA: "#b09058",
  rampB: "#987848",
  rug: "#6888a8",
  rugBorder: "#a0c0d8",
  platform: "#584028",
  wall: "#a89888",
  wallHi: "#c8c0b0",
  neonCyan: "#40d8f0",
  neonMagenta: "#e858c8",
  windowGlass: "#88c8e8",
  cityLight: "#f0c878",
  cityLight2: "#e8a050",
  desk: "#8b6914",
  monitor: "#3a4555",
  couch: "#6a4888",
};

export function isRugCell(gridX: number, gridY: number): boolean {
  return RUG_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

export function isRampCell(gridX: number, gridY: number): boolean {
  return RAMP_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

export function isStairCell(gridX: number, gridY: number): boolean {
  return isRampCell(gridX, gridY);
}

/** GBA風の昼空背景 */
export function drawLoFiBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bands = ["#78b8e8", "#88c4ee", "#98ccf0", "#a8d4f2"];
  const bandH = Math.ceil(height / bands.length);
  for (let i = 0; i < bands.length; i++) {
    px(ctx, 0, i * bandH, width, bandH, bands[i]);
  }
  for (let i = 0; i < 5; i++) {
    const cx = 40 + i * 72;
    px(ctx, cx, 16, 24, 8, "#ffffff");
    px(ctx, cx + 4, 14, 16, 6, "#f0f8ff");
  }
}

export const drawHousingBackground = drawLoFiBackground;

export function drawAmbientVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bands = [
    { y: 0, h: 4, a: 0.08 },
    { y: height - 8, h: 8, a: 0.12 },
  ];
  for (const b of bands) {
    px(ctx, 0, b.y, width, b.h, `rgba(40, 30, 20, ${b.a})`);
  }
}

/** 部屋外周（土台タイル） */
export function drawOutdoorPad(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  for (let y = -1; y <= gridH; y++) {
    for (let x = -1; x <= gridW; x++) {
      if (x >= 1 && x < gridW - 1 && y >= 1 && y < gridH) continue;
      const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, -0.5);
      const c = (x + y) % 2 === 0 ? "#483828" : "#584838";
      drawIsoFloorTile(ctx, sx, sy, c, false, false, x + y);
    }
  }
}

export const drawOutdoorCheckerPad = drawOutdoorPad;

export function drawWallSurfaceDetail(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  void ctx;
  void gridW;
  void gridH;
  void wallLayers;
}

/** ロフト手前段差 */
export function drawLoftFrontFace(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const hh = ISO_TILE_H / 2;
  const hw = ISO_TILE_W / 2;
  const h = ISO_BLOCK_H;
  const { loftEdge } = ROOM_COLORS;

  const left = gridToScreen(LOFT_BOUNDS.minX, LOFT_BOUNDS.maxY, gridW, gridH, 1);
  const right = gridToScreen(LOFT_BOUNDS.maxX, LOFT_BOUNDS.maxY, gridW, gridH, 1);
  const baseL = left.y + hh;
  const baseR = right.y + hh;

  ctx.beginPath();
  ctx.moveTo(snap(left.x - hw), snap(baseL));
  ctx.lineTo(snap(left.x - hw), snap(baseL + h));
  ctx.lineTo(snap(right.x + hw), snap(baseR + h));
  ctx.lineTo(snap(right.x + hw), snap(baseR));
  ctx.closePath();
  ctx.fillStyle = loftEdge;
  ctx.fill();
  ctx.strokeStyle = shade(loftEdge, -24);
  ctx.lineWidth = 2;
  ctx.stroke();

  const east = gridToScreen(LOFT_BOUNDS.maxX, LOFT_BOUNDS.minY, gridW, gridH, 1);
  const eastBot = gridToScreen(LOFT_BOUNDS.maxX, LOFT_BOUNDS.maxY, gridW, gridH, 1);
  const eTop = east.y + hh;
  const eBot = eastBot.y + hh;
  ctx.beginPath();
  ctx.moveTo(snap(east.x + hw), snap(eTop));
  ctx.lineTo(snap(east.x + hw), snap(eTop + h));
  ctx.lineTo(snap(eastBot.x + hw), snap(eBot + h));
  ctx.lineTo(snap(eastBot.x + hw), snap(eBot));
  ctx.closePath();
  ctx.fillStyle = shade(loftEdge, -16);
  ctx.fill();
}

/** 背面の窓（GBA風） */
export function drawRainyCityWindow(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * wallLayers;
  const left = gridToScreen(2, 0, gridW, gridH, 0);
  const right = gridToScreen(gridW - 3, 0, gridW, gridH, 0);
  const baseY = left.y + hh;
  const winTop = snap(baseY - h + 10);
  const winH = h - 20;
  const winLeft = snap(left.x - ISO_TILE_W * 0.25);
  const winW = snap(right.x - left.x + ISO_TILE_W * 0.5);

  px(ctx, winLeft - 6, winTop - 6, winW + 12, winH + 12, "#686058");
  px(ctx, winLeft, winTop, winW, winH, ROOM_COLORS.windowGlass);
  px(ctx, winLeft + 2, winTop + 2, winW - 4, winH - 4, "#a8d8f0");

  const { cityLight, cityLight2 } = ROOM_COLORS;
  for (let i = 0; i < 10; i++) {
    const bx = winLeft + 12 + (i % 5) * (winW / 5.5);
    const by = winTop + winH - 28 - Math.floor(i / 5) * 22;
    px(ctx, bx, by, 6, 8, i % 2 === 0 ? cityLight2 : cityLight);
  }

  ctx.strokeStyle = "#f0ece0";
  ctx.lineWidth = 3;
  ctx.strokeRect(winLeft, winTop, winW, winH);
  ctx.beginPath();
  ctx.moveTo(snap(winLeft + winW / 2), winTop);
  ctx.lineTo(snap(winLeft + winW / 2), winTop + winH);
  ctx.moveTo(winLeft, snap(winTop + winH / 2));
  ctx.lineTo(winLeft + winW, snap(winTop + winH / 2));
  ctx.stroke();

  px(ctx, winLeft + 4, winTop + 4, winW * 0.3, winH * 0.2, "rgba(255,255,255,0.15)");
}

export function drawWallNeonGlow(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  void ctx;
  void gridW;
  void gridH;
  void wallLayers;
}

export function drawFloorNeonReflections(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x: lx, y: ly } = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const { x: rx, y: ry } = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  const footL = ly + ISO_TILE_H;
  const footR = ry + ISO_TILE_H;

  px(ctx, lx - 20, footL, 40, 4, "rgba(64, 216, 240, 0.2)");
  px(ctx, rx - 20, footR, 40, 4, "rgba(232, 88, 200, 0.2)");
}

export function drawGamingDesks(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const left = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const right = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  drawTemplateGamingDesk(ctx, left.x, left.y, ROOM_COLORS.neonCyan, "#2a6a5a");
  drawTemplateGamingDesk(ctx, right.x, right.y, ROOM_COLORS.neonMagenta, "#5a2a5a");
}

const COUCH = voxelFaces(ROOM_COLORS.couch);

export function drawLoftCouch(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x, y } = COUCH_POS;
  const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, 1);
  const fy = sy + ISO_TILE_H;

  drawIsoVoxel(ctx, sx, sy, COUCH.top, COUCH.left, COUCH.right, 1);
  px(ctx, sx - 14, fy - ISO_BLOCK_H - 12, 28, 10, COUCH.left);
  px(ctx, sx - 12, fy - ISO_BLOCK_H - 11, 24, 4, COUCH.top);
  px(ctx, sx - 12, fy - ISO_BLOCK_H - 4, 24, 6, shade(COUCH.top, 12));
  px(ctx, sx - 14, fy - ISO_BLOCK_H - 6, 4, 8, COUCH.right);
  px(ctx, sx + 10, fy - ISO_BLOCK_H - 6, 4, 8, COUCH.right);
}

export function drawRugTile(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  drawIsoFloorTile(ctx, sx, sy, ROOM_COLORS.rug, false, false, 0);
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;

  ctx.strokeStyle = ROOM_COLORS.rugBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw * 0.7), snap(sy + hh * 0.45));
  ctx.lineTo(snap(sx + hw * 0.7), snap(sy + hh * 1.55));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw * 0.5), snap(sy + hh * 0.65));
  ctx.lineTo(snap(sx + hw * 0.5), snap(sy + hh * 1.35));
  ctx.stroke();

  px(ctx, sx - 4, sy + hh, 8, 4, "rgba(255,255,255,0.12)");
}

export function drawRampTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  idx: number,
) {
  const c = idx % 2 === 0 ? ROOM_COLORS.rampA : ROOM_COLORS.rampB;
  drawIsoFloorTile(ctx, sx, sy, shade(c, idx * 3), false, true, idx);
}
