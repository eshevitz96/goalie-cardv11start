-- SECURITY PATCH: Harden RLS Policies & Function Search Paths

-- 1. Fix Function Search Paths
ALTER FUNCTION public.get_goalie_balance(uuid) SET search_path = public;
ALTER FUNCTION public.update_roster_session_counts(uuid) SET search_path = public;

-- 2. Harden RLS Policies

-- A. ROSTER UPLOADS
-- Restrict INSERTs to Service Role (Server Actions) or explicit Admin users.
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON public.roster_uploads;
CREATE POLICY "Allow authenticated users to upload" ON public.roster_uploads
FOR INSERT TO authenticated
WITH CHECK (
  auth.role() = 'service_role' OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- B. REFLECTIONS
-- Restrict INSERTs to users inserting their own data.
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.reflections;
CREATE POLICY "Allow authenticated insert" ON public.reflections
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
);

-- C. HIGHLIGHTS
-- Restrict INSERTs to users inserting their own highlights (via Roster ownership).
DROP POLICY IF EXISTS "Users can insert own highlights" ON public.highlights;
CREATE POLICY "Users can insert own highlights" ON public.highlights
FOR INSERT TO authenticated
WITH CHECK (
  -- Ensure the roster_id being inserted belongs to the current user
  auth.uid() IN (
    SELECT linked_user_id 
    FROM public.roster_uploads 
    WHERE id = roster_id
  )
);
