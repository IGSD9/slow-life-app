/** カイロソフト「冒険ダンジョン村」風マイルームテンプレート */

import {
  drawIsoGrassTile,
  drawIsoPathTile,
  drawIsoVoxel,
  gridToScreen,
  ISO_BLOCK_H,
  ISO_TILE_H,
  ISO_TILE_W,
  LOFT_BOUNDS,
  shade,
} from "./isometric";
import { drawInnFacility, drawWeaponShopFacility } from "./furnitureSprites";
import { px, snap, KAIRO_OUTLINE, voxelFaces } from "./pixelDraw";

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
  loftFloor: "#78d058",
  loftEdge: "#886040",
  floorA: "#68c848",
  floorB: "#58b838",
  rampA: "#d0a858",
  rampB: "#c09848",
  rug: "#b0b0b8",
  rugBorder: "#888890",
  platform: "#488028",
  wall: "#d8b888",
  wallHi: "#f0d8a8",
  windowGlass: "#88d8f8",
  cityLight: "#f0e060",
  cityLight2: "#f0a040",
  desk: "#c09848",
  monitor: "#505868",
  couch: "#e87878",
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

/** カイロソフト風の青空＋雲＋遠景 */
export function drawLoFiBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const sky = ["#68b8f0", "#78c0f4", "#88c8f6", "#98d0f8"];
  const bandH = Math.ceil(height / sky.length);
  for (let i = 0; i < sky.length; i++) {
    px(ctx, 0, i * bandH, width, bandH, sky[i]);
  }

  const clouds = [
    [30, 18, 28, 10],
    [120, 28, 36, 12],
    [240, 14, 32, 10],
    [380, 22, 40, 11],
    [520, 16, 30, 9],
  ] as const;
  for (const [cx, cy, cw, ch] of clouds) {
    px(ctx, cx, cy + 2, cw, ch, "#ffffff");
    px(ctx, cx + 4, cy, cw - 8, ch - 2, "#f8fcff");
    px(ctx, cx + cw * 0.3, cy + ch - 2, cw * 0.4, 4, "#eef8ff");
  }

  const hillY = height * 0.55;
  for (let x = 0; x < width; x += 4) {
    const h = 24 + Math.sin(x * 0.04) * 12 + Math.sin(x * 0.09) * 6;
    px(ctx, x, hillY - h, 4, h + height * 0.5, "#58a838");
    px(ctx, x, hillY - h, 4, 4, "#68c848");
  }
  for (let x = 0; x < width; x += 6) {
    const th = 16 + Math.sin(x * 0.07 + 1) * 8;
    px(ctx, x + 2, hillY - th - 8, 4, th, "#388028");
    px(ctx, x + 3, hillY - th - 12, 6, 6, "#48a030");
  }
}

export const drawHousingBackground = drawLoFiBackground;

export function drawAmbientVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  px(ctx, 0, height - 6, width, 6, "rgba(72, 128, 40, 0.15)");
}

/** 部屋外周（草原） */
export function drawOutdoorPad(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  for (let y = -1; y <= gridH; y++) {
    for (let x = -1; x <= gridW; x++) {
      if (x >= 1 && x < gridW - 1 && y >= 1 && y < gridH) continue;
      const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, -0.5);
      drawIsoGrassTile(ctx, sx, sy, x + y + 3);
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
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let i = 0; i < 5; i++) {
    const fx = left.x - hw + i * ((right.x + hw - (left.x - hw)) / 4);
    px(ctx, fx, baseL + 4, 3, h - 6, shade(loftEdge, 16));
  }
}

/** 背面の遠景（村の向こうの丘と木） */
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
  const sceneTop = snap(baseY - h + 8);
  const sceneH = h - 16;
  const sceneLeft = snap(left.x - ISO_TILE_W * 0.2);
  const sceneW = snap(right.x - left.x + ISO_TILE_W * 0.4);

  px(ctx, sceneLeft - 4, sceneTop - 4, sceneW + 8, sceneH + 8, KAIRO_OUTLINE);
  px(ctx, sceneLeft, sceneTop, sceneW, sceneH, "#98d8f8");

  for (let i = 0; i < 6; i++) {
    const mx = sceneLeft + 10 + i * (sceneW / 6.5);
    const mh = 20 + (i % 3) * 8;
    px(ctx, mx, sceneTop + sceneH - mh, 8, mh, "#58a838");
    px(ctx, mx + 1, sceneTop + sceneH - mh - 8, 6, 8, "#48a030");
  }

  px(ctx, sceneLeft + 4, sceneTop + sceneH - 14, sceneW - 8, 14, "#68c848");
  for (let i = 0; i < 4; i++) {
    px(ctx, sceneLeft + 20 + i * 40, sceneTop + sceneH - 22, 12, 10, "#e8c848");
    px(ctx, sceneLeft + 24 + i * 40, sceneTop + sceneH - 20, 4, 6, "#f0e0a0");
  }

  ctx.strokeStyle = "#886848";
  ctx.lineWidth = 2;
  ctx.strokeRect(sceneLeft, sceneTop, sceneW, sceneH);
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
  for (let gy = 3; gy <= 8; gy += 2) {
    for (let gx = 4; gx <= 8; gx += 2) {
      if (isRugCell(gx, gy) || isRampCell(gx, gy)) continue;
      const { x: sx, y: sy } = gridToScreen(gx, gy, gridW, gridH, 0);
      if ((gx + gy) % 4 === 0) {
        px(ctx, sx - 1, sy + ISO_TILE_H * 0.8, 2, 2, "#f0e040");
      }
    }
  }
}

/** テンプレ施設（武器屋・宿屋） */
export function drawGamingDesks(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const left = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const right = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  drawWeaponShopFacility(ctx, left.x, left.y);
  drawInnFacility(ctx, right.x, right.y);
}

const INN_BED = voxelFaces("#e87878");

/** ロフトの宿泊エリア（ベッド） */
export function drawLoftCouch(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x, y } = COUCH_POS;
  const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, 1);
  const fy = sy + ISO_TILE_H;

  drawIsoVoxel(ctx, sx, sy, "#f0e0c0", "#e0d0b0", "#c8b898", 1);
  px(ctx, sx - 14, fy - ISO_BLOCK_H - 10, 28, 8, INN_BED.top);
  px(ctx, sx - 12, fy - ISO_BLOCK_H - 9, 24, 5, "#f8f0e8");
  px(ctx, sx - 10, fy - ISO_BLOCK_H - 8, 8, 4, "#ffffff");
  px(ctx, sx + 2, fy - ISO_BLOCK_H - 8, 8, 4, "#ffffff");
  px(ctx, sx - 14, fy - ISO_BLOCK_H - 10, 28, 2, KAIRO_OUTLINE);

  px(ctx, sx - 6, fy - ISO_BLOCK_H - 16, 12, 6, "#4080d8");
  px(ctx, sx - 4, fy - ISO_BLOCK_H - 15, 8, 4, "#5090e8");
  ctx.fillStyle = "#483830";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("宿", sx, fy - ISO_BLOCK_H - 11);
}

/** 広場の石畳タイル */
export function drawRugTile(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  drawIsoPathTile(ctx, sx, sy, 0);
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;

  px(ctx, sx - hw * 0.3, sy + hh * 0.7, 4, 3, "#a0a0a8");
  px(ctx, sx + hw * 0.1, sy + hh * 1.0, 3, 3, "#9898a0");
  px(ctx, sx - hw * 0.1, sy + hh * 1.25, 4, 3, "#b0b0b8");

  ctx.strokeStyle = ROOM_COLORS.rugBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw * 0.55), snap(sy + hh * 0.55));
  ctx.lineTo(snap(sx + hw * 0.55), snap(sy + hh * 1.45));
  ctx.stroke();
}

export function drawRampTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  idx: number,
) {
  drawIsoPathTile(ctx, sx, sy, idx);
}
