/** メイプルストーリー2風ハウジング・ルームテンプレート */

import {
  drawIsoBlock,
  drawIsoFloorTile,
  gridToScreen,
  isLoftCell,
  ISO_BLOCK_H,
  ISO_TILE_H,
  ISO_TILE_W,
  LOFT_BOUNDS,
  shade,
} from "./isometric";

/** ロフトへ上がる階段（手前方向） */
export const STAIR_CELLS = [
  { x: 7, y: 6, layers: 1 },
  { x: 7, y: 5, layers: 2 },
  { x: 7, y: 4, layers: 3 },
] as const;

/** 階段下のラグ */
export const RUG_CELLS = [
  { x: 6, y: 7 },
  { x: 7, y: 7 },
] as const;

export const BED_POS = { x: 2, y: 2 };
export const NIGHTSTAND_POS = { x: 5, y: 2 };

export const ROOM_COLORS = {
  loftFloor: "#f5f0e8",
  loftFloorLine: "#e0d8cc",
  floorA: "#c49a6c",
  floorB: "#d4aa78",
  rug: "#8ec8e8",
  rugBorder: "#6aa8c8",
  platform: "#5c3d2e",
  wall: "#d48ab0",
  wallAccent: "#e8a8c8",
  bedFrame: "#4a3020",
  bedSheet: "#4a7ab8",
  bedPillow: "#f0f4ff",
  nightstand: "#5c3d2e",
  stair: "#f0ebe3",
  windowGlass: "#a8e4ff",
};

export function isRugCell(gridX: number, gridY: number): boolean {
  return RUG_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

export function isStairCell(gridX: number, gridY: number): boolean {
  return STAIR_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

/** ハウジング風の暗い背景 */
export function drawHousingBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  bg.addColorStop(0, "#2a2535");
  bg.addColorStop(1, "#12101a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
}

/** 部屋外周のチェッカー床 */
export function drawOutdoorCheckerPad(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const padMinX = -1;
  const padMaxX = gridW;
  const padMinY = -1;
  const padMaxY = gridH;

  for (let y = padMinY; y <= padMaxY; y++) {
    for (let x = padMinX; x <= padMaxX; x++) {
      if (x >= 1 && x < gridW - 1 && y >= 1 && y < gridH) continue;
      const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, -0.5);
      const c = (x + y) % 2 === 0 ? "#c48850" : "#d49858";
      drawIsoFloorTile(ctx, sx, sy, c, false, false);
    }
  }
}

/** 背面・左壁にダマスク柄 */
export function drawDamaskOnWalls(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
  baseColor: string,
) {
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * wallLayers;
  const x0 = 1;
  const x1 = gridW - 2;
  const left = gridToScreen(x0, 0, gridW, gridH, 0);
  const right = gridToScreen(x1, 0, gridW, gridH, 0);
  const baseL = left.y + hh;
  drawDamaskPattern(
    ctx,
    left.x - ISO_TILE_W * 0.4,
    baseL - h + 4,
    right.x + ISO_TILE_W * 0.4,
    baseL + hh,
    baseColor,
  );

  const back = gridToScreen(0, 1, gridW, gridH, 0);
  const front = gridToScreen(0, gridH - 1, gridW, gridH, 0);
  const baseB = back.y + hh;
  drawDamaskPattern(
    ctx,
    back.x - ISO_TILE_W * 0.6,
    baseB - h + 4,
    front.x - ISO_TILE_W * 0.2,
    front.y + hh,
    baseColor,
  );
}

/** ダマスク柄を壁面に重ねる */
export function drawDamaskPattern(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  baseColor: string,
) {
  ctx.save();
  ctx.strokeStyle = shade(baseColor, 25);
  ctx.fillStyle = shade(baseColor, 18);
  ctx.lineWidth = 0.5;
  const step = 14;
  for (let y = y1; y < y2; y += step) {
    for (let x = x1; x < x2; x += step * 0.8) {
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** 壁上部の窓 */
export function drawWallTopWindows(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * wallLayers;
  const { windowGlass } = ROOM_COLORS;

  const backWindows = [4, 8, 12];
  for (const x of backWindows) {
    const { x: sx, y: sy } = gridToScreen(x, 0, gridW, gridH, 0);
    const wy = sy + hh - h + 6;
    ctx.fillStyle = windowGlass;
    ctx.fillRect(sx - 8, wy, 16, 14);
    ctx.strokeStyle = "#f5f0e8";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, wy, 16, 14);
    ctx.beginPath();
    ctx.moveTo(sx, wy);
    ctx.lineTo(sx, wy + 14);
    ctx.moveTo(sx - 8, wy + 7);
    ctx.lineTo(sx + 8, wy + 7);
    ctx.stroke();
  }

  const leftWindows = [2, 6, 10];
  for (const y of leftWindows) {
    const { x: sx, y: sy } = gridToScreen(0, y, gridW, gridH, 0);
    const wy = sy + hh - h + 6;
    ctx.fillStyle = windowGlass;
    ctx.fillRect(sx - 14, wy, 12, 14);
    ctx.strokeStyle = "#f5f0e8";
    ctx.strokeRect(sx - 14, wy, 12, 14);
  }
}

/** ロフト段差の側面 */
export function drawLoftRisers(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const color = shade(ROOM_COLORS.platform, 10);
  for (let y = LOFT_BOUNDS.minY; y <= LOFT_BOUNDS.maxY; y++) {
    for (let x = LOFT_BOUNDS.minX; x <= LOFT_BOUNDS.maxX; x++) {
      const neighbors: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (isLoftCell(nx, ny) || nx < 1 || nx >= gridW - 1 || ny < 1 || ny >= gridH) continue;
        const { x: sx, y: sy } = gridToScreen(nx, ny, gridW, gridH, 0);
        drawIsoBlock(ctx, sx, sy, color, 1);
      }
    }
  }
}

/** 階段ブロック */
export function drawStairs(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  for (const { x, y, layers } of STAIR_CELLS) {
    const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, 0);
    drawIsoBlock(ctx, sx, sy, ROOM_COLORS.stair, layers);
  }
}

/** ベッド（ロフト上） */
export function drawTemplateBed(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const z = 1;
  const { x, y } = BED_POS;
  const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, z);
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  const footY = sy + hh;

  const { bedFrame, bedSheet, bedPillow } = ROOM_COLORS;

  // フレーム
  drawIsoBlock(ctx, sx, sy, bedFrame, 1);
  drawIsoBlock(ctx, sx + hw * 0.5, sy - hh * 0.3, bedFrame, 2);

  // シーツ（上に薄く）
  ctx.fillStyle = bedSheet;
  ctx.fillRect(sx - hw * 0.6, footY - ISO_BLOCK_H - 4, hw * 1.2, 6);
  ctx.fillStyle = bedPillow;
  ctx.fillRect(sx - hw * 0.5, footY - ISO_BLOCK_H - 8, hw * 0.5, 4);
}

/** ナイトスタンド */
export function drawTemplateNightstand(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x, y } = NIGHTSTAND_POS;
  const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, 1);
  drawIsoBlock(ctx, sx, sy, ROOM_COLORS.nightstand, 1);

  const footY = sy + ISO_TILE_H / 2;
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(sx - 3, footY - ISO_BLOCK_H - 5, 6, 4);
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(sx - 1, footY - ISO_BLOCK_H - 9, 3, 3);
}

/** ラグタイル */
export function drawRugTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
) {
  const { rug, rugBorder } = ROOM_COLORS;
  drawIsoFloorTile(ctx, sx, sy, rug, false, false);
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  ctx.strokeStyle = rugBorder;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.7, sy + hh * 0.5);
  ctx.lineTo(sx + hw * 0.7, sy + hh * 1.5);
  ctx.stroke();
}
