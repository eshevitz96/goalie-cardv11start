-- Fix for Admin Dashboard not showing all feedback and surveys due to RLS
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing admin policy if we are re-running
DROP POLICY IF EXISTS "Admins can view all reflections v2" ON public.reflections;
DROP POLICY IF EXISTS "Admins can view all reflections" ON public.reflections;

-- 3. Create Policy to allow Admins to view all reflections
CREATE POLICY "Admins can view all reflections v2" ON public.reflections
FOR SELECT
TO authenticated
USING (
  -- Explicitly allow these specific admin emails
  (auth.jwt() ->> 'email' IN ('thegoaliebrand@gmail.com', 'eshevitz96@gmail.com'))
  OR
  -- Also allow anyone explicitly marked with the admin role in the DB
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
