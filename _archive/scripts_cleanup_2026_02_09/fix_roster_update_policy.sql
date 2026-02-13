-- FIX ROSTER UPDATE POLICY ( Stop the Loop )
-- Problem: Strict RLS might be blocking the "Setup Complete" update.
-- Fix: Ensure the policy is case-insensitive and explicitly allows updating 'raw_data'.

-- 1. Drop the old strict policy
DROP POLICY IF EXISTS "Users can update own roster" ON public.roster_uploads;

-- 2. Create a more robust policy
CREATE POLICY "Users can update own roster" ON public.roster_uploads
FOR UPDATE TO authenticated
USING (
  -- Allow if Email matches (Case Insensitive)
  lower(email) = lower(auth.jwt() ->> 'email')
  OR
  -- OR if the ID matches the one claimed by this user (if we tracked it that way)
  -- But email is the primary link for now.
  assigned_unique_id = (select assigned_unique_id from roster_uploads where lower(email) = lower(auth.jwt() ->> 'email') limit 1)
)
WITH CHECK (
  -- Ensure they can't change the email to someone else's, 
  -- but can update other fields like height, weight, raw_data
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- 3. Safety: Grant permissions just in case (sometimes strictly revocations persist)
GRANT UPDATE ON public.roster_uploads TO authenticated;
