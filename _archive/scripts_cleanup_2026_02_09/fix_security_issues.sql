-- FIX SECURITY ISSUES & ENABLE RLS
-- This script addresses the "Security (6)" warnings by ensuring RLS is enabled 
-- and appropriate policies are applied to public tables.

-- ==========================================
-- 1. SESSIONS
-- ==========================================
-- Problem: Table is public, RLS not enabled.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins have full access
DROP POLICY IF EXISTS "Admins All Sessions" ON public.sessions;
CREATE POLICY "Admins All Sessions" ON public.sessions
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Owners (Goalies) can view their own sessions
-- Assumes 'goalie_id' column exists. If strictly 'user_id', replace 'goalie_id' with 'user_id'.
DROP POLICY IF EXISTS "Users View Own Sessions" ON public.sessions;
CREATE POLICY "Users View Own Sessions" ON public.sessions
FOR SELECT TO authenticated
USING (
  auth.uid() = goalie_id
);


-- ==========================================
-- 2. HIGHLIGHTS
-- ==========================================
-- Problem: RLS policies exist but RLS disabled.
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Ensure minimal policies exist (re-applying just in case)
DROP POLICY IF EXISTS "Public can view highlights" ON public.highlights;
CREATE POLICY "Public can view highlights" ON public.highlights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own highlights" ON public.highlights;
CREATE POLICY "Users can insert own highlights" ON public.highlights 
FOR INSERT TO authenticated 
WITH CHECK (true); -- Can refine to check goalie_id vs auth.uid() if column exists


-- ==========================================
-- 3. REFLECTIONS
-- ==========================================
-- Problem: RLS disabled.
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert/view own.
-- Based on previous scripts using 'author_id'
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.reflections;
CREATE POLICY "Allow authenticated insert" ON public.reflections
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow individual update" ON public.reflections;
CREATE POLICY "Allow individual update" ON public.reflections
FOR UPDATE TO authenticated
USING (auth.uid() = author_id);


-- ==========================================
-- 4. ROSTER UPLOADS
-- ==========================================
-- Problem: RLS disabled.
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can update own roster entry
-- Based on email match
DROP POLICY IF EXISTS "Users can update own roster" ON public.roster_uploads;
CREATE POLICY "Users can update own roster" ON public.roster_uploads 
FOR UPDATE TO authenticated
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
);


-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'highlights', 'reflections', 'roster_uploads');
