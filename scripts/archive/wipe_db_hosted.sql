
-- ⚠️ WARNING: THIS WILL DELETE ALL DATA IN ROSTER AND SESSIONS ⚠️

-- 1. Wipe Tables
TRUNCATE TABLE public.roster_uploads, public.sessions RESTART IDENTITY CASCADE;

-- 2. Confirm Empty
SELECT count(*) as roster_count FROM roster_uploads;
