"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_EVENTS } from "@/types/events";

interface PresenceUser {
  userId: string;
  isOnline: boolean;
}

/**
 * usePresence — subscribes to partner_joined / partner_left / presence_state events
 * and maintains a live map of which other users in the household are online.
 */
export function usePresence() {
  const { data: session } = useSession();
  const { subscribe, isConnected } = useWebSocket();
  const [onlinePartnerIds, setOnlinePartnerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const myId = session?.user?.id;

    // On receiving the initial snapshot of who's already online
    const unsubState = subscribe(WS_EVENTS.PRESENCE_STATE, (data: unknown) => {
      const payload = data as { onlineUsers: string[] };
      if (!Array.isArray(payload?.onlineUsers)) return;
      setOnlinePartnerIds(
        new Set(payload.onlineUsers.filter((id) => id !== myId))
      );
    });

    const unsubJoin = subscribe(WS_EVENTS.PARTNER_JOINED, (data: unknown) => {
      const payload = data as { userId: string };
      if (!payload?.userId || payload.userId === myId) return;
      setOnlinePartnerIds((prev) => new Set([...prev, payload.userId]));
    });

    const unsubLeft = subscribe(WS_EVENTS.PARTNER_LEFT, (data: unknown) => {
      const payload = data as { userId: string };
      if (!payload?.userId) return;
      setOnlinePartnerIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
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
