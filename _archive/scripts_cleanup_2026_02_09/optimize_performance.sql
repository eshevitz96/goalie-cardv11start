-- OPTIMIZE PERFORMANCE (Add Missing Indexes)
-- This script addresses "Slow Queries" by adding indexes to columns used in 
-- Filtering (WHERE), Sorting (ORDER BY), and RLS Policies.

-- ==========================================
-- 1. ROSTER UPLOADS (Critical for Login/Activation)
-- ==========================================
-- Used heavily for lookups by email and ID
CREATE INDEX IF NOT EXISTS idx_roster_email ON public.roster_uploads(email);
CREATE INDEX IF NOT EXISTS idx_roster_unique_id ON public.roster_uploads(assigned_unique_id);
-- Used for sorting/filtering by team or coach
CREATE INDEX IF NOT EXISTS idx_roster_assigned_coach ON public.roster_uploads(assigned_coach_id);

-- ==========================================
-- 2. SESSIONS (Critical for Dashboard)
-- ==========================================
-- Used for RLS (auth.uid() = goalie_id)
CREATE INDEX IF NOT EXISTS idx_sessions_goalie_id ON public.sessions(goalie_id);
-- Used for sorting history
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date DESC);

-- ==========================================
-- 3. REFLECTIONS (Journal)
-- ==========================================
-- Used for pre-fetching journal by roster
CREATE INDEX IF NOT EXISTS idx_reflections_roster_id ON public.reflections(roster_id);
-- Used for RLS (auth.uid() = author_id)
CREATE INDEX IF NOT EXISTS idx_reflections_author_id ON public.reflections(author_id);
-- Used for sorting timeline
CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON public.reflections(created_at DESC);

-- ==========================================
-- 4. HIGHLIGHTS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_highlights_roster_id ON public.highlights(roster_id);
CREATE INDEX IF NOT EXISTS idx_highlights_goalie_id ON public.highlights(goalie_id);

-- ==========================================
-- 5. EVENTS & REGISTRATIONS
-- ==========================================
-- Used for "My Events" lookup
CREATE INDEX IF NOT EXISTS idx_registrations_goalie_id ON public.registrations(goalie_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
-- Used for "Upcoming Events" list
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date ASC);

-- ==========================================
-- VERIFICATION VIEW
-- ==========================================
-- Run this to see your new indexes:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
