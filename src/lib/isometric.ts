/** アイソメトリック（2:1）座標変換・ボクセル描画 */

export const ISO_TILE_W = 40;
export const ISO_TILE_H = 20;
export const ISO_BLOCK_H = 17;
export const ISO_WALL_LAYERS = 6;

/** 中央の段差付きウッドデッキ（参考: ハウジングカスタム） */
export const DECK_BOUNDS = { minX: 4, maxX: 11, minY: 3, maxY: 7 };

export function floorElevation(gridX: number, gridY: number): number {
  if (
    gridX >= DECK_BOUNDS.minX &&
    gridX <= DECK_BOUNDS.maxX &&
    gridY >= DECK_BOUNDS.minY &&
    gridY <= DECK_BOUNDS.maxY
  ) {
    return 1;
  }
  return 0;
}

export function isDeckCell(gridX: number, gridY: number): boolean {
  return floorElevation(gridX, gridY) > 0;
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
  const left = shade(color, -25);
  const right = shade(color, -10);

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

  ctx.beginPath();
  ctx.moveTo(sx - hw, sy + hh);
  ctx.lineTo(sx, sy + hh * 2);
  ctx.lineTo(sx, sy + hh * 2 + 3);
  ctx.lineTo(sx - hw, sy + hh + 3);
  ctx.closePath();
  ctx.fillStyle = left;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx + hw, sy + hh);
  ctx.lineTo(sx, sy + hh * 2);
  ctx.lineTo(sx, sy + hh * 2 + 3);
  ctx.lineTo(sx + hw, sy + hh + 3);
  ctx.closePath();
  ctx.fillStyle = right;
  ctx.fill();
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

/** パターン壁（ピンク系ドット柄） */
export function drawIsoPatternWall(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  color: string,
  layers: number,
  withWindow = false,
) {
  drawIsoBlock(ctx, sx, sy, color, layers);

  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const baseY = sy + hh * 2;
  const h = ISO_BLOCK_H * layers;

  ctx.save();
  ctx.strokeStyle = shade(color, 40);
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 3; i++) {
    const oy = baseY - h + 8 + i * 10;
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.7, oy);
    ctx.lineTo(sx + hw * 0.7, oy + 4);
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

/** 部屋の外枠（編集時の青い境界線） */
export function drawRoomBoundsOutline(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const corners = [
    gridToScreen(0.5, 0.5, gridW, gridH, 0),
    gridToScreen(gridW - 0.5, 0.5, gridW, gridH, 0),
    gridToScreen(gridW - 0.5, gridH - 0.5, gridW, gridH, 0),
    gridToScreen(0.5, gridH - 0.5, gridW, gridH, 0),
  ];
  ctx.strokeStyle = "rgba(80, 160, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
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

  const baseY = sy + hh * 2;

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

/** 浮遊台座（部屋全体の土台） */
export function drawPlatformBase(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  color: string,
) {
  const corners = [
    gridToScreen(-0.5, -0.5, gridW, gridH, -0.8),
    gridToScreen(gridW - 0.5, -0.5, gridW, gridH, -0.8),
    gridToScreen(gridW - 0.5, gridH - 0.5, gridW, gridH, -0.8),
    gridToScreen(-0.5, gridH - 0.5, gridW, gridH, -0.8),
  ];
  const baseLayers = 2;
  for (let layer = baseLayers; layer >= 1; layer--) {
    const offset = layer * 4;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y + offset);
    ctx.lineTo(corners[1].x, corners[1].y + offset);
    ctx.lineTo(corners[2].x, corners[2].y + offset);
    ctx.lineTo(corners[3].x, corners[3].y + offset);
    ctx.closePath();
    ctx.fillStyle = shade(color, -layer * 15);
    ctx.fill();
  }
}

/** キャラクター（ミニボクセル人型） */
export function drawIsoCharacter(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  bodyColor: string,
  shirtColor: string,
) {
  drawIsoBlock(ctx, sx, sy - ISO_BLOCK_H * 0.6, shirtColor, 1);
  const headY = sy - ISO_BLOCK_H * 1.8;
  const hw = ISO_TILE_W / 4;
  const hh = ISO_TILE_H / 4;
  ctx.beginPath();
  ctx.moveTo(sx, headY);
  ctx.lineTo(sx + hw, headY + hh);
  ctx.lineTo(sx, headY + hh * 2);
  ctx.lineTo(sx - hw, headY + hh);
  ctx.closePath();
  ctx.fillStyle = bodyColor;
  ctx.fill();
}

export function drawNameTag(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  displayName: string,
  titleName?: string,
  isAdmin?: boolean,
) {
  let labelY = sy - ISO_BLOCK_H * 3.2;
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
