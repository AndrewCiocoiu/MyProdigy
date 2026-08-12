"use client";

import React, { useEffect, useState } from "react";

interface SyncTimerProps {
  expectedEndAt: string; // ISO/UTC String
  onComplete?: () => void;
}

export function SyncTimer({ expectedEndAt, onComplete }: SyncTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00");

  useEffect(() => {
    const calculateDelta = () => {
      const end = new Date(expectedEndAt).getTime();
      const now = new Date().getTime();
      const deltaMs = end - now;

      if (deltaMs <= 0) {
        setTimeLeft("00:00");
        onComplete?.();
        return false;
      }

      const totalSeconds = Math.floor(deltaMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const formattedMin = String(minutes).padStart(2, "0");
      const formattedSec = String(seconds).padStart(2, "0");
      
      setTimeLeft(`${formattedMin}:${formattedSec}`);
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
  }, [expectedEndAt, onComplete]);

  return (
    <div className="font-mono text-5xl font-bold tracking-widest text-zinc-900 dark:text-zinc-50">
      {timeLeft}
    </div>
  );
}
