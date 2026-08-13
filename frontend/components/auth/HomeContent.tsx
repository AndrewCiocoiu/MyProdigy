"use client";

import { useEffect, useState } from "react";
import { getHouseholdStatus, leaveHousehold } from "@/lib/api/household";
import { HouseholdStatusResponse } from "@/types/models";
import { HouseholdSetup } from "./HouseholdSetup";
import Link from "next/link";

import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_EVENTS } from "@/types/events";

import { MainPageSessionWidget } from "@/components/timer/MainPageSessionWidget";

interface HomeContentProps {
  userName?: string;
  userId?: string;
}

export function HomeContent({ userName, userId }: HomeContentProps) {
  const [status, setStatus] = useState<HouseholdStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribe } = useWebSocket();

  const fetchStatus = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await getHouseholdStatus();
      setStatus(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch household status");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!confirm("Are you sure you want to leave this household? This will disband your shared home.")) {
      return;
    }
    setLeaving(true);
    try {
      await leaveHousehold();
      await fetchStatus(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to leave household");
    } finally {
      setLeaving(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Listen for real-time WebSocket events
  useEffect(() => {
    // Periodically fetch status (every 10s) as a heartbeat backup
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 10000);

    // Event 1: When partner joins the household code from another device
    const unsubHousehold = subscribe("household_joined", () => {
      console.log("[WS Event] household_joined received - refreshing status");
      fetchStatus(false);
    });

    // Event 2: When partner leaves or disbands household
    const unsubHouseholdLeft = subscribe("household_left", () => {
      console.log("[WS Event] household_left received - refreshing status");
      fetchStatus(false);
    });

    // Event 3: When partner opens WebSocket connection
    const unsubJoin = subscribe(WS_EVENTS.PARTNER_JOINED, (data: unknown) => {
      const payload = data as { userId?: string };
      if (payload?.userId && payload.userId !== userId) {
        setStatus((prev) =>
          prev ? { ...prev, isPartnerOnline: true } : prev
        );
      }
    });

    // Event 4: When partner closes WebSocket connection
    const unsubLeft = subscribe(WS_EVENTS.PARTNER_LEFT, (data: unknown) => {
      const payload = data as { userId?: string };
      if (payload?.userId && payload.userId !== userId) {
        setStatus((prev) =>
          prev ? { ...prev, isPartnerOnline: false } : prev
        );
      }
    });

    return () => {
      clearInterval(interval);
      unsubHousehold();
      unsubHouseholdLeft();
      unsubJoin();
      unsubLeft();
    };
  }, [subscribe, userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => fetchStatus(true)}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Gate 1: If user does NOT have a household, force them into HouseholdSetup
  if (!status?.hasHousehold) {
    return (
      <HouseholdSetup
        initialInvite={status?.activeInvite}
        onSuccess={() => fetchStatus()}
      />
    );
  }

  // Gate 2: User HAS a household -> Unlocked game access
  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Live Focus Session Alert Widget */}
      <MainPageSessionWidget />

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl dark:bg-emerald-950">
          🏡
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to Your Shared Home!
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your household is active and synced in real-time.
        </p>

        {/* Partner Presence Badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800/80">
          <span className="text-zinc-500 dark:text-zinc-400">Partner:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-bold">
            {status.partnerName || "Partner"}
          </span>
          <span className="flex items-center gap-1.5 ml-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status.isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            <span
              className={
                status.isPartnerOnline
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-zinc-400 dark:text-zinc-500"
              }
            >
              {status.isPartnerOnline ? "Online" : "Offline"}
            </span>
          </span>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/focus"
            className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            Enter Focus Room ⏱️
          </Link>
          <button
            onClick={handleLeaveHousehold}
            disabled={leaving}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60 disabled:opacity-50"
          >
            {leaving ? "Leaving..." : "Leave Household 🚪"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          Household Overview
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500">Partner Name:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{status.partnerName || "N/A"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500">Partner Status:</span>
            <span className="font-medium">
              {status.isPartnerOnline ? "🟢 Connected" : "⚪ Disconnected"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500">Partnership ID:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{status.partnershipId}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Your User ID:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{userId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
