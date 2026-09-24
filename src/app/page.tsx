"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Gamepad2, Play, Users, Trophy, Zap, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState("");

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim().toUpperCase();
    if (clean) {
      router.push(`/join?pin=${clean}`);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 relative overflow-hidden bg-bg-dark text-white">
      {/* Background ambient glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-brand/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-96 left-1/4 w-[400px] h-[400px] bg-orange-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 max-w-4xl mx-auto pt-6 pb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs sm:text-sm font-bold uppercase tracking-widest mb-6">
          <Sparkles size={16} />
          <span>Your Friday. Your Games. Your Squad.</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-outfit tracking-tight leading-none mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent drop-shadow-sm">
          FUN FRIDAY <span className="text-brand">GAMES</span>
        </h1>

        <p className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-outfit">
          "Turn Friday into game night."
        </p>

        <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-medium mb-8">
          Play fast, competitive multiplayer games with your friends, teammates, or colleagues.
        </p>

        {/* Quick Join Game PIN Widget */}
        <div className="max-w-md mx-auto mb-12 glass p-3 sm:p-4 rounded-2xl border border-gray-700/80 shadow-2xl">
          <form onSubmit={handleJoinPin} className="flex gap-2">
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\s+/g, ""))}
              placeholder="ENTER 6-DIGIT PIN"
              maxLength={8}
              className="flex-1 bg-gray-900/90 border border-gray-700 focus:border-brand rounded-xl px-4 py-3 text-center font-mono font-black text-lg text-white tracking-widest uppercase focus:outline-none transition-colors placeholder:text-gray-600 placeholder:text-sm placeholder:font-sans placeholder:tracking-normal"
            />
            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="bg-brand hover:bg-brand-hover text-white font-extrabold px-6 py-3 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              <span>JOIN</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </motion.section>

      {/* CHOOSE YOUR GAME Section */}
      <section className="w-full max-w-5xl z-10 mx-auto pb-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black font-outfit tracking-tight">
              CHOOSE YOUR GAME
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Pick a party game, start a lobby, and share your Game PIN with your squad.
            </p>
          </div>
          <Link
            href="/games"
            className="text-sm font-bold text-brand hover:text-brand-hover flex items-center gap-1.5 transition-colors"
          >
            <span>View all games</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* GAME CARD 1: Guess the Logo */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-3xl p-6 sm:p-8 border border-gray-800 flex flex-col justify-between relative overflow-hidden group hover:border-brand/50 transition-all shadow-xl"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-brand/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand/20 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">🎯</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-brand/20 text-brand px-3 py-1 rounded-full border border-brand/30">
                  Popular
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-outfit text-white mb-2">
                Guess the Logo
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 font-medium">
                "How quickly can you recognize the brand?"
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-400 mb-8">
                <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-brand shrink-0" />
                  <span>20–30 Players</span>
                </div>
                <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400 shrink-0" />
                  <span>10–15 Minutes</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/host?game=logo" className="flex-1">
                <button className="w-full bg-brand hover:bg-brand-hover text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-brand/25 flex items-center justify-center gap-2 text-base cursor-pointer">
                  <Play size={18} />
                  <span>PLAY GAME</span>
                </button>
              </Link>
              <Link href="/games/logo">
                <button className="px-4 py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold border border-gray-700 transition-colors" title="Game details">
                  Info
                </button>
              </Link>
            </div>
          </motion.div>

          {/* GAME CARD 2: Guess the Meme */}
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-3xl p-6 sm:p-8 border border-gray-800 flex flex-col justify-between relative overflow-hidden group hover:border-yellow-500/50 transition-all shadow-xl"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-yellow-500/20 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">😂</span>
                <span className="text-xs font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">
                  New Game
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-outfit text-white mb-2">
                Guess the Meme
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6 font-medium">
                "Recognize the meme. Lock your answer. Then watch the moment."
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs font-medium text-gray-400 mb-8">
                <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-yellow-400 shrink-0" />
                  <span>20–30 Players</span>
                </div>
                <div className="bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 flex items-center gap-2">
                  <Zap size={16} className="text-orange-400 shrink-0" />
                  <span>10–15 Minutes</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/host?game=meme" className="flex-1">
                <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2 text-base cursor-pointer">
                  <Play size={18} />
                  <span>PLAY GAME</span>
                </button>
              </Link>
              <Link href="/games/meme">
                <button className="px-4 py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold border border-gray-700 transition-colors" title="Game details">
                  Info
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights Footer */}
      <section className="w-full max-w-4xl z-10 mx-auto pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-400 text-xs sm:text-sm font-medium glass p-5 rounded-2xl border border-gray-800">
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-2xl">⚡</span>
            <span className="text-white font-bold">Realtime Multiplayer</span>
            <span className="text-[11px] text-gray-400">Instant synced rounds</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-2xl">👥</span>
            <span className="text-white font-bold">20–30 Players</span>
            <span className="text-[11px] text-gray-400">Zero installs required</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-2xl">📱</span>
            <span className="text-white font-bold">Mobile Friendly</span>
            <span className="text-[11px] text-gray-400">Viewport-first for players</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-2xl">🏆</span>
            <span className="text-white font-bold">Live Scoring</span>
            <span className="text-[11px] text-gray-400">Speed bonus points</span>
          </div>
        </div>
      </section>
    </main>
  );
}
