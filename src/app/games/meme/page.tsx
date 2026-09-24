"use client";

import Link from "next/link";
import { Users, Clock, Play, ArrowLeft, Zap, Film, Flame, Trophy, CheckCircle } from "lucide-react";

export default function MemeGamePage() {
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
        <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
          Guess the Meme
        </span>
      </div>

      <div className="w-full glass p-8 sm:p-12 rounded-3xl border border-gray-800 space-y-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-5xl shrink-0 shadow-lg shadow-yellow-500/20">
            😂
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black font-outfit tracking-tight">
              GUESS THE MEME
            </h1>
            <p className="text-xl text-gray-300 font-semibold mt-1">
              "Recognize the meme. Lock your answer. Then watch the moment."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Players</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Users size={18} className="text-yellow-400" /> 20–30 Players
            </span>
          </div>
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Duration</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Clock size={18} className="text-orange-400" /> 10–15 Minutes
            </span>
          </div>
          <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 col-span-2 sm:col-span-1">
            <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Climax Reveal</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <Film size={18} className="text-purple-400" /> Viral Video
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-outfit text-white">How the Game Works</h2>
          <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 text-center font-mono font-bold text-sm sm:text-base text-yellow-400">
            IMAGE → THINK → GUESS → REVEAL → VIDEO → SCORE
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400 font-mono font-black">01</span> Unblurred Meme Clue
              </span>
              <p className="text-gray-400 text-xs">
                The meme image is shown clearly right from the beginning. No blur—inspect the iconic face or situation!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400 font-mono font-black">02</span> Type & Lock
              </span>
              <p className="text-gray-400 text-xs">
                Submit your answer immediately. Once correct, your score locks while other players continue guessing.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400 font-mono font-black">03</span> The Viral Video Reveal
              </span>
              <p className="text-gray-400 text-xs">
                When the timer hits 0, the correct answer is revealed and the viral video moment plays for everyone!
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-1">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="text-yellow-400 font-mono font-black">04</span> Speed Points & Podiums
              </span>
              <p className="text-gray-400 text-xs">
                Faster guesses take home the highest points on the live synchronized leaderboard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-800">
          <Link href="/host?game=meme" className="flex-1">
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2 text-lg cursor-pointer">
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
