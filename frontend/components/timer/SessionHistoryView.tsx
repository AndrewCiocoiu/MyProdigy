"use client";

import React, { useState } from "react";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { FocusSessionHistoryItem } from "@/types/models";

type FilterType = "ALL" | "JOINT" | "SOLO" | "COMPLETED" | "ABORTED";

export function SessionHistoryView() {
  const { sessions, summary, loading, error, refreshHistory } = useSessionHistory();
  const [filter, setFilter] = useState<FilterType>("ALL");

  const filteredSessions = sessions.filter((s) => {
    if (filter === "JOINT") return s.sessionType === "JOINT";
    if (filter === "SOLO") return s.sessionType === "SOLO";
    if (filter === "COMPLETED") return s.status === "COMPLETED";
    if (filter === "ABORTED") return s.status === "ABORTED";
    return true;
  });

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const completionRate = summary && summary.totalSessions > 0
    ? Math.round((summary.completedSessions / summary.totalSessions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Household Session History
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A complete activity log of all focus sprints completed by your household.
          </p>
        </div>
        <button
          onClick={refreshHistory}
          disabled={loading}
          className="self-start sm:self-auto rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">Total Focus Time</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1 block">
              {formatDuration(summary.totalFocusMinutes)}
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">Completed Sprints</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.completedSessions}
              </span>
              <span className="text-xs text-zinc-400">/ {summary.totalSessions}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">Together vs Solo</span>
            <div className="flex items-center gap-2 mt-1 text-sm font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <span>✨</span>
                <span>{summary.jointSessions}</span>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                <span>👤</span>
                <span>{summary.soloSessions}</span>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">Completion Rate</span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1 block">
              {completionRate}%
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {(
          [
            { key: "ALL", label: "All Sessions" },
            { key: "JOINT", label: "✨ Together" },
            { key: "SOLO", label: "👤 Alone" },
            { key: "COMPLETED", label: "✅ Completed" },
            { key: "ABORTED", label: "⚠️ Abandoned" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === key
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* History List */}
      {loading && sessions.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
          <span className="text-3xl block mb-2">📜</span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">No sessions match this filter</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Complete focus sprints with your partner to build your shared chronicle!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-3.5">
                {/* Session Mode Icon Badge */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                    session.sessionType === "JOINT"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                  }`}
                >
                  {session.sessionType === "JOINT" ? "✨" : "👤"}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {session.durationMins} min Sprint
                    </span>
                    {/* Session Type Badge */}
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        session.sessionType === "JOINT"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      }`}
                    >
                      {session.sessionType === "JOINT" ? "Together (Joint)" : "Alone (Solo)"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Started by {session.userName || "Household member"} • {formatDate(session.startedAt)}
                  </p>
                </div>
              </div>

              {/* Outcome Badge */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    session.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  <span>{session.status === "COMPLETED" ? "✅" : "⚠️"}</span>
                  <span>{session.status === "COMPLETED" ? "Completed" : "Abandoned"}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
