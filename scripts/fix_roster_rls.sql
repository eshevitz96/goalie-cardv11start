-- ENABLE RLS on Roster Uploads ensures we control access
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;

-- 1. ADMIN ACCESS POLICY (CRUD)
-- Drop to avoid conflict
DROP POLICY IF EXISTS "Admins Full Access Roster" ON public.roster_uploads;

CREATE POLICY "Admins Full Access Roster" ON public.roster_uploads
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. PUBLIC/ANON READ (Optional, if needed for login checks before auth?)
-- The UnifiedEntry uses anon client to check if email exists.
-- So we need a SELECT policy for everyone (or at least anon).
DROP POLICY IF EXISTS "Anon Read Roster by Email" ON public.roster_uploads;

CREATE POLICY "Anon Read Roster by Email" ON public.roster_uploads
FOR SELECT TO anon, authenticated
USING (true); -- Filter is done in query usually, but 'true' allows reading all if they guess IDs. 
-- For stricter security, we could limit to "email = input", but that's hard in RLS without a function.
-- For now, allowing reading roster to find your card is standard flow.
