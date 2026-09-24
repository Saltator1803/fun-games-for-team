"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured, getSupabaseErrorMessage } from "@/lib/supabase";
import { awardMemePoint } from "@/app/actions";
import LogoReveal from "@/components/LogoReveal";
import MemeReveal from "@/components/MemeReveal";
import { DEMO_LOGOS } from "@/lib/demoLogos";
import { DEMO_MEMES } from "@/lib/demoMemes";
import { 
  Users, Play, FastForward, Trophy, RotateCcw, 
  XCircle, CheckCircle, AlertCircle, RefreshCw, Copy, Check, ArrowRight, Square, Film, Award
} from "lucide-react";

export default function HostDashboard({ params }: { params: Promise<{ gameId: string }> }) {
  const router = useRouter();
  const { gameId } = use(params);

  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [awardingPlayerId, setAwardingPlayerId] = useState<string | null>(null);

  const isMemeGame = game?.game_type === "meme";

  // Synchronized server-authoritative timer for Host (ONLY for Logo game, NOT Meme game)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game?.status === "QUESTION_ACTIVE" && game.question_started_at && !isMemeGame) {
      const currentQ = questions.find((q) => q.order_number === game.current_question);
      const limit = currentQ?.time_limit || 10;
      const started = new Date(game.question_started_at).getTime();

      const updateTimer = () => {
        const now = Date.now();
        const elapsed = (now - started) / 1000;
        const rem = Math.max(0, limit - elapsed);
        setTimeLeft(rem);

        // When timer reaches 0, automatically transition to ANSWER_REVEAL for Logo game
        if (rem <= 0 && game.status === "QUESTION_ACTIVE") {
          updateGameState("ANSWER_REVEAL");
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 100);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [game?.status, game?.question_started_at, game?.current_question, questions, isMemeGame]);

  useEffect(() => {
    fetchGameData();
    
    // Subscribe to changes with high event capacity
    const channelName = `host-game-${gameId}`;
    const gameSub = supabase
      .channel(channelName)
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, 
        (payload: any) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            setGame(payload.new);
          }
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) => {
              const idx = prev.findIndex((p) => p.id === payload.new.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = payload.new;
                return next;
              }
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'submissions', filter: `game_id=eq.${gameId}` }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions((prev) => {
              if (prev.some((s) => s.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? payload.new : s))
            );
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`[HostDashboard] Realtime subscription error on ${channelName}`);
        }
      });

    return () => {
      supabase.removeChannel(gameSub);
    };
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setError(null);

      if (!isSupabaseConfigured()) {
        throw new Error(getSupabaseErrorMessage() || "Supabase environment variables are missing.");
      }

      const [gameRes, playersRes, questionsRes, submissionsRes] = await Promise.all([
        supabase.from("games").select("*").eq("id", gameId).single(),
        supabase.from("players").select("*").eq("game_id", gameId).order("score", { ascending: false }),
        supabase.from("questions").select("*").eq("game_id", gameId).order("order_number", { ascending: true }),
        supabase.from("submissions").select("*").eq("game_id", gameId)
      ]);

      if (gameRes.error) {
        if (gameRes.error.code === 'PGRST205') {
          throw new Error("Table 'games' was not found. Please apply the SQL migration in schema.sql.");
        }
        throw gameRes.error;
      }
      
      setGame(gameRes.data);
      if (playersRes.data) setPlayers(playersRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (submissionsRes.data) setSubmissions(submissionsRes.data);
    } catch (err: any) {
      console.error("[HostDashboard] fetchGameData error:", err);
      setError(err?.message || "Error loading game data.");
    } finally {
      setLoading(false);
    }
  };

  const copyPin = () => {
    if (!game?.game_pin) return;
    navigator.clipboard.writeText(game.game_pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Load questions into database according to game_type
  const loadQuestions = async () => {
    setLoading(true);
    try {
      let questionsToInsert: any[] = [];

      if (isMemeGame) {
        // Load meme questions (linked image_url and YouTube video_url pairs)
        const filteredMemes = DEMO_MEMES.filter((m) => {
          if (game?.settings?.memeCategory && game.settings.memeCategory !== "All Categories") {
            if (m.category !== game.settings.memeCategory) return false;
          }
          if (game?.settings?.memeDifficulty && game.settings.memeDifficulty !== "all") {
            if (m.difficulty !== game.settings.memeDifficulty) return false;
          }
          return true;
        });

        const listToUse = filteredMemes.length > 0 ? filteredMemes : DEMO_MEMES;

        questionsToInsert = listToUse.map((m, i) => ({
          game_id: gameId,
          order_number: i + 1,
          image_url: m.image_url,
          video_url: m.video_url || null,
          correct_answer: m.correct_answer,
          category: m.category,
          difficulty: m.difficulty,
          points: 100,
          time_limit: 10,
        }));
      } else {
        // Load 14 logo questions
        questionsToInsert = DEMO_LOGOS.map((l, i) => ({
          game_id: gameId,
          order_number: i + 1,
          image_url: l.url,
          correct_answer: l.answer,
          alternate_answers: l.alt,
          points: game?.settings?.points || 100,
          time_limit: game?.settings?.timeLimit || 10,
        }));
      }

      const { error: insertError } = await supabase.from("questions").insert(questionsToInsert);
      if (insertError) {
        console.error("[HostDashboard] Failed inserting questions:", {
          message: insertError?.message,
          code: insertError?.code,
          details: insertError?.details,
          hint: insertError?.hint,
          fullError: JSON.stringify(insertError, Object.getOwnPropertyNames(insertError), 2),
          questionsToInsert
        });
        alert("Failed to load questions: " + (insertError.message || insertError.code || JSON.stringify(insertError)));
      } else {
        await fetchGameData();
      }
    } catch (err: any) {
      console.error("[HostDashboard] loadQuestions error:", err);
      alert("Error loading questions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGameState = async (status: string, extraUpdates: any = {}) => {
    try {
      const { error } = await supabase.from("games").update({ status, ...extraUpdates }).eq("id", gameId);
      if (error) {
        console.error("[HostDashboard] Failed updating game state:", error);
      }
    } catch (err) {
      console.error("[HostDashboard] updateGameState error:", err);
    }
  };

  const startRound = async () => {
    const nextQ = game.current_question === 0 ? 1 : game.current_question;
    const now = new Date().toISOString();

    await updateGameState("QUESTION_ACTIVE", { 
      current_question: nextQ,
      question_started_at: now
    });
  };

  const nextQuestion = async () => {
    if (game.current_question >= questions.length) {
      await updateGameState("FINISHED", { ended_at: new Date().toISOString() });
    } else {
      const nextQ = game.current_question + 1;
      const now = new Date().toISOString();

      await updateGameState("QUESTION_ACTIVE", {
        current_question: nextQ,
        question_started_at: now
      });
    }
  };

  // Host manually awards +100 points to a player in Guess the Meme
  const handleAwardPlayer = async (playerId: string) => {
    if (!currentQuestion) return;
    setAwardingPlayerId(playerId);
    try {
      const res = await awardMemePoint(gameId, currentQuestion.id, playerId);
      if (res.success) {
        // Optimistic local update while realtime propagates
        setSubmissions((prev) => [
          ...prev.filter((s) => !(s.question_id === currentQuestion.id && s.player_id === playerId)),
          {
            game_id: gameId,
            question_id: currentQuestion.id,
            player_id: playerId,
            is_correct: true,
            points_awarded: 100,
          },
        ]);
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, score: (p.score || 0) + 100 } : p))
        );
      } else if (res.alreadyAwarded) {
        // Already awarded, prevent double scoring
      }
    } catch (err) {
      console.error("[HostDashboard] handleAwardPlayer error:", err);
    } finally {
      setAwardingPlayerId(null);
    }
  };

  const removePlayer = async (playerId: string) => {
    if (window.confirm("Remove this player from the game?")) {
      await supabase.from("players").delete().eq("id", playerId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-4 text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-brand" />
        <p className="font-outfit text-xl">Connecting to game lobby...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-white">
        <div className="glass p-8 rounded-3xl max-w-lg w-full text-center border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Lobby</h2>
          <p className="text-gray-400 text-sm mb-6">{error || "Game not found. It may have been deleted."}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/host")}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Back to Host
            </button>
            <button
              onClick={fetchGameData}
              className="px-6 py-3 bg-brand hover:bg-brand-hover rounded-xl font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions.find((q) => q.order_number === game.current_question);
  const currentSubmissions = submissions.filter((s) => s.question_id === currentQuestion?.id);
  const correctSubmissionsCount = currentSubmissions.filter((s) => s.is_correct).length;
  const isRoundEnded =
    game.status === "ANSWER_REVEAL" ||
    game.status === "LEADERBOARD" ||
    game.status === "FINISHED";

  const secondsDisplay = Math.ceil(Math.max(0, timeLeft)).toString().padStart(2, "0");
  const timeUrgency =
    timeLeft <= 3 ? "text-red-500" : timeLeft <= 5 ? "text-orange-400" : "text-white";

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-panel border-b border-gray-800 p-4 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isMemeGame ? "😂" : "🎯"}</span>
            <h1 className="text-xl sm:text-2xl font-bold font-outfit truncate max-w-[200px] sm:max-w-md">
              {game.name}
            </h1>
          </div>
          <button 
            onClick={copyPin}
            title="Click to copy Game PIN"
            className="flex items-center gap-2 bg-brand/10 hover:bg-brand/20 text-brand px-3 sm:px-4 py-1.5 rounded-full font-mono font-bold tracking-widest border border-brand/30 transition-all cursor-pointer text-sm sm:text-base"
          >
            <span>PIN: {game.game_pin}</span>
            {copiedPin ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300 bg-gray-800/80 px-3 sm:px-4 py-1.5 rounded-full border border-gray-700 text-xs sm:text-sm">
            <Users size={16} className="text-brand" />
            <span className="font-bold">{players.length} Players</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Game Stage & Controls */}
        <div className="w-full md:w-1/2 lg:w-3/5 bg-panel border-r border-gray-800 flex flex-col p-4 sm:p-6 overflow-y-auto">
          {/* 1. LOBBY VIEW */}
          {game.status === "LOBBY" && (
            <div className="max-w-xl mx-auto w-full my-auto space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span>{isMemeGame ? "GUESS THE MEME" : "GUESS THE LOGO"}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-outfit text-white">GAME LOBBY</h2>
              <p className="text-gray-400 text-sm">
                Direct players to open <span className="text-white font-mono font-bold">/join</span> and enter PIN:
              </p>
              <div className="bg-brand/10 border-2 border-brand/40 py-5 sm:py-6 px-8 sm:px-10 rounded-3xl inline-block shadow-2xl">
                <span className="font-mono text-5xl sm:text-6xl font-black tracking-widest text-brand">
                  {game.game_pin}
                </span>
              </div>

              {questions.length === 0 ? (
                <div className={`p-6 rounded-2xl border ${isMemeGame ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                  <p className={`mb-4 font-medium text-sm sm:text-base ${isMemeGame ? 'text-yellow-200' : 'text-orange-200'}`}>
                    {isMemeGame ? "No meme questions loaded yet." : "No logo questions loaded yet."}
                  </p>
                  <button 
                    onClick={loadQuestions}
                    className={`font-black py-4 px-8 rounded-xl transition-all w-full shadow-lg cursor-pointer text-base sm:text-lg ${
                      isMemeGame
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 text-black shadow-yellow-500/20'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                    }`}
                  >
                    {isMemeGame ? "LOAD 8 VIRAL MEMES PACK" : "LOAD 14 LOGO QUESTIONS"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="bg-gray-800/60 p-4 rounded-xl text-sm border border-gray-700 flex justify-between items-center max-w-sm mx-auto">
                    <span className="text-gray-400">Questions Loaded:</span>
                    <span className="font-bold text-white font-mono">{questions.length}</span>
                  </div>

                  <button 
                    onClick={startRound}
                    disabled={players.length === 0}
                    className={`w-full max-w-sm mx-auto font-black py-4 sm:py-5 rounded-2xl text-lg sm:text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                      isMemeGame
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 text-black shadow-[0_0_25px_rgba(234,179,8,0.3)]'
                        : 'bg-brand hover:bg-brand-hover text-white shadow-[0_0_25px_rgba(255,51,102,0.4)]'
                    }`}
                  >
                    <Play size={22} />
                    <span>START GAME ({players.length} JOINED)</span>
                  </button>

                  {players.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Join from another window with PIN <strong className="text-gray-400">{game.game_pin}</strong> to start.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. ACTIVE QUESTION VIEW (PHASE 1: MEME IMAGE / LOGO) */}
          {game.status === "QUESTION_ACTIVE" && currentQuestion && (
            <div className="max-w-xl mx-auto w-full my-auto space-y-6">
              {isMemeGame ? (
                /* GUESS THE MEME: NO TIMER! Host controls pace */
                <>
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                      <span>ROUND {game.current_question} / {questions.length}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white mt-1">
                      MEME IMAGE CLUE
                    </h2>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Players see this meme image. When ready to reveal the moment, click NEXT.
                    </p>
                  </div>

                  {/* Unblurred Meme Image */}
                  <MemeReveal
                    imageUrl={currentQuestion.image_url}
                    videoUrl={currentQuestion.video_url}
                    altText={currentQuestion.correct_answer}
                    isRevealed={false}
                    className="w-full aspect-video max-w-lg mx-auto shadow-2xl"
                  />

                  {/* Host NEXT Button to reveal video */}
                  <button
                    onClick={() => updateGameState("ANSWER_REVEAL")}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 text-black font-black py-4 sm:py-5 rounded-2xl text-lg sm:text-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 transform hover:scale-[1.01]"
                  >
                    <span>NEXT (SHOW YOUTUBE VIDEO)</span>
                    <ArrowRight size={22} />
                  </button>
                </>
              ) : (
                /* GUESS THE LOGO: Existing blurred logo with synchronized countdown timer */
                <>
                  <div className="text-center">
                    <p className="text-gray-400 font-bold tracking-widest text-xs uppercase mb-1">
                      ROUND {game.current_question} / {questions.length}
                    </p>
                    <div className={`text-6xl md:text-7xl font-black font-mono tracking-tight ${timeUrgency}`}>
                      {secondsDisplay}
                    </div>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">SECONDS</p>
                  </div>

                  <LogoReveal
                    imageUrl={currentQuestion.image_url}
                    altText="Logo"
                    timeLeft={timeLeft}
                    timeLimit={currentQuestion.time_limit || 10}
                    isRevealed={false}
                    className="w-full aspect-video max-w-lg mx-auto"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800/60 p-3.5 rounded-2xl border border-gray-700/80 text-center">
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Players</p>
                      <p className="text-2xl font-black font-mono text-white">{players.length}</p>
                    </div>
                    <div className="bg-gray-800/60 p-3.5 rounded-2xl border border-gray-700/80 text-center">
                      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Answered</p>
                      <p className="text-2xl font-black font-mono text-white">
                        {currentSubmissions.length} / {players.length}
                      </p>
                    </div>
                    <div className="bg-green-500/10 p-3.5 rounded-2xl border border-green-500/30 text-center">
                      <p className="text-[11px] text-green-400 uppercase font-bold tracking-wider mb-0.5">Correct</p>
                      <p className="text-2xl font-black font-mono text-green-400">
                        {correctSubmissionsCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => updateGameState("ANSWER_REVEAL")}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/20 text-sm sm:text-base"
                    >
                      <FastForward size={20} />
                      <span>REVEAL ANSWER EARLY</span>
                    </button>
                    <button
                      onClick={() => updateGameState("ANSWER_REVEAL")}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-5 py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-gray-700 text-sm sm:text-base"
                    >
                      <Square size={18} />
                      <span>END ROUND</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. REVEAL / SCORING STAGE (PHASE 2: YOUTUBE VIDEO + HOST SCORING) */}
          {isRoundEnded && currentQuestion && (
            <div className="max-w-xl mx-auto w-full my-auto space-y-5">
              {isMemeGame ? (
                /* GUESS THE MEME: Video + Host Scoring */
                <>
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider font-bold text-yellow-400">
                      MEME {game.current_question} REVEAL
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white mt-0.5">
                      {currentQuestion.correct_answer}
                    </h2>
                  </div>

                  {/* YouTube Video Player (Responsive Iframe) */}
                  <MemeReveal
                    imageUrl={currentQuestion.image_url}
                    videoUrl={currentQuestion.video_url}
                    altText={currentQuestion.correct_answer}
                    isRevealed={true}
                    className="w-full aspect-video max-w-lg mx-auto shadow-2xl"
                  />

                  {/* HOST SCORING: "Who got it right?" */}
                  <div className="glass p-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-yellow-400" />
                        <h3 className="text-base font-bold font-outfit text-white">
                          Who got it right?
                        </h3>
                      </div>
                      <span className="text-xs text-yellow-400/90 font-mono font-bold">+100 pts each</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Select all players who answered correctly. Each gets +100 points immediately.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                      {players.map((p) => {
                        const isAwarded = currentSubmissions.some(
                          (s) => s.player_id === p.id && s.is_correct
                        );
                        const isBusy = awardingPlayerId === p.id;

                        return (
                          <button
                            key={p.id}
                            disabled={isAwarded || isBusy}
                            onClick={() => handleAwardPlayer(p.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between text-sm font-bold transition-all text-left ${
                              isAwarded
                                ? "bg-green-500/20 border-green-500/60 text-green-300 cursor-default"
                                : "bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-white cursor-pointer active:scale-95"
                            }`}
                          >
                            <span className="truncate font-semibold">{p.name}</span>
                            {isAwarded ? (
                              <span className="text-xs font-mono text-green-400 font-bold flex items-center gap-1 shrink-0">
                                <Check size={14} /> +100 AWARDED
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-yellow-400 font-bold shrink-0">
                                +100 PTS
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {players.length === 0 && (
                        <p className="text-xs text-gray-500 col-span-2 text-center py-2">
                          No players in lobby
                        </p>
                      )}
                    </div>
                  </div>

                  {/* NEXT MEME Button */}
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 text-black font-black py-4 sm:py-5 rounded-2xl text-lg sm:text-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-yellow-500/25 transform hover:scale-[1.01]"
                  >
                    <span>
                      {game.current_question >= questions.length 
                        ? "VIEW FINAL RESULTS" 
                        : "NEXT MEME"}
                    </span>
                    <ArrowRight size={22} />
                  </button>
                </>
              ) : (
                /* GUESS THE LOGO: Existing Logo Reveal Screen */
                <>
                  <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-black text-red-500 font-outfit mb-1">TIME'S UP!</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">Correct Brand:</p>
                    <div className="bg-brand text-white text-2xl sm:text-4xl font-black py-3 sm:py-4 px-6 rounded-2xl mt-1.5 shadow-[0_0_30px_rgba(255,51,102,0.4)] font-outfit">
                      {currentQuestion.correct_answer}
                    </div>
                  </div>

                  <LogoReveal
                    imageUrl={currentQuestion.image_url}
                    altText={currentQuestion.correct_answer}
                    isRevealed={true}
                    className="w-full aspect-video max-w-lg mx-auto shadow-2xl"
                  />

                  <button
                    onClick={nextQuestion}
                    className="w-full bg-brand hover:bg-brand-hover text-white font-black py-4 sm:py-5 rounded-2xl text-lg sm:text-xl flex items-center justify-center gap-3 transition-all cursor-pointer transform hover:scale-[1.01] shadow-[0_0_25px_rgba(255,51,102,0.4)]"
                  >
                    <span>
                      {game.current_question >= questions.length 
                        ? "VIEW FINAL RESULTS" 
                        : "NEXT LOGO"}
                    </span>
                    <ArrowRight size={22} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* 4. GAME FINISHED VIEW */}
          {game.status === "FINISHED" && (
            <div className="max-w-xl mx-auto w-full my-auto space-y-6 text-center">
              <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 font-outfit">
                GAME OVER
              </h2>
              <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 my-4">
                <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">WINNER</p>
                <p className="text-3xl sm:text-4xl font-black text-white mt-1">{players[0]?.name || "Nobody"}</p>
                <p className="text-2xl font-mono text-brand mt-2 font-bold">{players[0]?.score || 0} pts</p>
              </div>

              <button
                onClick={() => updateGameState("LOBBY", { current_question: 0 })}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-700"
              >
                <RotateCcw size={20} />
                <span>PLAY AGAIN (RESET LOBBY)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Scoreboard & Player List */}
        <div className="w-full md:w-1/2 lg:w-2/5 bg-bg-dark p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            {/* Round Breakdown */}
            {isRoundEnded && currentQuestion && (
              <div className="glass p-5 rounded-2xl border border-gray-800">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center justify-between">
                  <span>ROUND RESULTS</span>
                  <span className="text-gray-500 font-normal">THIS QUESTION</span>
                </h3>
                <div className="space-y-2">
                  {[...players]
                    .map((p) => {
                      const sub = currentSubmissions.find((s) => s.player_id === p.id);
                      return {
                        player: p,
                        pointsAwarded: sub?.is_correct ? sub.points_awarded || 100 : 0,
                        isCorrect: !!sub?.is_correct,
                        responseTime: sub?.response_time,
                      };
                    })
                    .sort((a, b) => b.pointsAwarded - a.pointsAwarded)
                    .map((item, idx) => (
                      <div
                        key={item.player.id}
                        className={`flex justify-between items-center px-3 py-2.5 rounded-xl text-sm ${
                          item.isCorrect
                            ? "bg-green-500/10 border border-green-500/30 text-white"
                            : "bg-gray-800/40 text-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-gray-500 w-5">#{idx + 1}</span>
                          <span className="font-bold">{item.player.name}</span>
                          {!isMemeGame && item.responseTime ? (
                            <span className="text-[11px] text-gray-400 font-mono">({item.responseTime}s)</span>
                          ) : null}
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            item.pointsAwarded > 0 ? "text-green-400" : "text-gray-500"
                          }`}
                        >
                          +{item.pointsAwarded}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* LIVE LEADERBOARD / CURRENT SCORE */}
            <div className="glass p-5 rounded-2xl border border-gray-800">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-3 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span>CURRENT SCORE (LEADERBOARD)</span>
              </h3>

              <div className="space-y-2">
                <AnimatePresence>
                  {[...players]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((player, index) => {
                      const hasSubmitted = currentSubmissions.some((s) => s.player_id === player.id);

                      return (
                        <motion.div
                          key={player.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-3 rounded-xl flex items-center justify-between bg-gray-900/60 border border-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-gray-500 w-6">#{index + 1}</span>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{player.name}</span>
                              <span
                                className={`w-2 h-2 rounded-full inline-block ${
                                  player.connected ? "bg-green-500" : "bg-gray-600"
                                }`}
                              />
                            </div>
                            {game.status === "QUESTION_ACTIVE" && !isMemeGame && hasSubmitted && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                                ANSWERED
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-white">{player.score || 0} pts</span>
                            {game.status === "LOBBY" && (
                              <button
                                onClick={() => removePlayer(player.id)}
                                title="Kick player"
                                className="text-gray-500 hover:text-red-500 transition-colors"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>

                {players.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No players in game yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
