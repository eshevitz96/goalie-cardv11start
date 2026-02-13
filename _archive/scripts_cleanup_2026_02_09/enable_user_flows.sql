-- ENABLE FULL USER FLOWS
-- This script fills in the missing "Read" (SELECT) permissions that were preventing
-- features from working fully (e.g. Journal History not loading).

-- ==========================================
-- 1. TRAINING JOURNAL (Reflections)
-- ==========================================
-- Problem: We allowed INSERT/UPDATE, but forgot to allow users to VIEW their own entries.
-- Fix: Add SELECT policy for Owners and Coaches.

DROP POLICY IF EXISTS "Users View Own Reflections" ON public.reflections;
CREATE POLICY "Users View Own Reflections" ON public.reflections
FOR SELECT TO authenticated
USING (
  -- User is the author
  auth.uid() = author_id 
  OR 
  -- User is a Coach or Admin (View All for now to ensure feedback loops work)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('coach', 'admin')
  )
);


-- ==========================================
-- 2. EVENTS & REGISTRATIONS
-- ==========================================
-- Problem: Users need to register for events. Use strict RLS.

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Policy: View Own Registrations
DROP POLICY IF EXISTS "Users View Own Registrations" ON public.registrations;
CREATE POLICY "Users View Own Registrations" ON public.registrations
FOR SELECT TO authenticated
USING (
  goalie_id = auth.uid()
);

-- Policy: Register (Insert Own)
DROP POLICY IF EXISTS "Users Can Register" ON public.registrations;
CREATE POLICY "Users Can Register" ON public.registrations
FOR INSERT TO authenticated
WITH CHECK (
  goalie_id = auth.uid()
);

-- Ensure Events are public read
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public View Events" ON public.events;
CREATE POLICY "Public View Events" ON public.events
FOR SELECT TO authenticated
USING (true);


-- ==========================================
-- 3. HIGHLIGHTS (Coach Review)
-- ==========================================
-- Ensure Goalies can see what they uploaded (previously only Insert was checked)

DROP POLICY IF EXISTS "Users View Own Highlights" ON public.highlights;
CREATE POLICY "Users View Own Highlights" ON public.highlights
FOR SELECT TO authenticated
USING (
  true -- Currently allowing public read for highlights so coaches/scouts can see them easily
  -- If you want strict privacy: goalie_id = auth.uid() OR exists(coach)
);
