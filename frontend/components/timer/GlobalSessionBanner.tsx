"use client";

import React from "react";
import { useJointSession } from "@/hooks/useJointSession";
import { LobbyCountdown } from "@/components/timer/LobbyCountdown";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function GlobalSessionBanner() {
  const { session, joinSession, isParticipant, loading } = useJointSession();
  const pathname = usePathname();

  // If already on /focus, FocusTimerView already renders the full join banner
  if (pathname === "/focus") {
    return null;
  }

  // Show only if there is a session waiting for partner and current user is not in it yet
  if (!session || isParticipant || session.status !== "waiting_for_partner") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-sm">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span>
            <strong>{session.creatorName}</strong> started a {session.durationMinutes}m focus session!
          </span>
          <span className="text-amber-100 text-xs hidden sm:inline">
            (Join window closes in: <LobbyCountdown lobbyExpiresAt={session.lobbyExpiresAt} className="text-white font-bold" />)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={joinSession}
            disabled={loading}
            className="rounded-xl bg-white px-3.5 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Session"}
          </button>
          <Link
            href="/focus"
            className="text-xs text-amber-100 hover:text-white underline underline-offset-2"
          >
            View Timer
          </Link>
        </div>
      </div>
    </div>
  );
}
