import type { RoomLayout } from "@/types/room";

const PC_SPRITE_KEY = "furniture_pc_01";

export function isNearPC(
  player: { gridX: number; gridY: number },
  pc: { gridX: number; gridY: number } | null,
  maxDist = 1,
): boolean {
  if (!pc) return false;
  return Math.abs(player.gridX - pc.gridX) + Math.abs(player.gridY - pc.gridY) <= maxDist;
}

export function resolvePCPosition(
  layout: RoomLayout,
  itemSpriteById: Map<string, string>,
): { gridX: number; gridY: number } | null {
  for (const f of layout) {
    const sprite = itemSpriteById.get(f.itemId);
    if (sprite === PC_SPRITE_KEY) return { gridX: f.gridX, gridY: f.gridY };
  }
  return null;
}
