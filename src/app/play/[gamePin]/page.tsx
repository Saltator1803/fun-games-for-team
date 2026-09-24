"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured, getSupabaseErrorMessage } from "@/lib/supabase";
import { submitAnswer } from "@/app/actions";
import LogoReveal from "@/components/LogoReveal";
import MemeReveal from "@/components/MemeReveal";
import { Trophy, CheckCircle, XCircle, AlertCircle, Loader2, Send, Film, Sparkles } from "lucide-react";

export default function PlayerView({ params }: { params: Promise<{ gamePin: string }> }) {
  const router = useRouter();
  const { gamePin } = use(params);

  const [game, setGame] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(10);

  // Player input state (Used ONLY for Guess the Logo)
  const [answerInput, setAnswerInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedCorrect, setHasSubmittedCorrect] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    points: number;
    responseTime?: number;
    correctAnswer?: string;
  } | null>(null);
  const [wrongFeedback, setWrongFeedback] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const isMemeGame = game?.game_type === "meme";

  // Synchronized server-authoritative timer countdown (ONLY for Guess the Logo, NOT for Meme)
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
      };

      updateTimer();
      interval = setInterval(updateTimer, 100);
    } else {
      setTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [game?.status, game?.question_started_at, game?.current_question, questions, isMemeGame]);

  // Reset player state whenever a new question starts
  useEffect(() => {
    if (game?.status === "QUESTION_ACTIVE") {
      setAnswerInput("");
      setSubmitting(false);
      setHasSubmittedCorrect(false);
      setSubmissionResult(null);
      setWrongFeedback(null);

      // Auto-focus input for Logo game
      if (!isMemeGame) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    }
  }, [game?.current_question, game?.status, isMemeGame]);

  // Main game initialization & realtime subscriptions
  useEffect(() => {
    let isMounted = true;
    let heartbeatInterval: NodeJS.Timeout;

    const init = async () => {
      if (!isSupabaseConfigured()) {
        setErrorNotice(getSupabaseErrorMessage() || "Supabase is not configured.");
        return;
      }

      // 1. Fetch Game
      const { data: gameData, error: gError } = await supabase
        .from("games")
        .select("*")
        .eq("game_pin", gamePin)
        .maybeSingle();

      if (gError || !gameData) {
        alert("Game not found. Redirecting to home.");
        router.push("/");
        return;
      }

      // 2. Retrieve local player session
      const stored = localStorage.getItem(`guessthelogo_player_${gameData.id}`);
      if (!stored) {
        router.push("/join");
        return;
      }

      let parsedPlayerId: string;
      try {
        parsedPlayerId = JSON.parse(stored).playerId;
      } catch {
        router.push("/join");
        return;
      }

      const { data: playerData, error: pError } = await supabase
        .from("players")
        .select("*")
        .eq("id", parsedPlayerId)
        .maybeSingle();

      if (pError || !playerData) {
        router.push("/join");
        return;
      }

      if (isMounted) {
        setGame(gameData);
        setPlayer(playerData);

        // Mark player connected
        await supabase
          .from("players")
          .update({ connected: true, last_seen: new Date().toISOString() })
          .eq("id", playerData.id);

        // Fetch questions
        const { data: qData } = await supabase
          .from("questions")
          .select("*")
          .eq("game_id", gameData.id)
          .order("order_number", { ascending: true });

        if (qData && isMounted) setQuestions(qData);

        // Fetch players
        const { data: pData } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", gameData.id)
          .order("score", { ascending: false });

        if (pData && isMounted) setPlayers(pData);

        // Fetch submissions
        const { data: sData } = await supabase
          .from("submissions")
          .select("*")
          .eq("game_id", gameData.id);

        if (sData && isMounted) setSubmissions(sData);
      }

      // Heartbeat ping
      heartbeatInterval = setInterval(async () => {
        if (isMounted && playerData?.id) {
          await supabase
            .from("players")
            .update({ last_seen: new Date().toISOString(), connected: true })
            .eq("id", playerData.id);
        }
      }, 15000);

      // Realtime subscription
      const channelName = `player-play-${parsedPlayerId}-${Date.now()}`;
      const sub = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "games", filter: `id=eq.${gameData.id}` },
          (payload: any) => {
            if (isMounted && payload.new) {
              setGame((prev: any) => ({ ...prev, ...payload.new }));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players", filter: `game_id=eq.${gameData.id}` },
          (payload: any) => {
            if (!isMounted) return;
            if (payload.eventType === "INSERT") {
              setPlayers((prev) => {
                if (prev.some((p) => p.id === payload.new.id)) return prev;
                return [...prev, payload.new].sort((a, b) => (b.score || 0) - (a.score || 0));
              });
            } else if (payload.eventType === "UPDATE") {
              if (payload.new.id === parsedPlayerId) {
                setPlayer(payload.new);
              }
              setPlayers((prev) =>
                prev
                  .map((p) => (p.id === payload.new.id ? payload.new : p))
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
              );
            } else if (payload.eventType === "DELETE") {
              setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "submissions", filter: `game_id=eq.${gameData.id}` },
          (payload: any) => {
            if (!isMounted) return;
            if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
              setSubmissions((prev) => {
                const idx = prev.findIndex((s) => s.id === payload.new.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = payload.new;
                  return updated;
                }
                return [...prev, payload.new];
              });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "questions", filter: `game_id=eq.${gameData.id}` },
          async () => {
            if (!isMounted) return;
            const { data: refreshedQ } = await supabase
              .from("questions")
              .select("*")
              .eq("game_id", gameData.id)
              .order("order_number", { ascending: true });
            if (refreshedQ && isMounted) setQuestions(refreshedQ);
          }
        )
        .subscribe();

      // Fast polling sync as fallback to guarantee video and question transition across all clients
      const syncInterval = setInterval(async () => {
        if (!isMounted || !gameData?.id) return;
        try {
          const { data: latestGame } = await supabase
            .from("games")
            .select("*")
            .eq("id", gameData.id)
            .single();

          if (latestGame && isMounted) {
            setGame((prev: any) => {
              if (
                !prev ||
                prev.status !== latestGame.status ||
                prev.current_question !== latestGame.current_question
              ) {
                return { ...prev, ...latestGame };
              }
              return prev;
            });
          }
        } catch {
          // ignore poll error
        }
      }, 1500);

      return () => {
        supabase.removeChannel(sub);
        clearInterval(syncInterval);
      };
    };

    init();

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
    };
  }, [gamePin, router]);

  // Ensure questions are always loaded even if player joined before host loaded them
  useEffect(() => {
    if (!game?.id) return;
    const hasCurrentQ = questions.some((q) => q.order_number === game.current_question);
    if (!hasCurrentQ || questions.length === 0) {
      supabase
        .from("questions")
        .select("*")
        .eq("game_id", game.id)
        .order("order_number", { ascending: true })
        .then((res: any) => {
          if (res?.data && res.data.length > 0) {
            setQuestions(res.data);
          }
        });
    }
  }, [game?.id, game?.current_question, questions.length]);

  // Handle answer submission (ONLY for Guess the Logo)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isMemeGame) return; // No submission in Guess the Meme

    const guess = answerInput.trim();
    if (!guess || hasSubmittedCorrect || submitting || timeLeft <= 0) return;

    const currentQ = questions.find((q) => q.order_number === game.current_question);
    if (!currentQ || !player) return;

    setSubmitting(true);
    setWrongFeedback(null);

    try {
      const res = await submitAnswer(game.id, currentQ.id, player.id, guess);

      if (res.success) {
        if (res.isCorrect) {
          setHasSubmittedCorrect(true);
          setSubmissionResult({
            points: res.pointsAwarded || 100,
            responseTime: res.responseTime,
            correctAnswer: res.correctAnswer,
          });
          setWrongFeedback(null);
        } else {
          setWrongFeedback("✕ WRONG ANSWER — Try again!");
          setAnswerInput("");
          inputRef.current?.focus();
        }
      } else {
        setWrongFeedback(res.error || "Submission failed");
      }
    } catch (err: any) {
      console.error("[PlayerView] submit error:", err);
      setWrongFeedback("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (errorNotice) {
    return (
      <div className="h-[100dvh] bg-bg-dark flex items-center justify-center p-4 text-white">
        <div className="glass p-6 rounded-2xl max-w-sm text-center border border-red-500/40">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Connection Notice</h2>
          <p className="text-gray-400 text-xs">{errorNotice}</p>
        </div>
      </div>
    );
  }

  if (!game || !player) {
    return (
      <div className="h-[100dvh] bg-bg-dark flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <div className="font-outfit text-lg font-bold">Connecting to game...</div>
      </div>
    );
  }

  const currentQ = questions.find((q) => q.order_number === game.current_question);
  const timeLimit = currentQ?.time_limit || 10;

  // Round ends if time reaches 0 (Logo) or host triggers ANSWER_REVEAL / MEME_VIDEO / LEADERBOARD / FINISHED (Meme or Logo)
  const isRoundEnded = isMemeGame
    ? (game.status === "ANSWER_REVEAL" || game.status === "MEME_VIDEO" || game.status === "LEADERBOARD" || game.status === "FINISHED")
    : (timeLeft <= 0 || game.status === "ANSWER_REVEAL" || game.status === "MEME_VIDEO" || game.status === "LEADERBOARD" || game.status === "FINISHED");

  const secondsDisplay = Math.ceil(Math.max(0, timeLeft));
  const timeUrgency =
    timeLeft <= 3 ? "text-red-500" : timeLeft <= 5 ? "text-orange-400" : "text-white";

  // Score & Rank calculations
  const thisRoundSub = submissions.find(
    (s) => s.question_id === currentQ?.id && s.player_id === player?.id
  );
  const roundPointsEarned = thisRoundSub?.is_correct
    ? thisRoundSub.points_awarded || 100
    : hasSubmittedCorrect
    ? submissionResult?.points || 100
    : 0;

  const latestPlayer = players.find((p) => p.id === player.id) || player;
  const totalScore = latestPlayer?.score || 0;
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const playerRank = sortedPlayers.findIndex((p) => p.id === player.id) + 1 || 1;

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-bg-dark text-white select-none">
      {/* 1. TOP HEADER (Strictly single row) */}
      <header className="h-12 shrink-0 bg-panel px-4 flex justify-between items-center border-b border-gray-800 z-10">
        <div className="flex items-center gap-2 text-sm font-outfit">
          <span className="text-gray-400">Player:</span>
          <span className="text-brand font-black text-base">{player.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isMemeGame && (
            <span className="text-[11px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
              😂 Guess the Meme
            </span>
          )}
          <div className="bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700 font-mono font-bold text-sm text-white">
            {totalScore} <span className="text-[11px] text-gray-400 font-sans">pts</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT */}
      <main className={`flex-1 w-full mx-auto p-3 flex flex-col justify-between overflow-x-hidden ${
        isMemeGame ? "max-w-7xl overflow-y-auto" : "max-w-[440px] items-center overflow-hidden"
      }`}>
        {/* LOBBY STATE */}
        {game.status === "LOBBY" && (
          <div className="my-auto text-center w-full space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-brand/10 border border-brand/30 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle size={32} className="text-brand" />
            </div>
            <h2 className="text-3xl font-black font-outfit text-white">You're in!</h2>
            <p className="text-gray-400 text-sm">
              Waiting for the host to start round 1...
            </p>

            <div className="glass p-4 rounded-xl border border-gray-800 text-left text-xs space-y-2 max-w-xs mx-auto">
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Game:</span>
                <span className="font-bold text-white truncate max-w-[140px]">{game.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Type:</span>
                <span className="font-bold text-white capitalize">{isMemeGame ? "😂 Guess the Meme" : "🎯 Guess the Logo"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="text-gray-400">Questions:</span>
                <span className="font-bold text-white font-mono">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Players:</span>
                <span className="font-bold text-brand font-mono">{players.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* GUESS THE MEME LAYOUT (Image or Video + Right Side Score) */}
        {/* ======================================================== */}
        {isMemeGame && game.status !== "LOBBY" && game.status !== "FINISHED" && (
          <div className="w-full flex-1 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-4 py-2 min-h-0">
            {/* Left / Center Area: Meme Image or YouTube Video (MAIN FOCUS) */}
            <div className="flex-1 w-full min-w-0 flex flex-col items-center justify-between min-h-0">
              {/* Header Title */}
              <div className="text-center mb-1 shrink-0">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ROUND {game.current_question} / {questions.length || 8}
                </span>
                {isRoundEnded ? (
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-outfit text-white mt-1">
                    {currentQ?.correct_answer || "Meme Reveal"}
                  </h2>
                ) : (
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-outfit text-white mt-1">
                    WHAT MEME IS THIS?
                  </h2>
                )}
              </div>

              {/* Large Responsive Media Box */}
              <div className="w-full flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2">
                <MemeReveal
                  imageUrl={currentQ?.image_url || `/memes/meme${game.current_question || 1}.png`}
                  videoUrl={currentQ?.video_url}
                  altText={currentQ?.correct_answer}
                  isRevealed={isRoundEnded}
                  className="w-full h-full max-h-[min(65vh,540px)] md:max-h-[min(74vh,650px)] aspect-video max-w-5xl mx-auto shadow-2xl"
                />
              </div>

              {/* Stage Caption */}
              <div className="shrink-0 text-center py-1">
                {isRoundEnded ? (
                  <p className="text-xs text-gray-400">
                    Viral video moment playing! Host is selecting who got it right.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Call it out or lock it in your mind — host controls the reveal!
                  </p>
                )}
              </div>
            </div>

            {/* Right Side: Player Score Panel */}
            <div className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col justify-center">
              <div className="glass p-4 sm:p-5 rounded-2xl border border-gray-800 space-y-3.5 shadow-2xl bg-gray-900/80 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏆</span>
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-300">
                      Your Score
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 px-2.5 py-0.5 rounded-full">
                    Rank #{playerRank}
                  </span>
                </div>

                {/* Big Score Box */}
                <div className="bg-gray-950/80 p-3 sm:p-4 rounded-xl border border-gray-800 text-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
                    Total Score
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                    {totalScore}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold block mt-0.5">POINTS</span>
                </div>

                {/* Stats Grid: Round Pts & Rank */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-950/50 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">
                      Round Pts
                    </span>
                    <span className={`text-base font-mono font-black ${roundPointsEarned > 0 ? "text-green-400" : "text-gray-400"}`}>
                      +{roundPointsEarned}
                    </span>
                  </div>
                  <div className="bg-gray-950/50 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-0.5">
                      Leaderboard
                    </span>
                    <span className="text-base font-mono font-black text-yellow-400">
                      #{playerRank}
                    </span>
                  </div>
                </div>

                {/* Realtime Status Banner */}
                {isRoundEnded ? (
                  roundPointsEarned > 0 ? (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-300 py-2.5 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 animate-pulse">
                      <CheckCircle size={16} className="text-green-400 shrink-0" />
                      <span>+100 PTS AWARDED!</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/25 text-yellow-300/90 py-2.5 px-3 rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span>Host selecting players...</span>
                    </div>
                  )
                ) : (
                  <div className="bg-gray-800/50 border border-gray-700/60 text-gray-300 py-2.5 px-3 rounded-xl text-xs text-center flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                    <span>Guess in progress...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* GUESS THE LOGO LAYOUT (UNTOUCHED & PRESERVED)            */}
        {/* ======================================================== */}
        {!isMemeGame && game.status === "QUESTION_ACTIVE" && currentQ && !isRoundEnded && (
          <div className="w-full flex-1 flex flex-col items-center justify-between py-1 overflow-hidden">
            {/* Header Stage */}
            <div className="text-center shrink-0">
              <p className="text-gray-400 font-bold tracking-widest text-[11px] uppercase">
                QUESTION {game.current_question} / {questions.length}
              </p>
              <div className={`text-5xl md:text-6xl font-black font-mono tracking-tight leading-none my-1 ${timeUrgency}`}>
                {secondsDisplay}
              </div>
            </div>

            {/* Visual Clue Stage */}
            <div className="w-full flex items-center justify-center my-auto py-1">
              <LogoReveal
                imageUrl={currentQ.image_url}
                altText="Logo to guess"
                timeLeft={timeLeft}
                timeLimit={timeLimit}
                isRevealed={hasSubmittedCorrect}
                className="w-full max-w-[min(76vw,280px)] h-[min(30vh,210px)] mx-auto shadow-xl"
              />
            </div>

            {/* Bottom Section */}
            <div className="w-full shrink-0 pt-1">
              {hasSubmittedCorrect ? (
                <div className="bg-green-500/15 border-2 border-green-500 rounded-xl p-3 text-center shadow-lg shadow-green-500/15">
                  <div className="flex items-center justify-center gap-1.5 text-green-400 font-black text-lg">
                    <CheckCircle size={20} />
                    <span>✓ CORRECT!</span>
                  </div>
                  <div className="text-white font-bold text-sm mt-0.5">
                    +{submissionResult?.points || 100} points
                    {submissionResult?.responseTime ? ` • ${submissionResult.responseTime}s` : ""}
                  </div>
                  <p className="text-[11px] text-green-300/80 mt-1">
                    Waiting for round to finish...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-1.5">
                  {wrongFeedback && (
                    <div className="bg-red-500/20 border border-red-500/60 text-red-300 text-xs font-bold py-1 px-3 rounded-lg text-center flex items-center justify-center gap-1">
                      <XCircle size={14} className="text-red-400" />
                      <span>{wrongFeedback}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1 text-center">
                      Type your answer
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSubmit();
                        }
                      }}
                      placeholder="Type brand name..."
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={submitting}
                      className="w-full bg-gray-900 border-2 border-gray-700 focus:border-brand rounded-xl px-4 py-2.5 text-base md:text-lg text-center text-white focus:outline-none transition-all font-bold placeholder-gray-600 shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !answerInput.trim()}
                    className="w-full bg-brand hover:bg-brand-hover text-white font-bold text-base py-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-brand/25 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>CHECKING...</span>
                      </>
                    ) : (
                      <span>GUESS</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* GUESS THE LOGO: TIME'S UP / REVEAL SCREEN */}
        {!isMemeGame && isRoundEnded && currentQ && (
          <div className="w-full flex-1 flex flex-col items-center justify-between py-2 text-center overflow-hidden">
            {/* Title */}
            <div className="shrink-0">
              <h2 className="text-3xl font-black text-red-500 font-outfit tracking-tight leading-none">
                TIME'S UP!
              </h2>
              <div className="bg-brand text-white text-xl sm:text-2xl font-black py-1.5 px-4 rounded-xl mt-1.5 font-outfit shadow-md shadow-brand/30">
                {currentQ.correct_answer}
              </div>
            </div>

            {/* Revealed Media */}
            <div className="my-auto py-1 w-full flex items-center justify-center">
              <LogoReveal
                imageUrl={currentQ.image_url}
                altText={currentQ.correct_answer}
                isRevealed={true}
                className="w-[min(60vw,200px)] h-[min(24vh,160px)] mx-auto shadow-xl"
              />
            </div>

            {/* Player's Round Result Breakdown */}
            <div className="w-full space-y-1.5 shrink-0">
              <div className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl p-2.5 space-y-1 text-xs">
                <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                  <span className="uppercase font-bold text-gray-400">THIS ROUND</span>
                  <span className={`text-base font-mono font-black ${roundPointsEarned > 0 ? "text-green-400" : "text-gray-500"}`}>
                    +{roundPointsEarned}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                  <span className="uppercase font-bold text-gray-400">TOTAL SCORE</span>
                  <span className="text-base font-mono font-black text-white">{totalScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="uppercase font-bold text-gray-400">CURRENT RANK</span>
                  <span className="text-base font-mono font-black text-yellow-400">#{playerRank}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 animate-pulse">
                Waiting for host to start next round...
              </p>
            </div>
          </div>
        )}

        {/* FINISHED GAME OVER STATE */}
        {game.status === "FINISHED" && (
          <div className="my-auto text-center w-full space-y-4 max-w-sm mx-auto">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 font-outfit">
              GAME OVER
            </h2>
            <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 max-w-xs mx-auto">
              <Trophy size={48} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">WINNER</p>
              <p className="text-2xl font-black text-white mt-1">{players[0]?.name || "None"}</p>
              <p className="text-lg font-mono text-brand mt-1">{players[0]?.score || 0} pts</p>
            </div>
            <div className="text-xs text-gray-400">
              Your final score: <strong className="text-white">{totalScore} pts</strong> (Rank #{playerRank})
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
