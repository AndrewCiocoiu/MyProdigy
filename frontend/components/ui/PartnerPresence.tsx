"use client";

import { usePresence } from "@/hooks/usePresence";

interface PartnerPresenceProps {
  /** The partner's user ID to check against. */
  partnerId?: string;
  /** Optional display name shown next to the dot. */
  partnerName?: string;
  /** Initial online state from server fetch. */
  initialOnline?: boolean;
  /** Extra Tailwind classes on the outer wrapper. */
  className?: string;
}

/**
 * PartnerPresence — renders a live online/offline indicator for the household partner.
 *
 * Powered by real-time WebSocket presence events and REST initial state;
 * turns green instantly when the partner connects and grey when they disconnect.
 */
export function PartnerPresence({
  partnerId,
  partnerName,
  initialOnline = false,
  className = "",
}: PartnerPresenceProps) {
  const { isPartnerOnline, anyPartnerOnline } = usePresence(partnerId, initialOnline);

  const online = partnerId ? isPartnerOnline(partnerId) : anyPartnerOnline;
  const label = partnerName ?? "Partner";

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      title={online ? `${label} is online` : `${label} is offline`}
      aria-live="polite"
      aria-label={online ? `${label} is online` : `${label} is offline`}
    >
      {/* Presence dot */}
      <span className="relative flex h-2.5 w-2.5">
        {online && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
            aria-hidden="true"
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
            online ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        />
      </span>

      {/* Name + status text */}
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
        <span
          className={`ml-1.5 text-xs font-medium transition-colors duration-300 ${
            online
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {online ? "online" : "offline"}
        </span>
      </span>
    </div>
  );
}
