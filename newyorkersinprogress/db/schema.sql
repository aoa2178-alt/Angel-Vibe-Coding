-- Walkin' Here! app tables. Better Auth creates its own tables ("user", session,
-- account, verification) first; see scripts/migrate.mjs, which runs both.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  lesson_id text NOT NULL CHECK (char_length(lesson_id) <= 60),
  completed boolean NOT NULL DEFAULT false,
  earned_xp integer NOT NULL DEFAULT 0 CHECK (earned_xp >= 0),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS saved_spots (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  spot_id text NOT NULL CHECK (char_length(spot_id) <= 60),
  mark text NOT NULL CHECK (mark IN ('want', 'been')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, spot_id)
);

CREATE TABLE IF NOT EXISTS daily_visits (
  visit_date date PRIMARY KEY DEFAULT current_date,
  visit_count bigint NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2026-10 "Make it yours", daily streak, daily challenge and weekly league. Additive only.
ALTER TABLE profiles ALTER COLUMN xp SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN streak SET DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prefs jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personalized boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS setup_done boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 3 AND 20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS on_board boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS week_start date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS week_xp integer NOT NULL DEFAULT 0 CHECK (week_xp >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS day_xp integer NOT NULL DEFAULT 0 CHECK (day_xp >= 0);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS challenge_date date;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower ON profiles (lower(nickname));
CREATE INDEX IF NOT EXISTS profiles_league ON profiles (week_start, week_xp DESC);
