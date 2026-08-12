"use client";

import React from "react";

interface HouseRendererProps {
  level?: number;
  city?: string;
  wood?: number;
  stone?: number;
}

export function HouseRenderer({
  level = 1,
  city = "Hometown",
  wood = 0,
  stone = 0,
}: HouseRendererProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
      {/* Background theme depending on city */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/50 to-emerald-100/50 dark:from-indigo-950/30 dark:to-emerald-950/20" />
      
      {/* House Sprite / Graphic */}
      <div className="z-10 flex flex-col items-center gap-2">
        <div className="text-4xl">🏠</div>
        <div className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
          {city} Cozy Cottage
        </div>
        <div className="text-xs text-zinc-500">
          Level {level} House
        </div>

        {/* Resources progress */}
        <div className="mt-4 flex gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            🪵 Wood: {wood}
          </span>
          <span className="flex items-center gap-1 rounded bg-zinc-200 px-2 py-1 text-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
            🪨 Stone: {stone}
          </span>
        </div>
      </div>
    </div>
  );
}
