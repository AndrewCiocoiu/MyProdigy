"use client";

import React, { useEffect, useState } from "react";

interface LobbyCountdownProps {
  lobbyExpiresAt: string;
  onExpire?: () => void;
  className?: string;
}

export function LobbyCountdown({
  lobbyExpiresAt,
  onExpire,
  className = "",
}: LobbyCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateDelta = () => {
      const end = new Date(lobbyExpiresAt).getTime();
      const now = new Date().getTime();
      const deltaMs = end - now;

      if (deltaMs <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        onExpire?.();
        return false;
      }

      const totalSeconds = Math.floor(deltaMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const formattedMin = String(minutes).padStart(2, "0");
      const formattedSec = String(seconds).padStart(2, "0");

      setTimeLeft(`${formattedMin}:${formattedSec}`);
      setIsExpired(false);
      return true;
    };

    calculateDelta();
    const interval = setInterval(() => {
      const active = calculateDelta();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lobbyExpiresAt, onExpire]);

  if (isExpired) {
    return (
      <span className={`text-xs font-semibold text-amber-600 dark:text-amber-400 ${className}`}>
        Join window expired
      </span>
    );
  }

  return (
    <span className={`font-mono text-sm font-bold text-amber-700 dark:text-amber-300 ${className}`}>
      {timeLeft}
    </span>
  );
}
