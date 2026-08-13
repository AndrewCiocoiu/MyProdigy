"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_EVENTS } from "@/types/events";
import { getHouseholdStatus } from "@/lib/api/household";

/**
 * usePresence — subscribes to partner_joined / partner_left / presence_state events
 * and maintains a live map of which other users in the household are online.
 */
export function usePresence(initialPartnerId?: string, initialOnline = false) {
  const { data: session } = useSession();
  const { subscribe, isConnected } = useWebSocket();
  const [onlinePartnerIds, setOnlinePartnerIds] = useState<Set<string>>(() => {
    if (initialPartnerId && initialOnline) {
      return new Set([initialPartnerId]);
    }
    return new Set();
  });

  const syncStatus = useCallback(async () => {
    try {
      const res = await getHouseholdStatus();
      if (res?.partnerId) {
        setOnlinePartnerIds((prev) => {
          const next = new Set(prev);
          if (res.isPartnerOnline) {
            next.add(res.partnerId!);
          } else {
            next.delete(res.partnerId!);
          }
          return next;
        });
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  // 1. Initial REST fetch + heartbeat sync
  useEffect(() => {
    syncStatus();
    const interval = setInterval(syncStatus, 8000);
    return () => clearInterval(interval);
  }, [syncStatus]);

  // 2. Real-time WebSocket subscriptions
  useEffect(() => {
    const myId = session?.user?.id;

    // Snapshot of who's already online
    const unsubState = subscribe(WS_EVENTS.PRESENCE_STATE, (data: unknown) => {
      const payload = data as { onlineUsers?: string[] };
      if (Array.isArray(payload?.onlineUsers)) {
        const others = payload.onlineUsers.filter((id) => id !== myId);
        setOnlinePartnerIds(new Set(others));
      }
    });

    const unsubJoin = subscribe(WS_EVENTS.PARTNER_JOINED, (data: unknown) => {
      const payload = data as { userId?: string };
      if (payload?.userId && payload.userId !== myId) {
        setOnlinePartnerIds((prev) => new Set([...prev, payload.userId!]));
      }
    });

    const unsubLeft = subscribe(WS_EVENTS.PARTNER_LEFT, (data: unknown) => {
      const payload = data as { userId?: string };
      if (payload?.userId) {
        setOnlinePartnerIds((prev) => {
          const next = new Set(prev);
          next.delete(payload.userId!);
          return next;
        });
      }
    });

    return () => {
      unsubState();
      unsubJoin();
      unsubLeft();
    };
  }, [subscribe, session?.user?.id]);

  const isPartnerOnline = (partnerId: string) => onlinePartnerIds.has(partnerId);
  const anyPartnerOnline = onlinePartnerIds.size > 0;

  return { onlinePartnerIds, isPartnerOnline, anyPartnerOnline, isConnected };
}
