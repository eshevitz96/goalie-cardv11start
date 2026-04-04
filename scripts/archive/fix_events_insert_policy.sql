-- FIX EVENTS RLS FOR ADMIN INSERTS
-- Problem: Current policy requires created_by = auth.uid(), 
-- but admin uses localStorage auth, not Supabase Auth, so auth.uid() is NULL.

-- Drop existing restrictive insert policy
DROP POLICY IF EXISTS "Users can create personal events" ON public.events;

-- Create more permissive insert policy for authenticated users
-- Allow any authenticated user OR anon to insert events (for admin dashboard)
CREATE POLICY "Allow event creation" ON public.events
FOR INSERT 
WITH CHECK (true);  -- Allow all inserts (RLS still enforces read restrictions)

-- Alternative: If you want to track who created it but allow NULL:
-- CREATE POLICY "Allow event creation" ON public.events
-- FOR INSERT TO authenticated
-- WITH CHECK (created_by IS NULL OR created_by = auth.uid());
