
-- Migration: Allow duplicate emails in roster_uploads to support Multiple Cards per Parent
-- This enables "Elliott Shevitz (PLL)" and "Elliott Shevitz (NHL)" to share 'thegoaliebrand@gmail.com'

-- 1. Drop the Unique Constraint on Email
ALTER TABLE public.roster_uploads 
DROP CONSTRAINT IF EXISTS roster_uploads_email_key;

-- 2. Drop any unique index on email if it exists explicitly
DROP INDEX IF EXISTS idx_roster_email_unique;
DROP INDEX IF EXISTS roster_uploads_email_idx;

-- 3. Ensure 'assigned_unique_id' is Unique (Critical for disambiguation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'roster_uploads_unique_id_key'
    ) THEN
        ALTER TABLE public.roster_uploads 
        ADD CONSTRAINT roster_uploads_unique_id_key UNIQUE (assigned_unique_id);
    END IF;
END $$;
