-- ====================================================================
-- GUESS THE LOGO: SUPABASE DATABASE SCHEMA & REALTIME CONFIGURATION
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Games Table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_pin VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    host_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'LOBBY',
    current_question INT DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    question_started_at TIMESTAMPTZ
);

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    connected BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, name)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    order_number INT NOT NULL,
    image_url TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    alternate_answers JSONB DEFAULT '[]'::jsonb,
    points INT DEFAULT 100,
    time_limit INT DEFAULT 10,
    UNIQUE(game_id, order_number)
);

-- Rounds Table
CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_id, round_number)
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN DEFAULT false,
    points_awarded INT DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    response_time FLOAT,
    UNIQUE(question_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_game_pin ON games(game_pin);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_players_game_id_score ON players(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_game_id ON questions(game_id);
CREATE INDEX IF NOT EXISTS idx_questions_game_order ON questions(game_id, order_number);
CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_submissions_game_id ON submissions(game_id);
CREATE INDEX IF NOT EXISTS idx_submissions_question_id ON submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_submissions_player_id ON submissions(player_id);

-- Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read games" ON games;
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert games" ON games;
CREATE POLICY "Public insert games" ON games FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update games" ON games;
CREATE POLICY "Public update games" ON games FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete games" ON games;
CREATE POLICY "Public delete games" ON games FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read players" ON players;
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert players" ON players;
CREATE POLICY "Public insert players" ON players FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update players" ON players;
CREATE POLICY "Public update players" ON players FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete players" ON players;
CREATE POLICY "Public delete players" ON players FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read questions" ON questions;
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert questions" ON questions;
CREATE POLICY "Public insert questions" ON questions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update questions" ON questions;
CREATE POLICY "Public update questions" ON questions FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete questions" ON questions;
CREATE POLICY "Public delete questions" ON questions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read rounds" ON rounds;
CREATE POLICY "Public read rounds" ON rounds FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert rounds" ON rounds;
CREATE POLICY "Public insert rounds" ON rounds FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update rounds" ON rounds;
CREATE POLICY "Public update rounds" ON rounds FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete rounds" ON rounds;
CREATE POLICY "Public delete rounds" ON rounds FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read submissions" ON submissions;
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert submissions" ON submissions;
CREATE POLICY "Public insert submissions" ON submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update submissions" ON submissions;
CREATE POLICY "Public update submissions" ON submissions FOR UPDATE USING (true) WITH CHECK (true);

-- Realtime Configuration
ALTER TABLE games REPLICA IDENTITY FULL;
ALTER TABLE players REPLICA IDENTITY FULL;
ALTER TABLE questions REPLICA IDENTITY FULL;
ALTER TABLE rounds REPLICA IDENTITY FULL;
ALTER TABLE submissions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'games'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE games;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE questions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rounds'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  END IF;
END $$;
