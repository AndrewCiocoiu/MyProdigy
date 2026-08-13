"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ActiveSession } from "@/types/models";
import { WS_EVENTS } from "@/types/events";
import {
  getCurrentSession,
  startFocusSession,
  joinFocusSession,
  endFocusSession,
} from "@/lib/api/session";

export function useJointSession() {
  const { data: authSession } = useSession();
  const { subscribe } = useWebSocket();
  const currentUserId = authSession?.user?.id;

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionEndMessage, setSessionEndMessage] = useState<string | null>(null);

  // 1. Initial fetch on mount
  useEffect(() => {
    let isMounted = true;
    getCurrentSession()
      .then((active) => {
        if (isMounted) {
          setSession(active);
        }
      })
      .catch((err) => {
        console.warn("[Session] Could not fetch current session:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time WebSocket subscriptions
  useEffect(() => {
    // Partner or self started a session
    const unsubStart = subscribe(WS_EVENTS.TIMER_START, (data: unknown) => {
      const active = data as ActiveSession;
      if (active?.id) {
        setSession(active);
        setSessionEndMessage(null);
        setError(null);
      }
    });

    // Timer synced / partner joined
    const unsubSync = subscribe(WS_EVENTS.TIMER_SYNC, (data: unknown) => {
      const active = data as ActiveSession;
      if (active?.id) {
        setSession(active);
        setError(null);
      }
    });

    // Session ended by partner or completed
    const unsubEnd = subscribe(WS_EVENTS.SESSION_ENDED, (data: unknown) => {
      const payload = data as { endedBy?: string; status?: string; message?: string };
      setSession(null);
      if (payload?.message) {
        setSessionEndMessage(payload.message);
      } else if (payload?.endedBy) {
        setSessionEndMessage(
          payload.status === "completed"
            ? "🎉 Session completed! Great work together."
            : `${payload.endedBy} ended the focus session.`
        );
      }
    });

    const unsubComplete = subscribe(WS_EVENTS.TIMER_COMPLETE, (data: unknown) => {
      const payload = data as { status?: string; message?: string };
      setSession(null);
      setSessionEndMessage(
        payload?.message || "🎉 Focus session completed successfully! Rewards awarded to your household."
      );
    });

    return () => {
      unsubStart();
      unsubSync();
      unsubEnd();
      unsubComplete();
    };
  }, [subscribe]);

  const startSession = useCallback(
    async (durationMinutes: number) => {
      if (durationMinutes < 2) {
        setError("Minimum focus duration is 2 minutes.");
        return;
      }

      setLoading(true);
      setError(null);
      setSessionEndMessage(null);
      try {
        const newSession = await startFocusSession({
          durationMinutes,
          sessionType: "JOINT",
        });
        setSession(newSession);
      } catch (err: any) {
        setError(err.message || "Failed to start session");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const joinSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await joinFocusSession();
      setSession(updated);
    } catch (err: any) {
      setError(err.message || "Failed to join session");
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await endFocusSession();
      setSession(null);
    } catch (err: any) {
      setError(err.message || "Failed to end session");
    } finally {
      setLoading(false);
    }
  }, []);

  const isHost = Boolean(session && currentUserId && session.creatorUserId === currentUserId);
  const isParticipant = Boolean(
    session && currentUserId && session.participantIds?.includes(currentUserId)
  );

  return {
    session,
    loading,
    error,
    sessionEndMessage,
    clearMessage: () => setSessionEndMessage(null),
    clearError: () => setError(null),
    startSession,
    joinSession,
    endSession,
    isHost,
    isParticipant,
  };
}
