"use client";

import React from "react";

interface WeatherOverlayProps {
  weather?: "rain" | "snow" | "clear";
}

export function WeatherOverlay({ weather = "clear" }: WeatherOverlayProps) {
  if (weather === "clear") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-xl">
      {weather === "rain" && (
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse">
          {/* We can use CSS-based rain animations in the future */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0),rgba(59,130,246,0.15))] bg-[length:2px_20px]" />
        </div>
      )}
      
      {weather === "snow" && (
        <div className="absolute inset-0 bg-white/5 animate-pulse">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[length:10px_10px]" />
        </div>
      )}
    </div>
  );
}
