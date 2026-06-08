export interface PlacedFurniture {
  inventoryItemId: string;
  itemId: string;
  gridX: number;
  gridY: number;
  rotation: 0 | 90 | 180 | 270;
  zIndex: number;
}

export type RoomLayout = PlacedFurniture[];

export const GRID_WIDTH = 16;
export const GRID_HEIGHT = 12;
export const TILE_SIZE = 32;

export type Direction = "up" | "down" | "left" | "right";
