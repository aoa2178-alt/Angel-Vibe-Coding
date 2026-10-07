-- Walkin' Here! app tables. Better Auth creates its own tables ("user", session,
-- account, verification) first; see scripts/migrate.mjs, which runs both.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 45 CHECK (xp >= 0),
  streak integer NOT NULL DEFAULT 4 CHECK (streak >= 0),
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
