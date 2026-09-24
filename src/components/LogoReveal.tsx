"use client";

import { useMemo } from "react";

interface LogoRevealProps {
  imageUrl: string;
  altText?: string;
  timeLeft?: number;
  timeLimit?: number;
  isRevealed?: boolean;
  className?: string;
}

export default function LogoReveal({
  imageUrl,
  altText = "Logo",
  timeLeft,
  timeLimit = 10,
  isRevealed = false,
  className = "",
}: LogoRevealProps) {
  // Exact user-specified progressive blur schedule:
  // 0 sec → blur(18px)
  // 1 sec → blur(14px)
  // 2 sec → blur(10px)
  // 3 sec → blur(6px)
  // 4 sec → blur(3px)
  // 5 sec+ → blur(0px)
  const blurAmount = useMemo(() => {
    if (isRevealed || (timeLeft !== undefined && timeLeft <= 0)) {
      return 0;
    }
    if (timeLeft === undefined) {
      return 18;
    }

    const elapsed = Math.max(0, (timeLimit || 10) - timeLeft);
    if (elapsed < 1) return 18;
    if (elapsed < 2) return 14;
    if (elapsed < 3) return 10;
    if (elapsed < 4) return 6;
    if (elapsed < 5) return 3;
    return 0;
  }, [timeLeft, timeLimit, isRevealed]);

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg border border-gray-700/60 select-none ${className}`}
    >
      {/* Real Logo Image with progressive CSS blur effect - NO dark cards or overlays */}
      <img
        src={imageUrl}
        alt={altText}
        style={{
          filter: `blur(${blurAmount}px)`,
          WebkitFilter: `blur(${blurAmount}px)`,
          transition: "filter 0.4s ease-out, -webkit-filter 0.4s ease-out",
        }}
        className="max-w-full max-h-full object-contain pointer-events-none transform-gpu"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
