/**
 * Helper utilities for absolute UTC times and durations.
 */

export function calculateTimeDelta(expectedEndAt: string): {
  totalSeconds: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const end = new Date(expectedEndAt).getTime();
  const now = new Date().getTime();
  const deltaMs = end - now;

  if (deltaMs <= 0) {
    return { totalSeconds: 0, minutes: 0, seconds: 0, formatted: "00:00" };
  }

  const totalSeconds = Math.floor(deltaMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedMin = String(minutes).padStart(2, "0");
  const formattedSec = String(seconds).padStart(2, "0");

  return {
    totalSeconds,
    minutes,
    seconds,
    formatted: `${formattedMin}:${formattedSec}`,
  };
}
