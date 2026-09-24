"use client";

import { useMemo, useState } from "react";
import { Film, AlertCircle } from "lucide-react";

interface MemeRevealProps {
  imageUrl: string;
  videoUrl?: string | null;
  altText?: string;
  isRevealed?: boolean;
  className?: string;
}

/**
 * Extracts the 11-character YouTube video ID from any standard YouTube URL:
 * - https://www.youtube.com/watch?v=ABC12345678
 * - https://youtu.be/ABC12345678
 * - https://www.youtube.com/embed/ABC12345678
 * - https://www.youtube.com/shorts/ABC12345678
 * - https://m.youtube.com/watch?v=ABC12345678
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

export default function MemeReveal({
  imageUrl,
  videoUrl,
  altText = "Meme",
  isRevealed = false,
  className = "",
}: MemeRevealProps) {
  const [imageError, setImageError] = useState(false);

  const youtubeVideoId = useMemo(() => {
    return extractYouTubeId(videoUrl);
  }, [videoUrl]);

  return (
    <div
      className={`relative overflow-hidden bg-black/95 rounded-2xl flex items-center justify-center border border-gray-800 shadow-2xl select-none ${className}`}
    >
      {/* 1. GUESSING STAGE: Show UNBLURRED meme image (video is hidden) */}
      {!isRevealed ? (
        <div className="w-full h-full p-2 flex items-center justify-center bg-gray-950">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-full max-h-full object-contain rounded-xl select-none transition-transform duration-300"
              loading="eager"
              onError={() => setImageError(true)}
            />
          ) : (
            /* Safe Placeholder: App does NOT crash if actual meme image is not uploaded yet */
            <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center bg-gray-900/90 border border-gray-800 rounded-xl p-6 text-center">
              <span className="text-4xl mb-2">😂</span>
              <p className="text-base sm:text-lg font-black font-outfit text-yellow-400">
                MEME IMAGE CLUE
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {altText || "Inspect the meme and think of the answer!"}
              </p>
              <span className="text-[10px] text-gray-500 font-mono mt-2 bg-gray-800/80 px-2.5 py-1 rounded-full">
                {imageUrl}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* 2. REVEAL STAGE: YouTube video associated with that meme */
        <div className="w-full h-full flex items-center justify-center relative bg-black">
          {youtubeVideoId ? (
            <div className="w-full h-full relative aspect-video flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={altText || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full rounded-xl border-0"
              />
            </div>
          ) : (
            /* Missing or invalid YouTube URL fallback */
            <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gray-950">
              <Film className="w-12 h-12 mb-2 text-gray-600" />
              <p className="text-lg font-bold text-gray-300">Video unavailable</p>
              <p className="text-xs text-gray-500 mt-1">
                YouTube URL not provided or invalid format
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
