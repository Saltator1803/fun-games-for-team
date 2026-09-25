"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Gamepad2, HelpCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // Hide global navbar on active player game screens to preserve the 100dvh viewport fit
  if (pathname?.startsWith("/play/")) {
    return null;
  }

  return (
    <header className="w-full bg-panel/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 select-none">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Name */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-outfit font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-brand transition-colors">
              FUN FRIDAY <span className="text-brand">GAMES <span className="hidden sm:inline">BY NIKITA</span></span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/games"
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              pathname === "/games"
                ? "bg-brand/15 text-brand border border-brand/30"
                : "text-gray-300 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <Gamepad2 size={16} />
            <span>Games</span>
          </Link>

          <Link
            href="/how-to-play"
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              pathname === "/how-to-play"
                ? "bg-brand/15 text-brand border border-brand/30"
                : "text-gray-300 hover:text-white hover:bg-gray-800/60"
            }`}
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">How to Play</span>
            <span className="sm:hidden">Rules</span>
          </Link>

          <Link
            href="/join"
            className="ml-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md shadow-brand/25"
          >
            JOIN GAME
          </Link>
        </nav>
      </div>
    </header>
  );
}
