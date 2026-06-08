import { describe, expect, it } from "vitest";
import { screenToGrid, gridToScreen } from "@/lib/isometric";
import { GRID_WIDTH, GRID_HEIGHT } from "@/types/room";

describe("isometric coords", () => {
  it("roundtrips grid to screen and back", () => {
    const gx = 5;
    const gy = 6;
    const { x, y } = gridToScreen(gx, gy, GRID_WIDTH, GRID_HEIGHT);
    const back = screenToGrid(x, y, GRID_WIDTH, GRID_HEIGHT);
    expect(back).toEqual({ gridX: gx, gridY: gy });
  });

  it("returns null outside grid", () => {
    expect(screenToGrid(-100, -100, GRID_WIDTH, GRID_HEIGHT)).toBeNull();
  });
});
