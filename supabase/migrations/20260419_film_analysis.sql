-- ============================================================
-- Film Analysis Tables — V11 GoalieCard
-- Playlist-style film analysis: reports → clips → shots
-- ============================================================

-- 1. game_reports: top-level session container
CREATE TABLE IF NOT EXISTS public.game_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT '',
  date        date NOT NULL DEFAULT CURRENT_DATE,
  sport       text NOT NULL DEFAULT 'Hockey',
  season      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_reports: user owns their data"
  ON public.game_reports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. film_clips: each video file in a session
CREATE TABLE IF NOT EXISTS public.film_clips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES public.game_reports(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  url         text,       -- Supabase Storage public URL (null while uploading)
  size        bigint,     -- bytes
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.film_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "film_clips: user owns their data"
  ON public.film_clips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. film_shots: individual shot events within a clip
CREATE TABLE IF NOT EXISTS public.film_shots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    uuid NOT NULL REFERENCES public.game_reports(id) ON DELETE CASCADE,
  clip_id      uuid NOT NULL REFERENCES public.film_clips(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period       text NOT NULL DEFAULT '1st',
  shot_type    text NOT NULL DEFAULT 'Wrist',
  is_deflected boolean NOT NULL DEFAULT false,
  is_save      boolean NOT NULL DEFAULT true,
  -- Rink (origin) location: 0.0 – 1.0 relative coordinates
  rink_x       numeric(5,4),
  rink_y       numeric(5,4),
  -- Net (target) location: 0.0 – 1.0 relative coordinates
  net_x        numeric(5,4),
  net_y        numeric(5,4),
  -- Timestamp in the video where this shot occurs (seconds)
  video_time   numeric(10,3),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.film_shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "film_shots: user owns their data"
  ON public.film_shots
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS film_clips_report_id_idx   ON public.film_clips(report_id);
CREATE INDEX IF NOT EXISTS film_shots_report_id_idx   ON public.film_shots(report_id);
CREATE INDEX IF NOT EXISTS film_shots_clip_id_idx     ON public.film_shots(clip_id);
CREATE INDEX IF NOT EXISTS game_reports_user_id_idx   ON public.game_reports(user_id);

-- ── Storage Bucket (run once in Supabase dashboard or here) ────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('game-film', 'game-film', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "game-film: authenticated upload"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'game-film' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "game-film: public read"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'game-film');
