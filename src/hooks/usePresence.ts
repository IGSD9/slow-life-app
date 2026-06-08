"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { reconnectDelay, shouldReconnect } from "@/lib/realtimeReconnect";

export function usePresence(userId: string | null) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled || !userId) return;
      channel = supabase.channel("online-users", {
        config: { presence: { key: userId } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState<{ userId: string }>();
          const ids = new Set<string>();
          for (const presences of Object.values(state)) {
            for (const p of presences) {
              if (p.userId) ids.add(p.userId);
            }
          }
          setOnlineIds(ids);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            attemptRef.current = 0;
            await channel!.track({ userId });
          } else if (shouldReconnect(status) && !cancelled) {
            supabase.removeChannel(channel!);
            retryTimer = setTimeout(() => {
              attemptRef.current += 1;
              connect();
            }, reconnectDelay(attemptRef.current));
          }
        });
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  const isOnline = useCallback(
    (id: string) => onlineIds.has(id),
    [onlineIds],
  );

  return { onlineIds, isOnline };
}
