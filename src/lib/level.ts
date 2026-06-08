import { LEVEL_HARD_CAP, EXP_PER_LEVEL_BASE } from "./constants";

export function expRequiredForLevel(level: number): number {
  return EXP_PER_LEVEL_BASE * level * level;
}

export function calculateLevel(exp: number): number {
  let level = 1;
  while (exp >= expRequiredForLevel(level) && level < LEVEL_HARD_CAP) {
    level++;
  }
  return level;
}

export function expProgressInLevel(exp: number, level: number): {
  current: number;
  required: number;
  percent: number;
} {
  const prevRequired = level > 1 ? expRequiredForLevel(level - 1) : 0;
  const nextRequired = expRequiredForLevel(level);
  const current = exp - prevRequired;
  const required = nextRequired - prevRequired;
  return {
    current,
    required,
    percent: Math.min(100, Math.round((current / required) * 100)),
  };
}

export function clampExp(exp: number): number {
  return Math.min(exp, LEVEL_HARD_CAP);
}
