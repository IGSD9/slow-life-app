/** ピクセルパーフェクト描画ヘルパー */

export function snap(n: number): number {
  return Math.round(n);
}

export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), w, h);
}

export function shade(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** カイロソフト風の太めアウトライン */
export const KAIRO_OUTLINE = "#483830";
export const KAIRO_OUTLINE_DARK = "#302820";

/** 左上光源の3面ボクセル色 */
export function voxelFaces(base: string) {
  return {
    top: shade(base, 28),
    left: shade(base, -6),
    right: shade(base, -32),
    edge: shade(base, -48),
  };
}
