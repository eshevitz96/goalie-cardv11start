
-- 1. FIX RESET PERMISSIONS (CASCADE DELETES)
-- Roster deletion cascades to Highlights, so we need permission there too.
DROP POLICY IF EXISTS "Admins can delete roster" ON public.roster_uploads;
CREATE POLICY "Admins can delete roster" ON public.roster_uploads FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admins can manage sessions" ON public.sessions;
CREATE POLICY "Admins can manage sessions" ON public.sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage highlights" ON public.highlights;
CREATE POLICY "Admins can manage highlights" ON public.highlights FOR ALL USING (true);

-- 2. FIX BUSINESS INTEL DATA STRUCTURE
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS roster_id uuid references public.roster_uploads(id) on delete cascade;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS date timestamp with time zone;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS start_time timestamp with time zone;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS end_time timestamp with time zone;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS notes text;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_roster ON public.sessions(roster_id);
