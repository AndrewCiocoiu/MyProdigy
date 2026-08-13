"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useJointSession } from "@/hooks/useJointSession";
import { LobbyCountdown } from "@/components/timer/LobbyCountdown";
import { SyncTimer } from "@/components/timer/SyncTimer";

export function MainPageSessionWidget() {
  const router = useRouter();
  const { session, joinSession, endSession, isParticipant, loading } = useJointSession();

  if (!session) {
    return null;
  }

  const isLobbyWindow = session.status === "waiting_for_partner";
  const isJointActive = session.status === "session_active";

  const handleJoin = async () => {
    await joinSession();
    router.push("/focus");
  };

  // Case 1: Partner started a session and current user can join
  if (!isParticipant && isLobbyWindow) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Partner Working Now
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">
              {session.creatorName} started a {session.durationMinutes}-minute focus session!
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-amber-100">
              <span>Time remaining to join:</span>
              <LobbyCountdown
                lobbyExpiresAt={session.lobbyExpiresAt}
                className="bg-white/25 px-2.5 py-0.5 rounded-lg text-white font-black text-sm"
              />
              <span className="text-xs text-amber-200">
                (Once expired, session continues solo)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full sm:w-auto whitespace-nowrap rounded-2xl bg-white px-8 py-3.5 font-bold text-amber-700 shadow-md transition hover:bg-amber-50 active:scale-95 disabled:opacity-50 text-base"
            >
              {loading ? "Joining..." : "⚡ Join Partner in Focus"}
            </button>
            <Link
              href="/focus"
              className="w-full sm:w-auto text-center rounded-2xl bg-black/20 hover:bg-black/30 px-6 py-3.5 font-bold text-white text-sm backdrop-blur-sm transition"
            >
              View Timer Room
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Session is in progress (joint or host waiting)
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 text-2xl font-bold">
            ⏱️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isJointActive ? "Joint Focus Session in Progress" : "Focus Session Lobby Active"}
              </span>
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {isJointActive
                ? "You and your partner are focusing together"
                : isLobbyWindow
                ? `Waiting for partner • ${session.durationMinutes}m sprint`
                : "Solo focus sprint in progress"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-between md:justify-end">
          <div className="text-right">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 block">Time remaining</span>
            <div className="font-mono text-2xl font-black text-zinc-900 dark:text-zinc-50">
              <SyncTimer expectedEndAt={session.expectedEndAt} />
            </div>
          </div>
          <Link
            href="/focus"
            className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 whitespace-nowrap"
          >
            Open Focus Room →
          </Link>
        </div>
      </div>
    </div>
  );
}
