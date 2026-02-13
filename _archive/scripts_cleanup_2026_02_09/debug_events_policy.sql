-- DEBUG EVENTS RLS
-- Run this to see why inserts might be consistently failing.

-- 1. Check Table Structure (Does 'created_by' exist?)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events';

-- 2. Check Active Policies
SELECT polname, polcmd, polroles, polqual, polwithcheck 
FROM pg_policy 
WHERE polrelid = 'public.events'::regclass;

-- 3. TEST: Simulate a User Insert
-- We will try to create a policy-compliant row.
DO $$
DECLARE
  test_user_id uuid := auth.uid(); -- This will be NULL if run as admin/postgres, so we simulate
BEGIN
  -- We can't easily simulate auth.uid() in a raw script block without set_config
  -- But we can check if the policy exists.
  
  -- If we are running this in SQL Editor, we are 'postgres' or 'admin', giving us bypass RLS usually.
  -- Key check: Does the policy "Users can create personal events" exist in the output above?
END $$;
