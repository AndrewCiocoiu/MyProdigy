"use client";

import { useState } from "react";
import { generateInviteCode, joinHousehold } from "@/lib/api/household";
import { HouseholdInvite } from "@/types/models";

interface HouseholdSetupProps {
  initialInvite?: HouseholdInvite;
  onSuccess: () => void;
}

export function HouseholdSetup({ initialInvite, onSuccess }: HouseholdSetupProps) {
  const [activeTab, setActiveTab] = useState<"join" | "generate">("generate");
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<HouseholdInvite | undefined>(initialInvite);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const newInvite = await generateInviteCode();
      setInvite(newInvite);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.replace(/^API request failed: \d+ [^-]+ - /, "").replaceAll('"', ''));
      } else {
        setError("Failed to generate code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code || code.trim().length !== 5) {
      setError("Please enter a valid 5-digit code");
      return;
    }

    setLoading(true);
    try {
      await joinHousehold(code.trim());
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.replace(/^API request failed: \d+ [^-]+ - /, "").replaceAll('"', ''));
      } else {
        setError("Failed to join household with code");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!invite?.code) return;
    navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          🏡
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create Your Shared Home</h2>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          You need a partner to enter the game space. Generate a code or join with an existing code.
        </p>
      </div>

      {/* Tab Controls */}
      <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80 mb-6">
        <button
          onClick={() => { setActiveTab("generate"); setError(null); }}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
            activeTab === "generate"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Generate Code
        </button>
        <button
          onClick={() => { setActiveTab("join"); setError(null); }}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
            activeTab === "join"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Enter 5-Digit Code
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tab 1: Generate Code */}
      {activeTab === "generate" && (
        <div className="space-y-4 text-center">
          {invite ? (
            <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/50 dark:bg-primary-950/30">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Your 5-Digit Household Code
              </span>
              <div className="my-2 text-3xl font-extrabold tracking-widest text-primary-700 dark:text-primary-300 font-mono">
                {invite.code}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Share this code with your partner. Once they enter it, your shared home will be unlocked!
              </p>
              <button
                onClick={copyToClipboard}
                className="mt-3 w-full rounded-lg bg-white border border-primary-200 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:bg-zinc-900 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-zinc-800"
              >
                {copied ? "Copied to Clipboard! ✓" : "Copy Code"}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Click below to generate a unique 5-digit code to send to your partner.
              </p>
              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full rounded-xl bg-primary-500 py-3 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate 5-Digit Code"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Join Code */}
      {activeTab === "join" && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              5-Digit Code
            </label>
            <input
              type="text"
              maxLength={5}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3K9M"
              className="mt-1 block w-full text-center tracking-widest font-mono uppercase text-xl font-bold rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 focus:border-primary-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length !== 5}
            className="w-full rounded-xl bg-primary-500 py-3 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Partner's Household"}
          </button>
        </form>
      )}
    </div>
  );
}
