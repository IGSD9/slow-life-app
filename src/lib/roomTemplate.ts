/** lo-fi ゲームルーム風テンプレート */

import {
  drawIsoBlock,
  drawIsoFloorTile,
  gridToScreen,
  ISO_BLOCK_H,
  ISO_TILE_H,
  ISO_TILE_W,
  LOFT_BOUNDS,
  shade,
} from "./isometric";

/** ロフトへ続くフラットな段差ライン（歩行可能） */
export const RAMP_CELLS = [
  { x: 7, y: 5 },
  { x: 7, y: 6 },
] as const;

export const RUG_CELLS = [
  { x: 9, y: 9 },
  { x: 10, y: 9 },
] as const;

export const COUCH_POS = { x: 3, y: 2 };
export const DESK_LEFT = { x: 3, y: 10 };
export const DESK_RIGHT = { x: 12, y: 10 };

export const ROOM_COLORS = {
  loftFloor: "#2a2848",
  loftEdge: "#1e1c38",
  floorA: "#1a1a2e",
  floorB: "#222240",
  rampA: "#242442",
  rampB: "#2c2c50",
  rug: "#1a3048",
  rugBorder: "#3a8ab8",
  platform: "#0e0c18",
  wall: "#1a2038",
  wallHi: "#2a3458",
  neonCyan: "#4af0ff",
  neonMagenta: "#ff4ad8",
  neonCyanDim: "#1a4a5a",
  neonMagentaDim: "#4a1a48",
  windowGlass: "#141c30",
  cityLight: "#ffd080",
  cityLight2: "#ff9060",
  desk: "#2a2a3a",
  monitor: "#1a1a2a",
  couch: "#3a2858",
};

export function isRugCell(gridX: number, gridY: number): boolean {
  return RUG_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

export function isRampCell(gridX: number, gridY: number): boolean {
  return RAMP_CELLS.some((c) => c.x === gridX && c.y === gridY);
}

/** @deprecated isRampCell を使用 */
export function isStairCell(gridX: number, gridY: number): boolean {
  return isRampCell(gridX, gridY);
}

/** lo-fi 夜の室内背景 */
export function drawLoFiBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0a0c18");
  bg.addColorStop(0.5, "#12142a");
  bg.addColorStop(1, "#0a0814");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(74, 240, 255, 0.03)";
  ctx.fillRect(0, height * 0.6, width * 0.5, height * 0.4);
  ctx.fillStyle = "rgba(255, 74, 216, 0.03)";
  ctx.fillRect(width * 0.5, height * 0.6, width * 0.5, height * 0.4);
}

/** 部屋外周（暗いドット） */
export function drawOutdoorPad(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  for (let y = -1; y <= gridH; y++) {
    for (let x = -1; x <= gridW; x++) {
      if (x >= 1 && x < gridW - 1 && y >= 1 && y < gridH) continue;
      const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, -0.5);
      const c = (x + y) % 2 === 0 ? "#141220" : "#181628";
      drawIsoFloorTile(ctx, sx, sy, c, false, false);
    }
  }
}

/** ロフト手前の段差面（1枚の面・床タイル上に重ねない） */
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
  ctx.moveTo(left.x - hw, baseL);
  ctx.lineTo(left.x - hw, baseL + h);
  ctx.lineTo(right.x + hw, baseR + h);
  ctx.lineTo(right.x + hw, baseR);
  ctx.closePath();
  ctx.fillStyle = loftEdge;
  ctx.fill();

  const east = gridToScreen(LOFT_BOUNDS.maxX, LOFT_BOUNDS.minY, gridW, gridH, 1);
  const eastBot = gridToScreen(LOFT_BOUNDS.maxX, LOFT_BOUNDS.maxY, gridW, gridH, 1);
  const eTop = east.y + hh;
  const eBot = eastBot.y + hh;
  ctx.beginPath();
  ctx.moveTo(east.x + hw, eTop);
  ctx.lineTo(east.x + hw, eTop + h);
  ctx.lineTo(eastBot.x + hw, eBot + h);
  ctx.lineTo(eastBot.x + hw, eBot);
  ctx.closePath();
  ctx.fillStyle = shade(loftEdge, -12);
  ctx.fill();
}

/** 背面の雨窓＋街の明かり */
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
  const winTop = baseY - h + 4;
  const winH = h - 8;
  const winLeft = left.x - ISO_TILE_W * 0.3;
  const winW = right.x - left.x + ISO_TILE_W * 0.6;

  ctx.fillStyle = ROOM_COLORS.windowGlass;
  ctx.fillRect(winLeft, winTop, winW, winH);

  const { cityLight, cityLight2 } = ROOM_COLORS;
  for (let i = 0; i < 12; i++) {
    const bx = winLeft + 8 + (i % 4) * (winW / 4.5);
    const by = winTop + winH - 16 - Math.floor(i / 4) * 22;
    ctx.fillStyle = i % 3 === 0 ? cityLight2 : cityLight;
    ctx.fillRect(bx, by, 5, 7);
  }

  ctx.strokeStyle = "#2a3a58";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winLeft, winTop, winW, winH);

  ctx.strokeStyle = "rgba(180, 210, 255, 0.25)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 18; i++) {
    const rx = winLeft + 6 + i * (winW / 18);
    ctx.beginPath();
    ctx.moveTo(rx, winTop);
    ctx.lineTo(rx + 2, winTop + winH);
    ctx.stroke();
  }
}

/** 壁のネオン環境光 */
export function drawWallNeonGlow(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * wallLayers;
  const left = gridToScreen(0, gridH - 2, gridW, gridH, 0);
  const baseY = left.y + hh;
  const glowY = baseY - h * 0.4;

  const cyanGrad = ctx.createLinearGradient(left.x - 40, glowY, left.x + 60, glowY);
  cyanGrad.addColorStop(0, "rgba(74, 240, 255, 0)");
  cyanGrad.addColorStop(0.5, "rgba(74, 240, 255, 0.12)");
  cyanGrad.addColorStop(1, "rgba(74, 240, 255, 0)");
  ctx.fillStyle = cyanGrad;
  ctx.fillRect(left.x - 50, glowY - 20, 120, 40);

  const right = gridToScreen(gridW - 2, gridH - 2, gridW, gridH, 0);
  const magGrad = ctx.createLinearGradient(right.x - 60, glowY, right.x + 40, glowY);
  magGrad.addColorStop(0, "rgba(255, 74, 216, 0)");
  magGrad.addColorStop(0.5, "rgba(255, 74, 216, 0.12)");
  magGrad.addColorStop(1, "rgba(255, 74, 216, 0)");
  ctx.fillStyle = magGrad;
  ctx.fillRect(right.x - 70, glowY - 20, 120, 40);
}

/** 床のネオン反射 */
export function drawFloorNeonReflections(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x: lx, y: ly } = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const { x: rx, y: ry } = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  const footL = ly + ISO_TILE_H;
  const footR = ry + ISO_TILE_H;

  ctx.fillStyle = "rgba(74, 240, 255, 0.08)";
  ctx.beginPath();
  ctx.ellipse(lx, footL + 2, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 74, 216, 0.08)";
  ctx.beginPath();
  ctx.ellipse(rx, footR + 2, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** ゲーミングデスク */
function drawGamingDesk(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  neonColor: string,
  screenColor: string,
) {
  const footY = sy + ISO_TILE_H;
  drawIsoBlock(ctx, sx, sy, ROOM_COLORS.desk, 1);

  const monY = footY - ISO_BLOCK_H - 14;
  ctx.fillStyle = ROOM_COLORS.monitor;
  ctx.fillRect(sx - 10, monY, 20, 14);
  ctx.fillStyle = screenColor;
  ctx.fillRect(sx - 8, monY + 2, 16, 10);

  ctx.fillStyle = neonColor;
  ctx.fillRect(sx - 12, footY - 2, 24, 2);
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(sx - 12, footY - 2, 24, 2);
  ctx.shadowBlur = 0;
}

export function drawGamingDesks(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const left = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const right = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  drawGamingDesk(ctx, left.x, left.y, ROOM_COLORS.neonCyan, "#2a5a4a");
  drawGamingDesk(ctx, right.x, right.y, ROOM_COLORS.neonMagenta, "#4a2a5a");
}

/** ロフトのソファ */
export function drawLoftCouch(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const { x, y } = COUCH_POS;
  const { x: sx, y: sy } = gridToScreen(x, y, gridW, gridH, 1);
  drawIsoBlock(ctx, sx, sy, ROOM_COLORS.couch, 1);
  const footY = sy + ISO_TILE_H;
  ctx.fillStyle = shade(ROOM_COLORS.couch, 20);
  ctx.fillRect(sx - 8, footY - ISO_BLOCK_H - 3, 16, 4);
}

/** ラグタイル */
export function drawRugTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
) {
  drawIsoFloorTile(ctx, sx, sy, ROOM_COLORS.rug, false, false);
  const hw = ISO_TILE_W / 2;
  const hh = ISO_TILE_H / 2;
  ctx.strokeStyle = ROOM_COLORS.rugBorder;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.7, sy + hh * 0.5);
  ctx.lineTo(sx + hw * 0.7, sy + hh * 1.5);
  ctx.stroke();
}

/** 段差ランプタイル */
export function drawRampTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  idx: number,
) {
  const c = idx % 2 === 0 ? ROOM_COLORS.rampA : ROOM_COLORS.rampB;
  drawIsoFloorTile(ctx, sx, sy, shade(c, idx * 4), false, false);
}

/** @deprecated drawLoFiBackground を使用 */
export const drawHousingBackground = drawLoFiBackground;

/** @deprecated drawOutdoorPad を使用 */
export const drawOutdoorCheckerPad = drawOutdoorPad;
