
-- 1. Add missing 'sport' column
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS sport text DEFAULT 'Hockey';

-- 2. Add 'birthday' column for manual entry
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS birthday text;

-- 3. Add explicit Guardian/Athlete Contact Info
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS guardian_email text;
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS athlete_email text;
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS athlete_phone text;

-- 4. Allow public inserts for Activation "Create New" flow
DROP POLICY IF EXISTS "Enable insert for all users" ON roster_uploads;
CREATE POLICY "Enable insert for all users" ON roster_uploads FOR INSERT WITH CHECK (true);

-- 5. Ensure 'roster_uploads' is accessible
ALTER TABLE roster_uploads ENABLE ROW LEVEL SECURITY;
