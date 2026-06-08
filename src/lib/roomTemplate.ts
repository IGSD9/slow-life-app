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
  bg.addColorStop(0, "#080a14");
  bg.addColorStop(0.35, "#10122a");
  bg.addColorStop(0.7, "#141630");
  bg.addColorStop(1, "#080610");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 微細な星・ノイズ
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let i = 0; i < 40; i++) {
    const x = ((i * 137) % 1000) / 1000 * width;
    const y = ((i * 89) % 1000) / 1000 * height * 0.55;
    ctx.fillRect(x, y, 1, 1);
  }

  const cyanGlow = ctx.createRadialGradient(
    width * 0.2,
    height * 0.75,
    0,
    width * 0.2,
    height * 0.75,
    width * 0.45,
  );
  cyanGlow.addColorStop(0, "rgba(74, 240, 255, 0.07)");
  cyanGlow.addColorStop(1, "rgba(74, 240, 255, 0)");
  ctx.fillStyle = cyanGlow;
  ctx.fillRect(0, height * 0.5, width * 0.55, height * 0.5);

  const magGlow = ctx.createRadialGradient(
    width * 0.8,
    height * 0.75,
    0,
    width * 0.8,
    height * 0.75,
    width * 0.45,
  );
  magGlow.addColorStop(0, "rgba(255, 74, 216, 0.07)");
  magGlow.addColorStop(1, "rgba(255, 74, 216, 0)");
  ctx.fillStyle = magGlow;
  ctx.fillRect(width * 0.45, height * 0.5, width * 0.55, height * 0.5);
}

/** 画面端のビネット */
export function drawAmbientVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const vg = ctx.createRadialGradient(
    width / 2,
    height * 0.55,
    width * 0.25,
    width / 2,
    height * 0.55,
    width * 0.72,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(0.65, "rgba(0,0,0,0.12)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
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
      const c = (x + y) % 2 === 0 ? "#12101e" : "#16142a";
      drawIsoFloorTile(ctx, sx, sy, c, false, false);
    }
  }
}

/** 壁面に微細な縦ストライプ */
export function drawWallSurfaceDetail(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
  wallLayers: number,
) {
  const hh = ISO_TILE_H / 2;
  const h = ISO_BLOCK_H * wallLayers;
  const backL = gridToScreen(1, 0, gridW, gridH, 0);
  const backR = gridToScreen(gridW - 2, 0, gridW, gridH, 0);
  const baseY = backL.y + hh;
  const topY = baseY - h + 6;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const x = backL.x + (backR.x - backL.x) * t;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + 8, baseY - 4);
    ctx.stroke();
  }

  const leftB = gridToScreen(0, 1, gridW, gridH, 0);
  const leftF = gridToScreen(0, gridH - 1, gridW, gridH, 0);
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const x = leftB.x - ISO_TILE_W * 0.35 + t * 4;
    const y0 = leftB.y + hh - h + 6 + t * (leftF.y - leftB.y);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x - 6, y0 + h * 0.85);
    ctx.stroke();
  }
  ctx.restore();
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
  const frontGrad = ctx.createLinearGradient(left.x, baseL, right.x, baseR + h);
  frontGrad.addColorStop(0, shade(loftEdge, 8));
  frontGrad.addColorStop(1, shade(loftEdge, -16));
  ctx.fillStyle = frontGrad;
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
  ctx.fillStyle = shade(loftEdge, -14);
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
  const winTop = baseY - h + 6;
  const winH = h - 12;
  const winLeft = left.x - ISO_TILE_W * 0.3;
  const winW = right.x - left.x + ISO_TILE_W * 0.6;

  // 窓枠（外側）
  ctx.fillStyle = "#0e1428";
  ctx.fillRect(winLeft - 4, winTop - 4, winW + 8, winH + 8);

  const glassGrad = ctx.createLinearGradient(winLeft, winTop, winLeft + winW, winTop + winH);
  glassGrad.addColorStop(0, "#0c1428");
  glassGrad.addColorStop(0.4, ROOM_COLORS.windowGlass);
  glassGrad.addColorStop(0.7, "#1a2848");
  glassGrad.addColorStop(1, "#0a1020");
  ctx.fillStyle = glassGrad;
  ctx.fillRect(winLeft, winTop, winW, winH);

  const { cityLight, cityLight2 } = ROOM_COLORS;
  for (let i = 0; i < 16; i++) {
    const bx = winLeft + 10 + (i % 4) * (winW / 4.2);
    const by = winTop + winH - 20 - Math.floor(i / 4) * 26;
    const bw = 5 + (i % 2);
    const bh = 7 + (i % 3);
    ctx.fillStyle = i % 3 === 0 ? cityLight2 : cityLight;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = `rgba(255, 200, 120, ${0.08 + (i % 4) * 0.03})`;
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 6);
  }

  // ボケ玉
  for (let i = 0; i < 6; i++) {
    const bx = winLeft + 20 + i * (winW / 6.5);
    const by = winTop + 18 + (i % 3) * 14;
    const r = 3 + (i % 2) * 2;
    const bokeh = ctx.createRadialGradient(bx, by, 0, bx, by, r * 2);
    bokeh.addColorStop(0, `rgba(180, 220, 255, ${0.12 + i * 0.02})`);
    bokeh.addColorStop(1, "rgba(180, 220, 255, 0)");
    ctx.fillStyle = bokeh;
    ctx.beginPath();
    ctx.arc(bx, by, r * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#2a3a58";
  ctx.lineWidth = 2;
  ctx.strokeRect(winLeft, winTop, winW, winH);

  // 窓枠の仕切り
  ctx.strokeStyle = "#1e2a48";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(winLeft + winW / 2, winTop);
  ctx.lineTo(winLeft + winW / 2, winTop + winH);
  ctx.moveTo(winLeft, winTop + winH / 2);
  ctx.lineTo(winLeft + winW, winTop + winH / 2);
  ctx.stroke();

  // 雨粒
  ctx.strokeStyle = "rgba(180, 210, 255, 0.22)";
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 24; i++) {
    const rx = winLeft + 4 + i * (winW / 24);
    ctx.beginPath();
    ctx.moveTo(rx, winTop);
    ctx.lineTo(rx + 3, winTop + winH);
    ctx.stroke();
  }

  // ガラス反射
  ctx.fillStyle = "rgba(200, 230, 255, 0.06)";
  ctx.beginPath();
  ctx.moveTo(winLeft + 4, winTop + 4);
  ctx.lineTo(winLeft + winW * 0.35, winTop + 4);
  ctx.lineTo(winLeft + winW * 0.15, winTop + winH * 0.45);
  ctx.lineTo(winLeft + 4, winTop + winH * 0.25);
  ctx.closePath();
  ctx.fill();
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

  const cyanGrad = ctx.createLinearGradient(left.x - 60, glowY, left.x + 100, glowY);
  cyanGrad.addColorStop(0, "rgba(74, 240, 255, 0)");
  cyanGrad.addColorStop(0.35, "rgba(74, 240, 255, 0.18)");
  cyanGrad.addColorStop(0.65, "rgba(74, 240, 255, 0.18)");
  cyanGrad.addColorStop(1, "rgba(74, 240, 255, 0)");
  ctx.fillStyle = cyanGrad;
  ctx.fillRect(left.x - 70, glowY - 30, 160, 60);

  const right = gridToScreen(gridW - 2, gridH - 2, gridW, gridH, 0);
  const magGrad = ctx.createLinearGradient(right.x - 100, glowY, right.x + 60, glowY);
  magGrad.addColorStop(0, "rgba(255, 74, 216, 0)");
  magGrad.addColorStop(0.35, "rgba(255, 74, 216, 0.18)");
  magGrad.addColorStop(0.65, "rgba(255, 74, 216, 0.18)");
  magGrad.addColorStop(1, "rgba(255, 74, 216, 0)");
  ctx.fillStyle = magGrad;
  ctx.fillRect(right.x - 90, glowY - 30, 160, 60);
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

  const cyanRef = ctx.createRadialGradient(lx, footL + 2, 0, lx, footL + 2, 38);
  cyanRef.addColorStop(0, "rgba(74, 240, 255, 0.16)");
  cyanRef.addColorStop(0.5, "rgba(74, 240, 255, 0.06)");
  cyanRef.addColorStop(1, "rgba(74, 240, 255, 0)");
  ctx.fillStyle = cyanRef;
  ctx.beginPath();
  ctx.ellipse(lx, footL + 2, 36, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const magRef = ctx.createRadialGradient(rx, footR + 2, 0, rx, footR + 2, 38);
  magRef.addColorStop(0, "rgba(255, 74, 216, 0.16)");
  magRef.addColorStop(0.5, "rgba(255, 74, 216, 0.06)");
  magRef.addColorStop(1, "rgba(255, 74, 216, 0)");
  ctx.fillStyle = magRef;
  ctx.beginPath();
  ctx.ellipse(rx, footR + 2, 36, 10, 0, 0, Math.PI * 2);
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

  const monW = 26;
  const monH = 18;
  const monY = footY - ISO_BLOCK_H - monH - 2;
  ctx.fillStyle = ROOM_COLORS.monitor;
  ctx.fillRect(sx - monW / 2, monY, monW, monH);
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(sx - monW / 2 + 2, monY + 2, monW - 4, monH - 4);

  const screenGrad = ctx.createLinearGradient(sx - 10, monY + 3, sx + 10, monY + monH - 3);
  screenGrad.addColorStop(0, shade(screenColor, 20));
  screenGrad.addColorStop(0.5, screenColor);
  screenGrad.addColorStop(1, shade(screenColor, -25));
  ctx.fillStyle = screenGrad;
  ctx.fillRect(sx - 10, monY + 3, 20, monH - 6);

  // 画面グロー
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = neonColor;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(sx - 8, monY + 5, 16, monH - 10);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // キーボード
  ctx.fillStyle = "#1e1e2e";
  ctx.fillRect(sx - 12, footY - ISO_BLOCK_H - 4, 24, 4);
  ctx.fillStyle = neonColor;
  ctx.globalAlpha = 0.5;
  for (let k = 0; k < 6; k++) {
    ctx.fillRect(sx - 10 + k * 4, footY - ISO_BLOCK_H - 3, 2, 2);
  }
  ctx.globalAlpha = 1;

  // LEDストリップ
  ctx.fillStyle = neonColor;
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 12;
  ctx.fillRect(sx - 14, footY - 2, 28, 3);
  ctx.shadowBlur = 0;

  // 足元の二次反射
  ctx.fillStyle = neonColor;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(sx - 16, footY, 32, 4);
  ctx.globalAlpha = 1;
}

export function drawGamingDesks(
  ctx: CanvasRenderingContext2D,
  gridW: number,
  gridH: number,
) {
  const left = gridToScreen(DESK_LEFT.x, DESK_LEFT.y, gridW, gridH, 0);
  const right = gridToScreen(DESK_RIGHT.x, DESK_RIGHT.y, gridW, gridH, 0);
  drawGamingDesk(ctx, left.x, left.y, ROOM_COLORS.neonCyan, "#2a6a5a");
  drawGamingDesk(ctx, right.x, right.y, ROOM_COLORS.neonMagenta, "#5a2a6a");
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

  // 背もたれ
  ctx.fillStyle = shade(ROOM_COLORS.couch, -18);
  ctx.fillRect(sx - 12, footY - ISO_BLOCK_H - 10, 24, 8);
  ctx.fillStyle = shade(ROOM_COLORS.couch, 12);
  ctx.fillRect(sx - 10, footY - ISO_BLOCK_H - 9, 20, 3);

  // 座面クッション
  ctx.fillStyle = shade(ROOM_COLORS.couch, 22);
  ctx.fillRect(sx - 10, footY - ISO_BLOCK_H - 3, 20, 5);
  ctx.fillStyle = shade(ROOM_COLORS.couch, -8);
  ctx.fillRect(sx - 8, footY - ISO_BLOCK_H - 1, 16, 2);

  // 肘掛け
  ctx.fillStyle = shade(ROOM_COLORS.couch, -25);
  ctx.fillRect(sx - 12, footY - ISO_BLOCK_H - 5, 4, 6);
  ctx.fillRect(sx + 8, footY - ISO_BLOCK_H - 5, 4, 6);
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
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.75, sy + hh * 0.45);
  ctx.lineTo(sx + hw * 0.75, sy + hh * 1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.55, sy + hh * 0.65);
  ctx.lineTo(sx + hw * 0.55, sy + hh * 1.35);
  ctx.stroke();

  ctx.fillStyle = "rgba(74, 240, 255, 0.06)";
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.3, sy + hh);
  ctx.lineTo(sx, sy + hh * 0.7);
  ctx.lineTo(sx + hw * 0.3, sy + hh);
  ctx.lineTo(sx, sy + hh * 1.3);
  ctx.closePath();
  ctx.fill();
}

/** 段差ランプタイル */
export function drawRampTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  idx: number,
) {
  const c = idx % 2 === 0 ? ROOM_COLORS.rampA : ROOM_COLORS.rampB;
  drawIsoFloorTile(ctx, sx, sy, shade(c, idx * 4), false, true);
}

/** @deprecated drawLoFiBackground を使用 */
export const drawHousingBackground = drawLoFiBackground;

/** @deprecated drawOutdoorPad を使用 */
export const drawOutdoorCheckerPad = drawOutdoorPad;
