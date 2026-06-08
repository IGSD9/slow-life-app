/** Realtime チャンネル再接続（指数バックオフ） */

export function reconnectDelay(attempt: number, baseMs = 1000, maxMs = 30000): number {
  return Math.min(baseMs * 2 ** attempt, maxMs);
}

export function shouldReconnect(status: string): boolean {
  return status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED";
}
