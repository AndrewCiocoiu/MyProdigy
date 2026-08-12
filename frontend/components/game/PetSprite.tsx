"use client";

import React, { useEffect, useRef } from "react";

interface PetSpriteProps {
  spriteUrl?: string; // Path to sprite sheet
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  animationSpeedMs?: number;
}

export function PetSprite({
  spriteUrl = "/sprites/pets/default.png",
  frameWidth = 32,
  frameHeight = 32,
  frameCount = 4,
  animationSpeedMs = 200,
}: PetSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = spriteUrl;

    let currentFrame = 0;
    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false; // Keep pixel art sharp
      
      // Draw image slice: dx, dy, dw, dh, sx, sy, sw, sh
      ctx.drawImage(
        img,
        currentFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    const animate = () => {
      draw();
      currentFrame = (currentFrame + 1) % frameCount;
    };

    img.onload = () => {
      // Start loop
      const interval = setInterval(animate, animationSpeedMs);
      return () => clearInterval(interval);
    };

    // If already loaded
    if (img.complete) {
      const interval = setInterval(animate, animationSpeedMs);
      return () => clearInterval(interval);
    }
  }, [spriteUrl, frameWidth, frameHeight, frameCount, animationSpeedMs]);

  return (
    <div className="flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={128}
        height={128}
        className="h-32 w-32 image-render-pixelated"
      />
    </div>
  );
}
