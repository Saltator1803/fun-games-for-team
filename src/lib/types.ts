export type GameType = "logo" | "meme" | "trivia" | "song";

export interface GameSettings {
  numQuestions?: number;
  timeLimit?: number;
  points?: number;
  category?: string;
  difficulty?: "easy" | "medium" | "hard" | "all";
  multipleAttempts?: boolean;
  caseInsensitive?: boolean;
  ignoreSpaces?: boolean;
  acceptAlternate?: boolean;
  showLeaderboard?: boolean;
  showAnswer?: boolean;
  randomize?: boolean;
  [key: string]: any;
}

export interface Game {
  id: string;
  game_pin: string;
  name: string;
  game_type: GameType;
  host_id: string;
  status: "LOBBY" | "QUESTION_ACTIVE" | "QUESTION_PAUSED" | "ANSWER_REVEAL" | "LEADERBOARD" | "FINISHED";
  current_question: number;
  settings: GameSettings;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  question_started_at?: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  score: number;
  connected: boolean;
  joined_at: string;
  last_seen: string;
}

export interface Question {
  id: string;
  game_id: string;
  order_number: number;
  image_url: string;
  video_url?: string | null;
  category?: string | null;
  difficulty?: string | null;
  correct_answer: string;
  alternate_answers?: string[];
  points?: number;
  time_limit?: number;
}

export interface Submission {
  id: string;
  game_id: string;
  question_id: string;
  round_id?: string;
  player_id: string;
  answer: string;
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
  response_time?: number;
}
