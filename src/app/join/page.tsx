"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured, getSupabaseErrorMessage } from "@/lib/supabase";
import { AlertCircle, ArrowRight, Loader2, RefreshCw } from "lucide-react";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get("pin") || "";

  const [pin, setPin] = useState(initialPin);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigError(getSupabaseErrorMessage());
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = pin.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanPin || !cleanName) {
      setError("Please enter both the Game PIN and your Player Name.");
      return;
    }

    if (cleanName.length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(getSupabaseErrorMessage() || "Supabase is not configured.");
      return;
    }

    setLoading(true);

    try {
      // 1. Find game by PIN
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, status, settings, name")
        .eq("game_pin", cleanPin)
        .maybeSingle();

      if (gameError) {
        console.error("[JoinPage] Error finding game:", gameError);
        if (gameError.code === "PGRST205") {
          throw new Error("Database table 'games' does not exist yet. Please run schema.sql in Supabase.");
        }
        throw new Error(gameError.message || "Failed to search for game.");
      }

      if (!game) {
        throw new Error(`Game PIN "${cleanPin}" was not found. Please double-check with the host.`);
      }

      if (game.status === "FINISHED") {
        throw new Error("This game has already finished.");
      }

      // Check for existing player in localStorage for this game
      const storedSession = localStorage.getItem(`guessthelogo_player_${game.id}`);
      let savedPlayerId: string | null = null;
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          savedPlayerId = parsed.playerId;
        } catch {
          // ignore corrupted local storage
        }
      }

      // 2. Check if a player with this name already exists in this game (case-insensitive)
      const { data: existingPlayers, error: playerCheckError } = await supabase
        .from("players")
        .select("id, name, score, connected")
        .eq("game_id", game.id);

      if (playerCheckError) {
        console.error("[JoinPage] Error checking existing players:", playerCheckError);
        throw new Error(playerCheckError.message);
      }

      const matchedPlayer = existingPlayers?.find(
        (p: any) => p.name?.toLowerCase() === cleanName.toLowerCase()
      );

      let activePlayerId: string;

      if (matchedPlayer) {
        // RECONNECT FLOW: Player already exists!
        activePlayerId = matchedPlayer.id;

        const { error: updateError } = await supabase
          .from("players")
          .update({
            connected: true,
            last_seen: new Date().toISOString(),
          })
          .eq("id", matchedPlayer.id);

        if (updateError) {
          console.warn("[JoinPage] Could not update reconnect status:", updateError);
        }
      } else {
        // NEW PLAYER JOIN FLOW:
        if (game.status !== "LOBBY" && !game.settings?.allowLateJoiners) {
          throw new Error("This game has already started and is not accepting new players.");
        }

        const { data: newPlayer, error: insertError } = await supabase
          .from("players")
          .insert({
            game_id: game.id,
            name: cleanName,
            score: 0,
            connected: true,
            last_seen: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("[JoinPage] Error inserting player:", insertError);
          if (insertError.code === "23505") {
            throw new Error("A player with this name is already in the game.");
          }
          throw new Error("Failed to join game. " + insertError.message);
        }

        activePlayerId = newPlayer.id;
      }

      // 3. Save player info in localStorage so they can reconnect if disconnected
      localStorage.setItem(
        `guessthelogo_player_${game.id}`,
        JSON.stringify({
          playerId: activePlayerId,
          name: cleanName,
        })
      );

      // 4. Navigate to play screen
      router.push(`/play/${cleanPin}`);
    } catch (err: any) {
      console.error("[JoinPage] Join error:", err);
      setError(err?.message || "An unexpected error occurred while joining.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-dark">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-orange-500 to-pink-500" />
        
        <h2 className="text-4xl font-outfit font-black mb-2 text-center tracking-tight">JOIN GAME</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Enter the PIN shown on the host's screen</p>

        {configError && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 mb-6 text-amber-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Config Notice</p>
              <p className="mt-1 text-xs opacity-90">{configError}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl mb-6 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="font-mono text-xs">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Game PIN</label>
            <input 
              type="text" 
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder="e.g. 482913"
              maxLength={10}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-2xl px-6 py-4 text-white text-3xl tracking-widest text-center font-mono focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all placeholder-gray-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Your Nickname</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SpeedGuesser"
              maxLength={20}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-2xl px-6 py-4 text-white text-xl text-center focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/50 transition-all placeholder-gray-600 font-medium"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-white font-bold text-xl py-5 rounded-2xl mt-4 transition-all disabled:opacity-50 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <span>ENTER GAME</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-brand" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
