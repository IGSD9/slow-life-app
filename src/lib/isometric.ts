/** アイソメトリック（2:1）座標変換・GBA風ピクセル描画 */

import { px, shade, snap, KAIRO_OUTLINE } from "./pixelDraw";

/** 1マス ≈ 48px 相当（菱形幅96・高48） */
export const ISO_TILE_W = 96;
export const ISO_TILE_H = 48;
export const ISO_BLOCK_H = 40;
export const ISO_WALL_LAYERS = 5;
export const WALL_CAP = 10;

/** 奥左ロフト */
export const LOFT_BOUNDS = { minX: 1, maxX: 4, minY: 1, maxY: 3 };

export function isLoftCell(gridX: number, gridY: number): boolean {
  return (
    gridX >= LOFT_BOUNDS.minX &&
    gridX <= LOFT_BOUNDS.maxX &&
    gridY >= LOFT_BOUNDS.minY &&
    gridY <= LOFT_BOUNDS.maxY
  );
}

export function floorElevation(gridX: number, gridY: number): number {
  return isLoftCell(gridX, gridY) ? 1 : 0;
}

export function isDeckCell(gridX: number, gridY: number): boolean {
  return isLoftCell(gridX, gridY);
}

export function tileFootY(sy: number): number {
  return snap(sy + ISO_TILE_H);
}

export interface IsoPoint {
  x: number;
  y: number;
}

export interface GridPos {
  gridX: number;
  gridY: number;
  gridZ?: number;
}

export function computeOrigin(gridW: number, gridH: number): IsoPoint {
  return {
    x: snap(gridH * (ISO_TILE_W / 2) + 24),
    y: snap(ISO_WALL_LAYERS * ISO_BLOCK_H + WALL_CAP + 40),
  };
}

export function gridToScreen(
  gridX: number,
  gridY: number,
  gridW: number,
  gridH: number,
  gridZ?: number,
): IsoPoint {
  const z = gridZ ?? floorElevation(gridX, gridY);
  const origin = computeOrigin(gridW, gridH);
  return {
    x: snap(origin.x + (gridX - gridY) * (ISO_TILE_W / 2)),
    y: snap(origin.y + (gridX + gridY) * (ISO_TILE_H / 2) - z * ISO_BLOCK_H),
  };
}

export function screenToGrid(
  sx: number,
  sy: number,
  gridW: number,
  gridH: number,
): GridPos | null {
  const origin = computeOrigin(gridW, gridH);
  const rx = sx - origin.x;
  const ry = sy - origin.y;
  const gx = (rx / (ISO_TILE_W / 2) + ry / (ISO_TILE_H / 2)) / 2;
  const gy = (ry / (ISO_TILE_H / 2) - rx / (ISO_TILE_W / 2)) / 2;
  const gridX = Math.floor(gx + 0.5);
  const gridY = Math.floor(gy + 0.5);
  if (gridX < 0 || gridX >= gridW || gridY < 0 || gridY >= gridH) return null;
  return { gridX, gridY };
}

export function canvasSize(gridW: number, gridH: number) {
  const origin = computeOrigin(gridW, gridH);
  const w = origin.x + gridW * (ISO_TILE_W / 2) + 32;
  const h = origin.y + (gridW + gridH) * (ISO_TILE_H / 2) + ISO_WALL_LAYERS * ISO_BLOCK_H + 36;
  return { width: Math.ceil(w), height: Math.ceil(h) };
}

export function depthKey(gridX: number, gridY: number, z = 0) {
  return gridX + gridY + z * 0.01;
}

function isoTilePath(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
) {
  ctx.beginPath();
  ctx.moveTo(snap(sx), snap(sy));
  ctx.lineTo(snap(sx + hw), snap(sy + hh));
  ctx.lineTo(snap(sx), snap(sy + hh * 2));
  ctx.lineTo(snap(sx - hw), snap(sy + hh));
  ctx.closePath();
}

/** 草タイル（冒険ダンジョン村風） */
export function drawIsoGrassTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  variant = 0,
  highlight = false,
) {
  const grassA = highlight ? "#78d858" : "#68c848";
  const grassB = highlight ? "#68c848" : "#58b838";
  const c = variant % 2 === 0 ? grassA : grassB;

  drawIsoFloorTile(ctx, sx, sy, c, false, false, variant);

  const hh = ISO_TILE_H / 2;
  const hw = ISO_TILE_W / 2;
  const dot = variant % 3 === 0 ? "#48a028" : "#509830";
  px(ctx, sx - hw * 0.25, sy + hh * 0.6, 2, 2, dot);
  px(ctx, sx + hw * 0.1, sy + hh * 1.1, 2, 2, dot);
  px(ctx, sx - hw * 0.05, sy + hh * 1.35, 3, 2, shade(c, -12));

  if (variant % 5 === 0) {
    px(ctx, sx + hw * 0.2, sy + hh * 0.85, 2, 2, "#f0e040");
    px(ctx, sx + hw * 0.22, sy + hh * 0.82, 2, 1, "#ffffff");
  }
}

/** 土の道タイル */
export function drawIsoPathTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  variant = 0,
  highlight = false,
) {
  const pathA = highlight ? "#e0b868" : "#d0a858";
  const pathB = highlight ? "#d0a858" : "#c09848";
  const c = variant % 2 === 0 ? pathA : pathB;
  drawIsoFloorTile(ctx, sx, sy, c, false, false, variant);

  const hh = ISO_TILE_H / 2;
  px(ctx, sx - 4, sy + hh * 0.8, 3, 2, shade(c, -18));
  px(ctx, sx + 2, sy + hh * 1.2, 4, 2, shade(c, -14));
  px(ctx, sx - 6, sy + hh * 1.4, 2, 2, shade(c, -22));
}

/** 木目ドット模様を菱形上面に描画 */
function drawWoodGrain(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  hw: number,
  hh: number,
  variant: number,
) {
  const dark = variant % 2 === 0 ? "#8a6838" : "#705028";
  const light = variant % 2 === 0 ? "#d8b878" : "#c0a060";
  const knot = "#584020";

  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    ctx.beginPath();
    ctx.moveTo(snap(sx - hw * 0.55 + t * 4), snap(sy + hh * (0.45 + t * 0.35)));
    ctx.lineTo(snap(sx + hw * 0.55 - t * 2), snap(sy + hh * (1.15 + t * 0.35)));
    ctx.stroke();
  }

  px(ctx, sx - hw * 0.2, sy + hh * 0.7, 3, 2, knot);
  px(ctx, sx + hw * 0.15, sy + hh * 1.2, 2, 2, knot);
  px(ctx, sx - hw * 0.05, sy + hh * 1.0, 4, 1, light);
}

/** 床タイル（木目ドット絵） */
export function drawIsoFloorTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  highlight = false,
  plank = false,
  variant = 0,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const top = highlight ? shade(color, 18) : color;

  isoTilePath(ctx, sx, sy, hw, hh);
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = shade(color, -36);
  ctx.lineWidth = 2;
  ctx.stroke();

  if (plank) {
    drawWoodGrain(ctx, sx, sy, hw, hh, variant);
  }

  ctx.strokeStyle = shade(top, 22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw * 0.1), snap(sy + hh * 0.9));
  ctx.lineTo(snap(sx + hw * 0.45), snap(sy + hh * 1.45));
  ctx.stroke();
}

/** レンガドット模様 */
function drawBrickPattern(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  base: string,
) {
  const mortar = shade(base, -28);
  const brickA = shade(base, 8);
  const brickB = shade(base, -10);
  const rowH = 8;
  const colW = 14;

  ctx.fillStyle = mortar;
  ctx.fillRect(snap(x0), snap(y0), snap(x1 - x0), snap(y1 - y0));

  for (let row = 0; y0 + row * rowH < y1; row++) {
    const offset = row % 2 === 0 ? 0 : colW / 2;
    for (let col = 0; x0 + col * colW + offset < x1; col++) {
      const bx = snap(x0 + col * colW + offset + 1);
      const by = snap(y0 + row * rowH + 1);
      const bw = Math.min(colW - 2, snap(x1) - bx);
      const bh = Math.min(rowH - 2, snap(y1) - by);
      if (bw <= 0 || bh <= 0) continue;
      ctx.fillStyle = (row + col) % 2 === 0 ? brickA : brickB;
      ctx.fillRect(bx, by, bw, bh);
    }
  }
}

/** 3面ボクセル（左上光源・フラット色） */
export function drawIsoVoxel(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  top: string,
  left: string,
  right: string,
  layers = 1,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * layers;
  const baseY = sy + hh;

  ctx.beginPath();
  ctx.moveTo(snap(sx - hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx), snap(baseY - h));
  ctx.lineTo(snap(sx + hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx), snap(baseY - h + hh * 2));
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = shade(top, -40);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(snap(sx - hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx - hw), snap(baseY + hh));
  ctx.lineTo(snap(sx), snap(baseY + hh * 2));
  ctx.lineTo(snap(sx), snap(baseY - h + hh * 2));
  ctx.closePath();
  ctx.fillStyle = left;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(snap(sx + hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx + hw), snap(baseY + hh));
  ctx.lineTo(snap(sx), snap(baseY + hh * 2));
  ctx.lineTo(snap(sx), snap(baseY - h + hh * 2));
  ctx.closePath();
  ctx.fillStyle = right;
  ctx.fill();

  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx), snap(baseY - h));
  ctx.lineTo(snap(sx + hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx + hw), snap(baseY + hh));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(snap(sx - hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx - hw), snap(baseY + hh));
  ctx.lineTo(snap(sx), snap(baseY + hh * 2));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(snap(sx + hw), snap(baseY - h + hh));
  ctx.lineTo(snap(sx + hw), snap(baseY + hh));
  ctx.lineTo(snap(sx), snap(baseY + hh * 2));
  ctx.stroke();
}

/** @deprecated drawIsoVoxel を使用 */
export function drawIsoBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers = 1,
) {
  drawIsoVoxel(
    ctx,
    sx,
    sy,
    shade(color, 28),
    shade(color, -6),
    shade(color, -32),
    layers,
  );
}

export function drawDeckRiser(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
) {
  drawIsoBlock(ctx, sx, sy, color, 1);
}

/** 木製フェンス模様 */
function drawWoodPlankPattern(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  base: string,
) {
  const gap = shade(base, -24);
  const plankA = shade(base, 10);
  const plankB = shade(base, -6);
  const rowH = 10;

  ctx.fillStyle = gap;
  ctx.fillRect(snap(x0), snap(y0), snap(x1 - x0), snap(y1 - y0));

  for (let row = 0; y0 + row * rowH < y1; row++) {
    const by = snap(y0 + row * rowH + 1);
    const bh = Math.min(rowH - 2, snap(y1) - by);
    if (bh <= 0) continue;
    ctx.fillStyle = row % 2 === 0 ? plankA : plankB;
    ctx.fillRect(snap(x0 + 2), by, snap(x1 - x0 - 4), bh);
    ctx.fillStyle = shade(gap, -10);
    ctx.fillRect(snap(x0 + 2), by + bh - 1, snap(x1 - x0 - 4), 1);
  }
}

/** 背面壁（木製フェンス＋厚み） */
export function drawContinuousBackWall(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  color: string,
  layers: number,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * layers;
  const x0 = 0;
  const x1 = gridW - 2;

  const left = gridToScreen(x0, 0, gridW, gridH, 0);
  const right = gridToScreen(x1, 0, gridW, gridH, 0);
  const baseL = left.y + hh;
  const baseR = right.y + hh;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(snap(left.x - hw), snap(baseL - h + hh));
  ctx.lineTo(snap(left.x), snap(baseL - h));
  ctx.lineTo(snap(right.x), snap(baseR - h));
  ctx.lineTo(snap(right.x + hw), snap(baseR - h + hh));
  ctx.lineTo(snap(right.x + hw), snap(baseR - h + hh + WALL_CAP));
  ctx.lineTo(snap(left.x - hw), snap(baseL - h + hh + WALL_CAP));
  ctx.closePath();
  ctx.clip();
  drawWoodPlankPattern(
    ctx,
    left.x - hw,
    baseL - h,
    right.x + hw,
    baseR + hh,
    color,
  );
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(snap(left.x - hw), snap(baseL - h + hh));
  ctx.lineTo(snap(left.x - hw), snap(baseL + hh));
  ctx.lineTo(snap(right.x + hw), snap(baseR + hh));
  ctx.lineTo(snap(right.x + hw), snap(baseR - h + hh));
  ctx.closePath();
  ctx.fillStyle = shade(color, -18);
  ctx.fill();
  ctx.strokeStyle = shade(color, -40);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(snap(left.x - hw), snap(baseL - h + hh));
  ctx.lineTo(snap(left.x), snap(baseL - h + hh * 2));
  ctx.lineTo(snap(left.x), snap(baseL + hh * 2));
  ctx.lineTo(snap(left.x - hw), snap(baseL + hh));
  ctx.closePath();
  ctx.fillStyle = shade(color, -34);
  ctx.fill();

  ctx.fillStyle = shade(color, 24);
  ctx.beginPath();
  ctx.moveTo(snap(left.x - hw), snap(baseL - h + hh));
  ctx.lineTo(snap(right.x + hw), snap(baseR - h + hh));
  ctx.lineTo(snap(right.x + hw), snap(baseR - h + hh + WALL_CAP));
  ctx.lineTo(snap(left.x - hw), snap(baseL - h + hh + WALL_CAP));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** 左側壁（木製＋厚み） */
export function drawContinuousLeftWall(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  color: string,
  layers: number,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * layers;
  const y0 = 0;
  const y1 = gridH - 1;

  const back = gridToScreen(0, y0, gridW, gridH, 0);
  const front = gridToScreen(0, y1, gridW, gridH, 0);
  const baseB = back.y + hh;
  const baseF = front.y + hh;

  const wood = shade(color, 4);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(snap(back.x - hw), snap(baseB - h + hh));
  ctx.lineTo(snap(back.x), snap(baseB - h));
  ctx.lineTo(snap(front.x), snap(baseF - h));
  ctx.lineTo(snap(front.x - hw), snap(baseF - h + hh));
  ctx.lineTo(snap(front.x - hw), snap(baseF - h + hh + WALL_CAP));
  ctx.lineTo(snap(back.x - hw), snap(baseB - h + hh + WALL_CAP));
  ctx.closePath();
  ctx.clip();

  const x0 = back.x - hw;
  const yTop = baseB - h;
  const x1 = back.x + hw * 0.3;
  const yBot = baseF + hh;
  drawWoodPlankPattern(ctx, x0, yTop, x1, yBot, wood);
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(snap(back.x - hw), snap(baseB - h + hh));
  ctx.lineTo(snap(back.x - hw), snap(baseB + hh));
  ctx.lineTo(snap(front.x - hw), snap(baseF + hh));
  ctx.lineTo(snap(front.x - hw), snap(baseF - h + hh));
  ctx.closePath();
  ctx.fillStyle = shade(color, -28);
  ctx.fill();
  ctx.strokeStyle = shade(color, -44);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = shade(color, 14);
  ctx.beginPath();
  ctx.moveTo(snap(back.x - hw), snap(baseB - h + hh));
  ctx.lineTo(snap(front.x - hw), snap(baseF - h + hh));
  ctx.lineTo(snap(front.x - hw), snap(baseF - h + hh + WALL_CAP));
  ctx.lineTo(snap(back.x - hw), snap(baseB - h + hh + WALL_CAP));
  ctx.closePath();
  ctx.fill();
}

/** 背面壁と左壁の角（0,0）を隙間なく結合 */
export function drawWallCornerJoin(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  color: string,
  layers: number,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * layers;

  const corner = gridToScreen(0, 0, gridW, gridH, 0);
  const base = corner.y + hh;

  ctx.beginPath();
  ctx.moveTo(snap(corner.x - hw), snap(base - h + hh));
  ctx.lineTo(snap(corner.x), snap(base - h));
  ctx.lineTo(snap(corner.x), snap(base + hh));
  ctx.lineTo(snap(corner.x - hw), snap(base + hh));
  ctx.closePath();
  ctx.fillStyle = shade(color, -30);
  ctx.fill();
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(snap(corner.x - hw), snap(base - h + hh));
  ctx.lineTo(snap(corner.x), snap(base - h + hh * 2));
  ctx.lineTo(snap(corner.x), snap(base + hh * 2));
  ctx.lineTo(snap(corner.x - hw), snap(base + hh));
  ctx.closePath();
  ctx.fillStyle = shade(color, -38);
  ctx.fill();

  ctx.fillStyle = shade(color, 20);
  ctx.beginPath();
  ctx.moveTo(snap(corner.x - hw), snap(base - h + hh));
  ctx.lineTo(snap(corner.x), snap(base - h + hh));
  ctx.lineTo(snap(corner.x), snap(base - h + hh + WALL_CAP));
  ctx.lineTo(snap(corner.x - hw), snap(base - h + hh + WALL_CAP));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawIsoPatternWall(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers: number,
  withWindow = false,
  clipRightEdge = false,
) {
  drawIsoBlock(ctx, sx, sy, color, layers);
  if (withWindow) {
    const hw = ISO_TILE_W / 2;
    const hh = ISO_TILE_H / 2;
    const baseY = sy + hh;
    const h = ISO_BLOCK_H * layers;
    const wy = snap(baseY - h + 20);
    px(ctx, sx - 8, wy, 16, 18, "#a8e4ff");
    ctx.strokeStyle = "#f5f0e8";
    ctx.lineWidth = 2;
    ctx.strokeRect(snap(sx - 8), wy, 16, 18);
  }
  void clipRightEdge;
}

export function drawRoomBoundsOutline(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const backLeft = gridToScreen(0.5, 0.5, gridW, gridH, 0);
  const backRight = gridToScreen(gridW - 0.5, 0.5, gridW, gridH, 0);
  const frontRight = gridToScreen(gridW - 0.5, gridH - 0.5, gridW, gridH, 0);
  const frontLeft = gridToScreen(0.5, gridH - 0.5, gridW, gridH, 0);

  ctx.strokeStyle = "#5090d0";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(snap(backLeft.x), snap(backLeft.y));
  ctx.lineTo(snap(backRight.x), snap(backRight.y));
  ctx.lineTo(snap(frontRight.x), snap(frontRight.y));
  ctx.lineTo(snap(frontLeft.x), snap(frontLeft.y));
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawSkyBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bands = ["#88c8f0", "#98d4f4", "#a8dcf6", "#b0e0f8"];
  const bandH = Math.ceil(height / bands.length);
  for (let i = 0; i < bands.length; i++) {
    px(ctx, 0, i * bandH, width, bandH, bands[i]);
  }
  for (let i = 0; i < 6; i++) {
    px(ctx, 20 + i * 48, 12 + (i % 3) * 8, 20, 6, "#ffffff");
    px(ctx, 22 + i * 48, 14 + (i % 3) * 8, 14, 4, "#e8f4ff");
  }
}

export function drawIsoWall(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers: number,
) {
  drawIsoBlock(ctx, sx, sy, color, layers);
}

export function drawPlatformBase(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  color: string,
) {
  const floorMinX = 1;
  const floorMaxX = gridW - 2;
  const floorMinY = 1;
  const floorMaxY = gridH - 1;
  const backLeft = gridToScreen(floorMinX - 0.5, floorMinY - 0.5, gridW, gridH, 0);
  const backRight = gridToScreen(floorMaxX + 0.5, floorMinY - 0.5, gridW, gridH, 0);
  const frontLeft = gridToScreen(floorMinX - 0.5, floorMaxY + 0.5, gridW, gridH, 0);

  const rimDepth = 8;
  for (let layer = 2; layer >= 1; layer--) {
    const o = layer * 6;
    ctx.fillStyle = shade(color, -layer * 18);

    ctx.beginPath();
    ctx.moveTo(snap(backLeft.x), snap(backLeft.y + o));
    ctx.lineTo(snap(backRight.x), snap(backRight.y + o));
    ctx.lineTo(snap(backRight.x), snap(backRight.y + o + rimDepth));
    ctx.lineTo(snap(backLeft.x), snap(backLeft.y + o + rimDepth));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(snap(backLeft.x), snap(backLeft.y + o));
    ctx.lineTo(snap(frontLeft.x), snap(frontLeft.y + o));
    ctx.lineTo(snap(frontLeft.x), snap(frontLeft.y + o + rimDepth));
    ctx.lineTo(snap(backLeft.x), snap(backLeft.y + o + rimDepth));
    ctx.closePath();
    ctx.fill();
  }
}

export function isRoomWallCell(gridX: number, gridY: number, gridW: number): boolean {
  if (gridY === 0) return true;
  if (gridX === 0 && gridY > 0) return true;
  return false;
}

import {
  CHARACTER_DISPLAY_HEIGHT,
  drawPixelCharacter,
  resolveCharacterColors,
  type PixelCharacterColors,
} from "./pixelCharacter";

export {
  CHARACTER_DISPLAY_HEIGHT,
  drawPixelCharacter,
  resolveCharacterColors,
  type PixelCharacterColors,
};

export function drawNameTag(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  displayName: string,
  titleName?: string,
  isAdmin?: boolean,
) {
  const footY = tileFootY(sy);
  let labelY = footY - CHARACTER_DISPLAY_HEIGHT - 10;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines: { text: string; color: string; font: string }[] = [];
  if (titleName) lines.push({ text: titleName, color: "#d08820", font: "bold 10px monospace" });
  lines.push({
    text: displayName,
    color: isAdmin ? "#f0d050" : "#ffffff",
    font: "bold 11px monospace",
  });
  if (isAdmin) lines.push({ text: "[管理者]", color: "#e04060", font: "9px monospace" });

  let maxW = 0;
  for (const line of lines) {
    ctx.font = line.font;
    maxW = Math.max(maxW, ctx.measureText(line.text).width);
  }
  const padX = 8;
  const padY = 4;
  const lineH = 12;
  const boxH = lines.length * lineH + padY * 2;
  const boxW = snap(maxW + padX * 2);
  const boxTop = snap(labelY - lineH * lines.length - padY + 4);
  const boxLeft = snap(sx - boxW / 2);

  px(ctx, boxLeft, boxTop, boxW, boxH, "#f8f0d8");
  ctx.strokeStyle = KAIRO_OUTLINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxLeft, boxTop, boxW, boxH);
  px(ctx, boxLeft, boxTop, boxW, 3, "#e8d8b0");

  for (const line of lines) {
    ctx.fillStyle = line.color === "#ffffff" ? "#483830" : line.color;
    ctx.font = line.font;
    ctx.fillText(line.text, snap(sx), snap(labelY));
    labelY -= lineH;
  }
}

export { shade };
