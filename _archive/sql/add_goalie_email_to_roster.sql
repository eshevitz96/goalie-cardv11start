-- Migration: Add Goalie Email support for Minor Access
-- Date: 2026-01-26
-- Purpose: Allow a separate 'Goalie Email' to be authorized on a Roster Upload, enabling Minors to have their own login linked to the Parent's Roster.

-- 1. Add column
ALTER TABLE public.roster_uploads
ADD COLUMN IF NOT EXISTS goalie_email text;

-- 2. Update Test Goalies

-- Gabe Stone
UPDATE public.roster_uploads
SET goalie_email = 'gabriel.c.stone@gmail.com'
WHERE assigned_unique_id = 'GC-8266';

-- Madelyn Evans
UPDATE public.roster_uploads
SET goalie_email = 'maddog2027@icloud.com'
WHERE assigned_unique_id = 'GC-8622';

-- Jake Dewey
UPDATE public.roster_uploads
SET goalie_email = 'deweyjake25@gmail.com'
WHERE assigned_unique_id = 'GC-8372';

-- Luke Grasso (Not a minor, but ensuring consistency if logic checks goalie_email)
-- Currently his primary 'email' is his goalie email.
UPDATE public.roster_uploads
SET goalie_email = 'lukegrasso09@gmail.com'
WHERE assigned_unique_id = 'GC-8588';

-- 3. Update RLS or Policy checks? 
-- The 'apply_trust_model.sql' mainly checked 'reflections' authorship.
-- We might need to update 'claim' logic in the App Code (Next.js) to check this column.
-- For now, purely database update.
