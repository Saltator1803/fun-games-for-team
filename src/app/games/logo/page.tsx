"use client";

import Link from "next/link";
import { Users, Clock, Play, ArrowLeft, Zap, ShieldCheck, Trophy, Sparkles } from "lucide-react";

export default function LogoGamePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-4xl mx-auto w-full text-white">
      <div className="w-full flex items-center justify-between mb-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Games</span>
        </Link>
        <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-brand/20 text-brand rounded-full border border-brand/30">
          Guess the Logo
        </span>
      </div>

      <div className="w-full glass p-8 sm:p-12 rounded-3xl border border-gray-800 space-y-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-brand/10 border border-brand/30 flex items-center justify-center text-5xl shrink-0 shadow-lg shadow-brand/20">
            🎯
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black font-outfit tracking-tight">
              GUESS THE LOGO
            </h1>
            <p className="text-xl text-gray-300 font-semibold mt-1">
              "How quickly can you recognize the brand?"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Players</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Users size={18} className="text-brand" /> 20–30 Players
            </span>
          </div>
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Duration</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Clock size={18} className="text-yellow-400" /> 10–15 Minutes
            </span>
          </div>
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 col-span-2 sm:col-span-1">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Scoring</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Zap size={18} className="text-orange-400" /> Speed-Based
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-outfit text-white">How the Game Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-brand font-mono font-black">01</span> Progressive Blur Reveal
              </span>
              <p className="text-gray-400 text-xs">
                Each round starts with a heavily blurred brand logo that sharpens progressively every second.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-brand font-mono font-black">02</span> Type Fastest to Win
              </span>
              <p className="text-gray-400 text-xs">
                Enter your guess directly. Fastest correct answers earn extra speed-bonus points!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-brand font-mono font-black">03</span> Instant Locking
              </span>
              <p className="text-gray-400 text-xs">
                When you get it right, your score locks immediately while other players keep guessing.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-brand font-mono font-black">04</span> Live Leaderboard
              </span>
              <p className="text-gray-400 text-xs">
                Scores and ranks update in real time after every question.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-800">
          <Link href="/host?game=logo" className="flex-1">
            <button className="w-full bg-brand hover:bg-brand-hover text-white font-extrabold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-brand/25 flex items-center justify-center gap-2 text-lg cursor-pointer">
              <Play size={20} />
              <span>HOST THIS GAME</span>
            </button>
          </Link>
          <Link href="/join" className="sm:w-1/3">
            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors border border-gray-700 cursor-pointer">
              JOIN WITH PIN
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
