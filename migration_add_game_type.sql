-- ====================================================================
-- MIGRATION: ADD game_type TO public.games TABLE
-- ====================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yvrmoqcyjypafmbhbaez/sql

-- 1. Add game_type column to public.games with default 'logo'
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'logo';

-- 2. Add CHECK constraint ensuring game_type is only 'logo' or 'meme'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'games_game_type_check'
  ) THEN
    ALTER TABLE public.games
    ADD CONSTRAINT games_game_type_check
    CHECK (game_type IN ('logo', 'meme'));
  END IF;
END $$;

-- 3. Also add accompanying optional columns for questions (for meme videos)
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'medium';

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
