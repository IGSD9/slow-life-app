/** アイソメトリック（2:1）座標変換・ボクセル描画 */

export const ISO_TILE_W = 40;
export const ISO_TILE_H = 20;
export const ISO_BLOCK_H = 17;
export const ISO_WALL_LAYERS = 6;

/** 奥左ロフト（段差付きベッドエリア） */
export const LOFT_BOUNDS = { minX: 1, maxX: 6, minY: 1, maxY: 4 };

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

/** @deprecated isLoftCell を使用 */
export function isDeckCell(gridX: number, gridY: number): boolean {
  return isLoftCell(gridX, gridY);
}

/** タイル上面の立ち位置（足元＝タイル手前の接地点） */
export function tileFootY(sy: number): number {
  return sy + ISO_TILE_H;
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
    x: gridH * (ISO_TILE_W / 2) + 16,
    y: ISO_WALL_LAYERS * ISO_BLOCK_H + 32,
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
    x: origin.x + (gridX - gridY) * (ISO_TILE_W / 2),
    y: origin.y + (gridX + gridY) * (ISO_TILE_H / 2) - z * ISO_BLOCK_H,
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
  const w = origin.x + gridW * (ISO_TILE_W / 2) + 24;
  const h = origin.y + (gridW + gridH) * (ISO_TILE_H / 2) + ISO_WALL_LAYERS * ISO_BLOCK_H + 28;
  return { width: Math.ceil(w), height: Math.ceil(h) };
}

export function depthKey(gridX: number, gridY: number, z = 0) {
  return gridX + gridY + z * 0.01;
}

function shade(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** 床タイル（菱形の上面） */
export function drawIsoFloorTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  highlight = false,
  plank = false,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const top = highlight ? shade(color, 25) : color;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + hw, sy + hh);
  ctx.lineTo(sx, sy + hh * 2);
  ctx.lineTo(sx - hw, sy + hh);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = shade(color, -35);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  if (plank) {
    ctx.strokeStyle = shade(color, -18);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.6, sy + hh * 0.5);
    ctx.lineTo(sx + hw * 0.6, sy + hh * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.3, sy + hh * 1.1);
    ctx.lineTo(sx + hw * 0.8, sy + hh * 1.9);
    ctx.stroke();
  }
}

/** デッキ段差の側面 */
export function drawDeckRiser(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
) {
  drawIsoBlock(ctx, sx, sy, color, 1);
}

/** 背面壁を1枚の面として描画（タイル間の隙間から背景が見えないようにする） */
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
  const x0 = 1;
  const x1 = gridW - 2;

  const left = gridToScreen(x0, 0, gridW, gridH, 0);
  const right = gridToScreen(x1, 0, gridW, gridH, 0);
  const baseL = left.y + hh;
  const baseR = right.y + hh;

  ctx.beginPath();
  ctx.moveTo(left.x - hw, baseL - h + hh);
  ctx.lineTo(left.x, baseL - h);
  ctx.lineTo(right.x, baseR - h);
  ctx.lineTo(right.x + hw, baseR - h + hh);
  ctx.lineTo(right.x, baseR - h + hh * 2);
  ctx.lineTo(left.x, baseL - h + hh * 2);
  ctx.closePath();
  ctx.fillStyle = shade(color, 30);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(left.x - hw, baseL - h + hh);
  ctx.lineTo(left.x - hw, baseL + hh);
  ctx.lineTo(right.x + hw, baseR + hh);
  ctx.lineTo(right.x + hw, baseR - h + hh);
  ctx.closePath();
  ctx.fillStyle = shade(color, -12);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(left.x - hw, baseL - h + hh);
  ctx.lineTo(left.x, baseL - h + hh * 2);
  ctx.lineTo(left.x, baseL + hh * 2);
  ctx.lineTo(left.x - hw, baseL + hh);
  ctx.closePath();
  ctx.fillStyle = shade(color, -30);
  ctx.fill();

}

/** 左側壁を1枚の面として描画 */
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
  const y0 = 1;
  const y1 = gridH - 1;

  const back = gridToScreen(0, y0, gridW, gridH, 0);
  const front = gridToScreen(0, y1, gridW, gridH, 0);
  const baseB = back.y + hh;
  const baseF = front.y + hh;

  ctx.beginPath();
  ctx.moveTo(back.x - hw, baseB - h + hh);
  ctx.lineTo(back.x, baseB - h);
  ctx.lineTo(front.x, baseF - h);
  ctx.lineTo(front.x - hw, baseF - h + hh);
  ctx.lineTo(front.x, baseF - h + hh * 2);
  ctx.lineTo(back.x, baseB - h + hh * 2);
  ctx.closePath();
  ctx.fillStyle = shade(color, 30);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(back.x - hw, baseB - h + hh);
  ctx.lineTo(back.x - hw, baseB + hh);
  ctx.lineTo(front.x - hw, baseF + hh);
  ctx.lineTo(front.x - hw, baseF - h + hh);
  ctx.closePath();
  ctx.fillStyle = shade(color, -12);
  ctx.fill();

}

/** パターン壁（ピンク系ドット柄） */
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

  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const baseY = sy + hh;
  const h = ISO_BLOCK_H * layers;
  const lineRight = clipRightEdge ? sx + hw * 0.15 : sx + hw * 0.7;

  ctx.save();
  ctx.strokeStyle = shade(color, 40);
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 3; i++) {
    const oy = baseY - h + 8 + i * 10;
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.7, oy);
    ctx.lineTo(lineRight, oy + 4);
    ctx.stroke();
  }

  if (withWindow) {
    const wy = baseY - h + 14;
    ctx.fillStyle = "#a8e4ff";
    ctx.fillRect(sx - 5, wy, 10, 12);
    ctx.strokeStyle = "#f5f0e8";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 5, wy, 10, 12);
    ctx.beginPath();
    ctx.moveTo(sx, wy);
    ctx.lineTo(sx, wy + 12);
    ctx.moveTo(sx - 5, wy + 6);
    ctx.lineTo(sx + 5, wy + 6);
    ctx.stroke();
  }
  ctx.restore();
}

/** 部屋の外枠（編集時・手前開放の3辺） */
export function drawRoomBoundsOutline(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const backLeft = gridToScreen(0.5, 0.5, gridW, gridH, 0);
  const backRight = gridToScreen(gridW - 0.5, 0.5, gridW, gridH, 0);
  const frontRight = gridToScreen(gridW - 0.5, gridH - 0.5, gridW, gridH, 0);
  const frontLeft = gridToScreen(0.5, gridH - 0.5, gridW, gridH, 0);

  ctx.strokeStyle = "rgba(80, 160, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(backLeft.x, backLeft.y);
  ctx.lineTo(backRight.x, backRight.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.lineTo(frontLeft.x, frontLeft.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** 明るい空背景 */
export function drawSkyBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#c5ecfa");
  bg.addColorStop(0.45, "#dff5fc");
  bg.addColorStop(1, "#b8dce8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

/** ボクセルブロック（上面+左面+右面） */
export function drawIsoBlock(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers = 1,
) {
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * layers;
  const top = shade(color, 30);
  const left = shade(color, -30);
  const right = shade(color, -12);

  const baseY = sy + hh;

  ctx.beginPath();
  ctx.moveTo(sx - hw, baseY - h + hh);
  ctx.lineTo(sx, baseY - h);
  ctx.lineTo(sx + hw, baseY - h + hh);
  ctx.lineTo(sx, baseY - h + hh * 2);
  ctx.closePath();
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = shade(color, -40);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx - hw, baseY - h + hh);
  ctx.lineTo(sx - hw, baseY + hh);
  ctx.lineTo(sx, baseY + hh * 2);
  ctx.lineTo(sx, baseY - h + hh * 2);
  ctx.closePath();
  ctx.fillStyle = left;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx + hw, baseY - h + hh);
  ctx.lineTo(sx + hw, baseY + hh);
  ctx.lineTo(sx, baseY + hh * 2);
  ctx.lineTo(sx, baseY - h + hh * 2);
  ctx.closePath();
  ctx.fillStyle = right;
  ctx.fill();
}

/** 壁ブロック（部屋の外周） */
export function drawIsoWall(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers: number,
) {
  drawIsoBlock(ctx, sx, sy, color, layers);
}

/** 浮遊台座（奥2面のみ・手前は開放） */
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

  const baseLayers = 2;
  const rimDepth = 5;
  for (let layer = baseLayers; layer >= 1; layer--) {
    const o = layer * 4;
    ctx.fillStyle = shade(color, -layer * 15);

    // 背面の縁
    ctx.beginPath();
    ctx.moveTo(backLeft.x, backLeft.y + o);
    ctx.lineTo(backRight.x, backRight.y + o);
    ctx.lineTo(backRight.x, backRight.y + o + rimDepth);
    ctx.lineTo(backLeft.x, backLeft.y + o + rimDepth);
    ctx.closePath();
    ctx.fill();

    // 左側面の縁（奥に接続）
    ctx.beginPath();
    ctx.moveTo(backLeft.x, backLeft.y + o);
    ctx.lineTo(frontLeft.x, frontLeft.y + o);
    ctx.lineTo(frontLeft.x, frontLeft.y + o + rimDepth);
    ctx.lineTo(backLeft.x, backLeft.y + o + rimDepth);
    ctx.closePath();
    ctx.fill();
  }
}

/** 奥2面の壁（背面 y=0 + 左側面 x=0）。手前・右側は開放 */
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
  let labelY = footY - CHARACTER_DISPLAY_HEIGHT - 6;
  ctx.textAlign = "center";
  if (titleName) {
    ctx.fillStyle = "#f5a623";
    ctx.font = "bold 7px monospace";
    ctx.fillText(titleName, sx, labelY);
    labelY -= 9;
  }
  ctx.fillStyle = isAdmin ? "#f5d76e" : "#ffffff";
  ctx.font = "bold 8px monospace";
  ctx.fillText(displayName, sx, labelY);
  if (isAdmin) {
    labelY -= 9;
    ctx.fillStyle = "#e94560";
    ctx.font = "7px monospace";
    ctx.fillText("[管理者]", sx, labelY);
  }
}

export { shade };
