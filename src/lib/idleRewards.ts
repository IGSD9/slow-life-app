export const MAX_IDLE_MINUTES = 1440;
export const GOLD_PER_MINUTE = 1;

export function calcIdleGold(lastCollectedAt: Date | string, now = new Date()): number {
  const last = typeof lastCollectedAt === "string" ? new Date(lastCollectedAt) : lastCollectedAt;
  const diffMs = now.getTime() - last.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  return Math.min(Math.max(minutes, 0), MAX_IDLE_MINUTES) * GOLD_PER_MINUTE;
}
