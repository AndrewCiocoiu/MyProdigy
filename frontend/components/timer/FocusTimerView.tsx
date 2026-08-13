"use client";

import React, { useState } from "react";
import { useJointSession } from "@/hooks/useJointSession";
import { SyncTimer } from "@/components/timer/SyncTimer";
import { LobbyCountdown } from "@/components/timer/LobbyCountdown";
import Link from "next/link";

// 2m preset added for fast testing
const DURATION_PRESETS = [2, 5, 15, 25, 45, 60];

export function FocusTimerView() {
  const {
    session,
    loading,
    error,
    sessionEndMessage,
    clearError,
    clearMessage,
    startSession,
    joinSession,
    endSession,
    isHost,
    isParticipant,
  } = useJointSession();

  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [isEnding, setIsEnding] = useState<boolean>(false);

  const handleStart = async () => {
    const duration = customDuration ? parseInt(customDuration, 10) : selectedDuration;
    if (isNaN(duration) || duration < 2) {
      return;
    }
    await startSession(duration);
  };

  const handleEnd = async () => {
    if (!window.confirm("Ending this focus session will end it for both you and your partner. Are you sure?")) {
      return;
    }
    setIsEnding(true);
    try {
      await endSession();
    } finally {
      setIsEnding(false);
    }
  };

  const handleTimerComplete = async () => {
    try {
      await endSession();
    } catch {
      // Ignore if backend already completed it
    }
  };

  const isLobbyWindow = session?.status === "waiting_for_partner";
  const isJointActive = session?.status === "session_active";
  const isSoloActive = session?.status === "solo_active";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* End / Alert Messages */}
      {sessionEndMessage && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-sm font-medium">{sessionEndMessage}</p>
          </div>
          <button
            onClick={clearMessage}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 dark:text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PARTNER LOBBY INVITATION BANNER (Shown to non-participant partner) */}
      {session && !isParticipant && isLobbyWindow && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg animate-pulse">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Partner Working
                </span>
              </div>
              <h3 className="mt-2 text-xl font-extrabold">
                {session.creatorName} started a {session.durationMinutes}m focus session!
              </h3>
              <p className="text-xs text-amber-100 mt-1 flex items-center gap-1.5">
                <span>Join window closes in:</span>
                <LobbyCountdown
                  lobbyExpiresAt={session.lobbyExpiresAt}
                  className="bg-white/20 px-2 py-0.5 rounded text-white font-bold text-xs"
                />
              </p>
            </div>
            <button
              onClick={joinSession}
              disabled={loading}
              className="whitespace-nowrap rounded-2xl bg-white px-6 py-3 font-bold text-amber-600 shadow-md transition hover:bg-amber-50 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Joining..." : "⚡ Join Partner Now"}
            </button>
          </div>
        </div>
      )}

      {/* MAIN TIMER CARD */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 text-center space-y-8">
        {/* Header / Session Status */}
        <div className="space-y-1">
          {session ? (
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold">
              {isJointActive && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Joint Focus Session Active (Synchronized)
                </span>
              )}
              {isLobbyWindow && isHost && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Waiting for partner to join • Closes in{" "}
                  <LobbyCountdown lobbyExpiresAt={session.lobbyExpiresAt} />
                </span>
              )}
              {isSoloActive && (
                <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 rounded-full">
                  Solo Session Active (Join Window Closed)
                </span>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span>Choose your sprint length (minimum 2 minutes for testing)</span>
            </div>
          )}
        </div>

        {/* Digital Clock Display */}
        <div className="py-4">
          {session ? (
            <SyncTimer expectedEndAt={session.expectedEndAt} onComplete={handleTimerComplete} />
          ) : (
            <div className="font-mono text-6xl font-extrabold tracking-widest text-zinc-900 dark:text-zinc-50">
              {String(customDuration ? parseInt(customDuration, 10) || 2 : selectedDuration).padStart(2, "0")}:00
            </div>
          )}
        </div>

        {/* Participants display when active */}
        {session && (
          <div className="flex justify-center items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400 border-t border-b border-zinc-100 dark:border-zinc-800 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{session.creatorName} (Host)</span>
            </div>
            {isJointActive && (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Partner (Joined)</span>
              </div>
            )}
            {isLobbyWindow && (
              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
                <span>Partner (Invited)</span>
              </div>
            )}
          </div>
        )}

        {/* CONTROLS AREA */}
        {!session ? (
          /* Pre-Session Setup */
          <div className="space-y-6">
            {/* Duration Presets */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(preset);
                    setCustomDuration("");
                  }}
                  className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    selectedDuration === preset && !customDuration
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900 scale-105"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {preset} min
                </button>
              ))}

              {/* Custom Input */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="2"
                  max="180"
                  placeholder="Custom"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-24 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-sm font-semibold text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-50"
                />
                <span className="text-xs text-zinc-400">m</span>
              </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full max-w-sm rounded-2xl bg-zinc-900 py-3.5 font-bold text-white shadow-md transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Starting..." : "Start Focus Session"}
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Starting a session allows your partner to join within 1 minute (10m in production) to earn shared materials for your home and pet.
            </p>
          </div>
        ) : (
          /* Active Session Controls */
          <div className="space-y-4">
            {isParticipant ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleEnd}
                  disabled={isEnding || loading}
                  className="rounded-2xl bg-rose-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                >
                  {isEnding ? "Ending..." : "End Session for Both"}
                </button>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  Ending the session will end it simultaneously for both partners.
                </span>
              </div>
            ) : isLobbyWindow ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={joinSession}
                  disabled={loading}
                  className="rounded-2xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "Joining..." : "Join Partner Now"}
                </button>
              </div>
            ) : (
              <div className="text-sm text-zinc-500">
                Join window for this session has closed.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-3xl bg-zinc-100 p-6 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Cooperative Focus Rules</h4>
        <ul className="mt-2 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <li>• Minimum session duration is <strong>2 minutes</strong> (15m in production).</li>
          <li>• When one partner starts, the other has <strong>1 minute</strong> (10m in production) to join.</li>
          <li>• Timers are strictly synchronized via UTC timestamps so drift is impossible.</li>
          <li>• If either partner ends the session, it ends for both participants.</li>
        </ul>
      </div>
    </div>
  );
}
