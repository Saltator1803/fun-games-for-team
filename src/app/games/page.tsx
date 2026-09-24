"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Clock, Play, Sparkles, Flame, Eye, Film, Music, Clapperboard, Smile } from "lucide-react";

export default function GamesHub() {
  const games = [
    {
      id: "logo",
      title: "GUESS THE LOGO",
      tagline: "Recognize it before everyone else.",
      description: "A blurred brand logo progressively reveals second-by-second. Guess fastest to earn maximum speed points!",
      icon: "🎯",
      players: "20–30 Players",
      duration: "10–15 Minutes",
      playUrl: "/host?game=logo",
      detailsUrl: "/games/logo",
      badge: "LIVE NOW",
      accent: "from-brand to-rose-600",
      buttonClass: "bg-brand hover:bg-brand-hover text-white shadow-brand/30",
    },
    {
      id: "meme",
      title: "GUESS THE MEME",
      tagline: "Guess the meme before the moment is revealed.",
      description: "Inspect the iconic meme image, submit your guess before the timer runs out, and then watch the viral video clip reveal!",
      icon: "😂",
      players: "20–30 Players",
      duration: "10–15 Minutes",
      playUrl: "/host?game=meme",
      detailsUrl: "/games/meme",
      badge: "NEW GAME",
      accent: "from-yellow-500 to-orange-500",
      buttonClass: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black shadow-yellow-500/25",
    },
  ];

  const comingSoonGames = [
    {
      title: "Guess the Movie",
      tagline: "One screenshot, one quote.",
      icon: <Clapperboard className="w-8 h-8 text-indigo-400" />,
      tag: "Coming Soon",
    },
    {
      title: "Guess the Song",
      tagline: "5-second music intro challenge.",
      icon: <Music className="w-8 h-8 text-pink-400" />,
      tag: "Coming Soon",
    },
    {
      title: "Guess the Emoji",
      tagline: "Decode the movie, phrase, or brand.",
      icon: <Smile className="w-8 h-8 text-emerald-400" />,
      tag: "Coming Soon",
    },
  ];

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-6xl mx-auto w-full text-white">
      {/* Page Header */}
      <div className="text-center my-6 sm:my-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-widest">
          <Sparkles size={14} />
          <span>Party Game Library</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black font-outfit tracking-tight">
          AVAILABLE <span className="text-brand">GAMES</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Choose any game below to start an interactive multiplayer room for your team or friends.
        </p>
      </div>

      {/* Available Games List */}
      <div className="w-full space-y-6 mb-16">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-3xl p-6 sm:p-8 border border-gray-800 hover:border-gray-700 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-inner">
                {game.icon}
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white tracking-tight">
                    {game.title}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-700">
                    {game.badge}
                  </span>
                </div>
                <p className="text-gray-200 font-semibold text-base sm:text-lg">
                  "{game.tagline}"
                </p>
                <p className="text-gray-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {game.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-gray-400">
                  <div className="flex items-center gap-1.5 bg-gray-900/60 px-3 py-1 rounded-xl border border-gray-800">
                    <Users size={14} className="text-brand" />
                    <span>{game.players}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-900/60 px-3 py-1 rounded-xl border border-gray-800">
                    <Clock size={14} className="text-yellow-400" />
                    <span>{game.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <Link href={game.detailsUrl} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-bold text-sm transition-colors border border-gray-700 cursor-pointer">
                  How it Works
                </button>
              </Link>
              <Link href={game.playUrl} className="w-full sm:w-auto">
                <button
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${game.buttonClass}`}
                >
                  <Play size={18} />
                  <span>PLAY</span>
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Games Teaser */}
      <div className="w-full">
        <h3 className="text-xl font-bold font-outfit text-gray-300 mb-4 flex items-center gap-2">
          <span>COMING SOON TO FUN FRIDAY</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {comingSoonGames.map((game, i) => (
            <div
              key={i}
              className="glass p-5 rounded-2xl border border-gray-800/80 bg-gray-950/40 space-y-2 opacity-80"
            >
              <div className="flex items-center justify-between">
                {game.icon}
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800/80 text-gray-400 px-2.5 py-0.5 rounded-full">
                  {game.tag}
                </span>
              </div>
              <h4 className="text-lg font-bold font-outfit text-white">{game.title}</h4>
              <p className="text-gray-400 text-xs">{game.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
