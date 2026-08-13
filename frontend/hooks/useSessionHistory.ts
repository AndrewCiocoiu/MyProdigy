"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_EVENTS } from "@/types/events";
import {
  FocusSessionHistoryItem,
  FocusSessionHistorySummary,
} from "@/types/models";
import { getFocusSessionHistory } from "@/lib/api/session";

export function useSessionHistory() {
  const { subscribe } = useWebSocket();
  const [sessions, setSessions] = useState<FocusSessionHistoryItem[]>([]);
  const [summary, setSummary] = useState<FocusSessionHistorySummary | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getFocusSessionHistory(50, 0);
      setSessions(data.sessions || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch session history");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  // Refresh history whenever a session ends or completes via WebSocket
  useEffect(() => {
    const unsubEnd = subscribe(WS_EVENTS.SESSION_ENDED, () => {
      // Small delay to let the database write complete
      setTimeout(() => fetchHistory(false), 500);
    });

    const unsubComplete = subscribe(WS_EVENTS.TIMER_COMPLETE, () => {
      setTimeout(() => fetchHistory(false), 500);
    });

    return () => {
      unsubEnd();
      unsubComplete();
    };
  }, [subscribe, fetchHistory]);

  return {
    sessions,
    summary,
    total,
    loading,
    error,
    refreshHistory: () => fetchHistory(true),
  };
}
