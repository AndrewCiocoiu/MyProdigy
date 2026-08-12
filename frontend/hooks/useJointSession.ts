"use client";

import { useState, useEffect } from "react";
import { JointSession } from "@/types/models";

export function useJointSession() {
  const [session, setSession] = useState<JointSession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startLobby = async (durationMinutes: number) => {
    setLoading(true);
    try {
      // Setup waiting_for_partner lobby via API
      setSession({
        id: "dummy-lobby-uuid",
        householdId: "dummy-household-uuid",
        startedAt: new Date().toISOString(),
        expectedEndAt: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
        status: "waiting_for_partner",
        durationMinutes,
      });
    } catch (err: any) {
      setError(err.message || "Failed to start lobby");
    } finally {
      setLoading(false);
    }
  };

  const joinLobby = async (lobbyId: string) => {
    setLoading(true);
    try {
      // Transition from waiting_for_partner to session_active via API/WS
      if (session) {
        setSession({
          ...session,
          status: "session_active",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to join lobby");
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    startLobby,
    joinLobby,
  };
}
