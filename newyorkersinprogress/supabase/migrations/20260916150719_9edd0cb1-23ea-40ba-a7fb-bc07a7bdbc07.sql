CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  preferred_city text NOT NULL DEFAULT 'nyc' CHECK (char_length(preferred_city) <= 40),
  preferred_theme text NOT NULL DEFAULT 'park' CHECK (char_length(preferred_theme) <= 40),
  xp integer NOT NULL DEFAULT 45 CHECK (xp >= 0),
  streak integer NOT NULL DEFAULT 4 CHECK (streak >= 0),
  slang_credit_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL CHECK (char_length(lesson_id) <= 60),
  completed boolean NOT NULL DEFAULT false,
  earned_xp integer NOT NULL DEFAULT 0 CHECK (earned_xp >= 0),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lesson progress" ON public.lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lesson progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own lesson progress" ON public.lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  spot_id text NOT NULL CHECK (char_length(spot_id) <= 60),
  mark text NOT NULL CHECK (mark IN ('want', 'been')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, spot_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_spots TO authenticated;
GRANT ALL ON public.saved_spots TO service_role;
ALTER TABLE public.saved_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved spots" ON public.saved_spots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saved spots" ON public.saved_spots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved spots" ON public.saved_spots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved spots" ON public.saved_spots FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.daily_visits (
  visit_date date PRIMARY KEY DEFAULT current_date,
  visit_count bigint NOT NULL DEFAULT 0 CHECK (visit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.daily_visits TO service_role;
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER lesson_progress_set_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER saved_spots_set_updated_at BEFORE UPDATE ON public.saved_spots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_daily_visit()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.daily_visits (visit_date, visit_count)
  VALUES (current_date, 1)
  ON CONFLICT (visit_date)
  DO UPDATE SET visit_count = public.daily_visits.visit_count + 1, updated_at = now();
$$;
REVOKE ALL ON FUNCTION public.increment_daily_visit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_visit() TO anon, authenticated, service_role;