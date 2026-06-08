/** 日本時間（JST）の日付キー YYYY-MM-DD */
export function getTodayDateKeyJST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function parseMailPayload(raw: unknown): {
  items: { itemId: string; quantity: number; name?: string }[];
  coins: number;
  gems: number;
  exp: number;
} {
  const p = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(p.items)
    ? p.items
        .map((row) => {
          const r = row as Record<string, unknown>;
          const itemId = String(r.itemId ?? "");
          const quantity = Number(r.quantity ?? 1);
          if (!itemId) return null;
          return {
            itemId,
            quantity: Math.max(1, quantity),
            name: r.name ? String(r.name) : undefined,
          };
        })
        .filter(Boolean) as { itemId: string; quantity: number; name?: string }[]
    : [];

  return {
    items,
    coins: Math.max(0, Number(p.coins ?? 0)),
    gems: Math.max(0, Number(p.gems ?? 0)),
    exp: Math.max(0, Number(p.exp ?? 0)),
  };
}

export function formatMailRewardsSummary(payload: ReturnType<typeof parseMailPayload>): string {
  const parts: string[] = [];
  if (payload.coins > 0) parts.push(`🪙 ${payload.coins}`);
  if (payload.gems > 0) parts.push(`💎 ${payload.gems}`);
  if (payload.exp > 0) parts.push(`EXP ${payload.exp}`);
  for (const item of payload.items) {
    parts.push(item.name ? `${item.name}×${item.quantity}` : `アイテム×${item.quantity}`);
  }
  return parts.join(" · ") || "報酬なし";
}
