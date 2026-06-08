import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  expProgressInLevel,
  expRequiredForLevel,
  clampExp,
} from "@/lib/level";

describe("level system", () => {
  it("calculates exp required per level", () => {
    expect(expRequiredForLevel(1)).toBe(100);
    expect(expRequiredForLevel(10)).toBe(10000);
  });

  it("calculates level from exp", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(99)).toBe(1);
  });

  it("clamps exp at hard cap", () => {
    expect(clampExp(999_999_999)).toBe(999_999);
  });

  it("returns progress within level", () => {
    const p = expProgressInLevel(150, 2);
    expect(p.current).toBeGreaterThan(0);
    expect(p.percent).toBeGreaterThanOrEqual(0);
    expect(p.percent).toBeLessThanOrEqual(100);
  });
});
