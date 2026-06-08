import { describe, expect, it } from "vitest";
import { screenToGrid, gridToScreen } from "@/lib/isometric";
import { GRID_WIDTH, GRID_HEIGHT } from "@/types/room";

describe("isometric coords", () => {
  it("roundtrips grid to screen and back", () => {
    const gx = 2;
    const gy = 10;
    const { x, y } = gridToScreen(gx, gy, GRID_WIDTH, GRID_HEIGHT, 0);
    const back = screenToGrid(x, y, GRID_WIDTH, GRID_HEIGHT);
    expect(back).toEqual({ gridX: gx, gridY: gy });
  });

  it("returns null outside grid", () => {
    expect(screenToGrid(-100, -100, GRID_WIDTH, GRID_HEIGHT)).toBeNull();
  });
});
