"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured, getSupabaseErrorMessage } from "@/lib/supabase";
import { AlertCircle, Copy, Check, Sparkles, RefreshCw, Gamepad2, ArrowLeft } from "lucide-react";
import { MEME_CATEGORIES, MEME_DIFFICULTIES } from "@/lib/demoMemes";
import Link from "next/link";

function HostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial game type from query parameter, default to 'logo'
  const initialGameType = searchParams.get("game") === "meme" ? "meme" : "logo";
  const [gameType, setGameType] = useState<"logo" | "meme">(initialGameType);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [gameName, setGameName] = useState(
    initialGameType === "meme" ? "Friday Meme Showdown" : "Logo Masters Challenge"
  );
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);
  const [points, setPoints] = useState(100);

  // Meme-specific filters
  const [memeCategory, setMemeCategory] = useState<string>("All Categories");
  const [memeDifficulty, setMemeDifficulty] = useState<string>("all");

  const [settings, setSettings] = useState({
    multipleAttempts: true,
    caseInsensitive: true,
    ignoreSpaces: true,
    ignoreHyphens: true,
    acceptAlternate: true,
    showLeaderboard: true,
    showAnswer: true,
    randomize: false,
  });

  // Switch game type and set default name
  const handleGameTypeSelect = (type: "logo" | "meme") => {
    setGameType(type);
    if (type === "meme" && gameName === "Logo Masters Challenge") {
      setGameName("Friday Meme Showdown");
    } else if (type === "logo" && gameName === "Friday Meme Showdown") {
      setGameName("Logo Masters Challenge");
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigError(getSupabaseErrorMessage());
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Generates a 6-digit numeric game PIN that is checked for uniqueness.
   */
  const generateUniquePin = async (): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        const { data, error } = await supabase
          .from("games")
          .select("id")
          .eq("game_pin", pin)
          .maybeSingle();

        if (!error && !data) {
          return pin;
        }
      } catch {
        return pin;
      }
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  /**
   * Retrieves or creates a persistent host ID stored in localStorage.
   */
  const getOrCreateHostId = (): string => {
    if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
    let hostId = localStorage.getItem("guessthelogo_host_id");
    if (!hostId) {
      hostId = crypto.randomUUID();
      localStorage.setItem("guessthelogo_host_id", hostId);
    }
    return hostId;
  };

  const createGame = async () => {
    setLoading(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      const err = getSupabaseErrorMessage() || "Supabase is not configured.";
      console.error("[HostPage] Supabase config error:", err);
      setErrorMessage(err);
      setLoading(false);
      return;
    }

    try {
      const hostId = getOrCreateHostId();
      const gamePin = await generateUniquePin();

      const newGamePayload = {
        game_pin: gamePin,
        name: gameName.trim() || (gameType === "meme" ? "Guess The Meme Quiz" : "Guess The Logo Quiz"),
        game_type: gameType,
        host_id: hostId,
        status: "LOBBY",
        current_question: 0,
        settings: {
          gameType,
          memeCategory: gameType === "meme" ? memeCategory : undefined,
          memeDifficulty: gameType === "meme" ? memeDifficulty : undefined,
          numQuestions,
          timeLimit,
          points,
          ...settings,
        },
      };

      const { data, error } = await supabase
        .from("games")
        .insert(newGamePayload)
        .select()
        .single();

      if (error) {
        console.error("[HostPage] Supabase insert game error:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        });
        console.error("[HostPage] Raw error keys:", Object.keys(error || {}));
        console.error("[HostPage] Error message direct:", error?.message, "code:", error?.code);

        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          setErrorMessage(
            "Database table 'games' was not found in Supabase. Please open your Supabase SQL Editor and run the script in schema.sql."
          );
        } else if (error.code === "42501" || error.message?.includes("permission denied")) {
          setErrorMessage(
            "Row-Level Security (RLS) denied game creation. Run the updated policies in schema.sql in Supabase."
          );
        } else if (error.code === "23505") {
          return await retryCreateGame(newGamePayload);
        } else {
          setErrorMessage(
            `Message: ${error.message || 'none'} | Code: ${error.code || 'none'} | Details: ${error.details || 'none'} | Hint: ${error.hint || 'none'}`
          );
        }
        return;
      }

      if (!data || !data.id) {
        throw new Error("Game creation returned no data.");
      }

      router.push(`/host/game/${data.id}`);
    } catch (err: any) {
      console.error("[HostPage] Unexpected error in createGame:", err);
      setErrorMessage(
        err?.message || "An unexpected error occurred while communicating with Supabase."
      );
    } finally {
      setLoading(false);
    }
  };

  const retryCreateGame = async (payload: any) => {
    const freshPin = Math.floor(100000 + Math.random() * 900000).toString();
    const { data, error } = await supabase
      .from("games")
      .insert({ ...payload, game_pin: freshPin })
      .select()
      .single();

    if (error) {
      console.error("[HostPage] Retry createGame failed:", error);
      setErrorMessage(error.message);
      return;
    }

    if (data?.id) {
      router.push(`/host/game/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-bg-dark text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 sm:p-10 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden my-4"
      >
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${gameType === 'meme' ? 'from-yellow-400 via-orange-500 to-pink-500' : 'from-brand via-orange-500 to-pink-500'}`} />

        <div className="flex justify-between items-center mb-4">
          <Link href="/games" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            <ArrowLeft size={14} />
            <span>Games Hub</span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-wider bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
            FUN FRIDAY HOST
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-outfit font-black mb-2 text-center tracking-tight">
          HOST A GAME
        </h2>
        <p className="text-gray-400 text-center mb-6 text-xs sm:text-sm">
          Select a party game, tune your settings, and launch your live lobby
        </p>

        {/* Configuration Warning Alert */}
        {configError && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 mb-6 text-amber-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Supabase Configuration Required</p>
              <p className="mt-1 opacity-90">{configError}</p>
            </div>
          </div>
        )}

        {/* Runtime Error Display */}
        {errorMessage && (
          <div className="bg-red-500/15 border border-red-500/50 rounded-2xl p-4 mb-6 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-300">Could Not Create Game</p>
              <p className="mt-1 text-xs md:text-sm font-mono opacity-95">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* GAME TYPE SELECTOR */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Select Game Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleGameTypeSelect("logo")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameType === "logo"
                  ? "bg-brand/20 border-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
                  : "bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <span className="text-3xl">🎯</span>
              <span className="font-bold font-outfit text-base sm:text-lg">Guess the Logo</span>
              <span className="text-[10px] text-gray-400">Progressive Blur Reveal</span>
            </button>

            <button
              type="button"
              onClick={() => handleGameTypeSelect("meme")}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gameType === "meme"
                  ? "bg-yellow-500/20 border-yellow-500 text-white shadow-lg shadow-yellow-500/20 scale-[1.02]"
                  : "bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <span className="text-3xl">😂</span>
              <span className="font-bold font-outfit text-base sm:text-lg">Guess the Meme</span>
              <span className="text-[10px] text-yellow-300">Unblurred + Video Reveal</span>
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Game Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Game Room Name
            </label>
            <input 
              type="text" 
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g. Friday Showdown"
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors text-base font-bold"
            />
          </div>

          {/* Meme-specific category & difficulty options */}
          {gameType === "meme" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/20">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1.5">
                  Meme Category
                </label>
                <select
                  value={memeCategory}
                  onChange={(e) => setMemeCategory(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                >
                  {MEME_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={memeDifficulty}
                  onChange={(e) => setMemeDifficulty(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy (Iconic & Viral)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="hard">Hard (Deep Internet Lore)</option>
                </select>
              </div>
            </div>
          )}

          {/* Questions, Timer & Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Questions
              </label>
              <input 
                type="number" 
                min={1}
                max={50}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Number(e.target.value)))}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Time Limit
              </label>
              <select 
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand text-sm"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Base Points
              </label>
              <select 
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-brand text-sm"
              >
                <option value={50}>50 pts</option>
                <option value={100}>100 pts</option>
                <option value={150}>150 pts</option>
                <option value={200}>200 pts</option>
              </select>
            </div>
          </div>

          {/* Gameplay Options */}
          <div className="pt-3 border-t border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Gameplay Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(settings).slice(0, 4).map(([key, value]) => (
                <label 
                  key={key} 
                  onClick={() => handleToggle(key as keyof typeof settings)}
                  className="flex items-center space-x-3 cursor-pointer select-none bg-gray-900/40 p-2.5 rounded-xl border border-gray-800/80 hover:border-gray-700 transition-colors"
                >
                  <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${value ? (gameType === 'meme' ? 'bg-yellow-500' : 'bg-brand') : 'bg-gray-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs text-gray-300 font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={createGame}
            disabled={loading}
            className={`w-full font-black py-4 sm:py-5 rounded-2xl mt-4 transition-all disabled:opacity-50 text-lg shadow-xl flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-95 cursor-pointer ${
              gameType === 'meme'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black shadow-yellow-500/25'
                : 'bg-brand hover:bg-brand-hover text-white shadow-brand/30'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>CREATING LOBBY...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>LAUNCH {gameType === 'meme' ? 'MEME' : 'LOGO'} GAME LOBBY</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-brand" />
        </div>
      }
    >
      <HostPageContent />
    </Suspense>
  );
}
