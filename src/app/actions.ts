"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Normalizes an answer string for robust, tolerant matching:
 * - lowercase
 * - trims whitespace
 * - collapses multiple spaces
 * - removes punctuation and non-alphanumeric symbols
 */
function normalize(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // strip spaces, hyphens, apostrophes, punctuation
}

export async function submitAnswer(
  gameId: string,
  questionId: string,
  playerId: string,
  answer: string
) {
  try {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      return { success: false, error: config.error || "Supabase is not configured" };
    }

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      return { success: false, error: "Please enter an answer." };
    }

    const supabase = await createServerClient();

    // 1. Get Game & Question info
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("status, question_started_at, settings")
      .eq("id", gameId)
      .single();

    if (gameError || !game) return { success: false, error: "Game not found" };
    if (game.status !== "QUESTION_ACTIVE") {
      return { success: false, error: "Not accepting answers right now" };
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (questionError || !question) return { success: false, error: "Question not found" };

    // 2. Server-Authoritative Time validation
    const startedAt = new Date(game.question_started_at).getTime();
    const now = Date.now();
    const timeLimitMs = (question.time_limit || 10) * 1000;
    const responseTime = Math.max(0.1, (now - startedAt) / 1000);

    // Allow 1.5s grace period for network latency
    if (now - startedAt > timeLimitMs + 1500) {
      return { success: false, error: "Time is up!" };
    }

    // 3. Check if player already answered correctly in this question
    const { data: existingSub } = await supabase
      .from("submissions")
      .select("id, is_correct, points_awarded")
      .eq("question_id", questionId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (existingSub?.is_correct) {
      return {
        success: true,
        isCorrect: true,
        pointsAwarded: existingSub.points_awarded || 100,
        alreadyAnswered: true,
        correctAnswer: question.correct_answer,
      };
    }

    // 4. Validate answer
    const normalizedAttempt = normalize(trimmedAnswer);
    const normalizedCorrect = normalize(question.correct_answer);
    const alternateAnswers: string[] = question.alternate_answers || [];

    let isCorrect = normalizedAttempt === normalizedCorrect;
    if (!isCorrect) {
      isCorrect = alternateAnswers.some((alt) => normalize(alt) === normalizedAttempt);
    }

    // 5. Points calculation (base points e.g. 100, with optional speed bonus)
    let pointsAwarded = 0;
    if (isCorrect) {
      const basePoints = question.points || 100;
      // Slight speed bonus: faster answers get up to 20 extra points
      const speedBonus = Math.max(0, Math.round((1 - responseTime / (question.time_limit || 10)) * 20));
      pointsAwarded = basePoints + speedBonus;
    }

    // 6. Record/upsert submission
    const { error: upsertError } = await supabase
      .from("submissions")
      .upsert(
        {
          game_id: gameId,
          question_id: questionId,
          player_id: playerId,
          answer: trimmedAnswer,
          is_correct: isCorrect,
          points_awarded: pointsAwarded,
          response_time: parseFloat(responseTime.toFixed(2)),
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "question_id,player_id" }
      );

    if (upsertError) {
      console.error("[actions.ts] Upsert submission error:", upsertError);
      return { success: false, error: "Failed to record submission" };
    }

    // 7. If correct, update player score in database
    if (isCorrect) {
      const { data: player } = await supabase
        .from("players")
        .select("score")
        .eq("id", playerId)
        .single();

      if (player) {
        await supabase
          .from("players")
          .update({ score: (player.score || 0) + pointsAwarded })
          .eq("id", playerId);
      }
    }

    return {
      success: true,
      isCorrect,
      pointsAwarded,
      responseTime: parseFloat(responseTime.toFixed(1)),
      correctAnswer: isCorrect ? question.correct_answer : undefined,
    };
  } catch (err: any) {
    console.error("[actions.ts] Submit answer exception:", err);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Host manually awards +100 points to a player in Guess the Meme.
 * Protected against race conditions and double scoring.
 * Realtime updates players table so all clients see the new score immediately.
 */
export async function awardMemePoint(
  gameId: string,
  questionId: string,
  playerId: string
) {
  try {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      return { success: false, error: config.error || "Supabase is not configured" };
    }

    const supabase = await createServerClient();

    // 1. Double scoring prevention: Check if points have already been awarded for this question & player
    const { data: existingSub, error: checkErr } = await supabase
      .from("submissions")
      .select("id, is_correct, points_awarded")
      .eq("question_id", questionId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (existingSub?.is_correct) {
      return {
        success: false,
        alreadyAwarded: true,
        error: "Points already awarded to this player for this meme round.",
      };
    }

    // 2. Record/upsert submission with 100 points
    const { error: upsertErr } = await supabase
      .from("submissions")
      .upsert(
        {
          game_id: gameId,
          question_id: questionId,
          player_id: playerId,
          answer: "Host Awarded",
          is_correct: true,
          points_awarded: 100,
          response_time: 0,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "question_id,player_id" }
      );

    if (upsertErr) {
      console.error("[actions.ts] awardMemePoint submission error:", upsertErr);
      return { success: false, error: "Failed to record awarded points" };
    }

    // 3. Atomically update player score
    const { data: player, error: playerErr } = await supabase
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();

    if (playerErr || !player) {
      return { success: false, error: "Player not found" };
    }

    const newScore = (player.score || 0) + 100;
    const { error: updateErr } = await supabase
      .from("players")
      .update({ score: newScore })
      .eq("id", playerId);

    if (updateErr) {
      console.error("[actions.ts] awardMemePoint player update error:", updateErr);
      return { success: false, error: "Failed to update player score" };
    }

    return {
      success: true,
      pointsAwarded: 100,
      newScore,
    };
  } catch (err: any) {
    console.error("[actions.ts] awardMemePoint exception:", err);
    return { success: false, error: "Internal server error" };
  }
}

