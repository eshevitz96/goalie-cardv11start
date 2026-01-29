-- FIX ROSTER UPLOAD PERMISSIONS

-- 1. Ensure the current user is an admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'thegoaliebrand@gmail.com';

-- 2. Reset RLS on roster_uploads
ALTER TABLE roster_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage roster" ON roster_uploads;
DROP POLICY IF EXISTS "Enable read access for all users" ON roster_uploads;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON roster_uploads;

-- Allow everything for admins
CREATE POLICY "Admins can manage roster"
ON roster_uploads
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow reading for everyone (optional, restrict if needed)
CREATE POLICY "Anyone can read roster"
ON roster_uploads
FOR SELECT
USING (true);


-- 3. Reset RLS on sessions (Prevent likely next error)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage sessions" ON sessions;

CREATE POLICY "Admins can manage sessions"
ON sessions
FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow reading sessions for owner or admin (simplified for now to just public read or owner read)
CREATE POLICY "Read sessions"
ON sessions
FOR SELECT
USING (true);
