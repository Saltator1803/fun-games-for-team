"use client";

import Link from "next/link";
import { 
  Gamepad2, PlusCircle, Share2, UserPlus, Play, Zap, Trophy, Award, ArrowRight
} from "lucide-react";

export default function HowToPlayPage() {
  const steps = [
    {
      num: "01",
      title: "Choose a Game",
      description: "Pick from Guess the Logo or Guess the Meme depending on your squad's vibe.",
      icon: <Gamepad2 className="w-6 h-6 text-brand" />,
    },
    {
      num: "02",
      title: "Host Creates a Room",
      description: "One person hosts on their laptop or screen and configures the quiz settings.",
      icon: <PlusCircle className="w-6 h-6 text-orange-400" />,
    },
    {
      num: "03",
      title: "Share the Game PIN",
      description: "A 6-digit numeric PIN is displayed on the host screen for everyone in the room.",
      icon: <Share2 className="w-6 h-6 text-yellow-400" />,
    },
    {
      num: "04",
      title: "Players Join",
      description: "Players navigate to /join on their phones or browsers, enter the PIN, and type their nickname.",
      icon: <UserPlus className="w-6 h-6 text-emerald-400" />,
    },
    {
      num: "05",
      title: "Game Begins",
      description: "Host clicks Start Game. Everyone's screen synchronizes in real time.",
      icon: <Play className="w-6 h-6 text-cyan-400" />,
    },
    {
      num: "06",
      title: "Guess as Quickly as Possible",
      description: "Observe the clue on screen, type your answer, and press GUESS or Enter immediately.",
      icon: <Zap className="w-6 h-6 text-pink-400" />,
    },
    {
      num: "07",
      title: "Earn Points",
      description: "Fast correct guesses earn maximum speed-bonus points. Your answer locks once correct.",
      icon: <Award className="w-6 h-6 text-purple-400" />,
    },
    {
      num: "08",
      title: "See the Leaderboard",
      description: "After the timer ends, review the round breakdown and check the live podium!",
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
    },
  ];

  return (
    <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 max-w-4xl mx-auto w-full text-white">
      {/* Header */}
      <div className="text-center my-6 sm:my-10 space-y-2">
        <h1 className="text-4xl sm:text-6xl font-black font-outfit tracking-tight">
          HOW TO <span className="text-brand">PLAY</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
          Fun Friday Games is built for fast, painless party play. No downloads required.
        </p>
      </div>

      {/* 8-Step Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-12">
        {steps.map((step) => (
          <div
            key={step.num}
            className="glass p-5 rounded-2xl border border-gray-800 flex items-start gap-4 hover:border-gray-700 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-500">{step.num}</span>
                <h3 className="font-bold font-outfit text-white text-lg">{step.title}</h3>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="w-full glass p-8 rounded-3xl border border-gray-800 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black font-outfit">Ready to turn Friday into game night?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Link href="/host">
            <button className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-brand-hover text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-brand/25 cursor-pointer">
              HOST A GAME
            </button>
          </Link>
          <Link href="/join">
            <button className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-colors border border-gray-700 cursor-pointer">
              JOIN A GAME
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
