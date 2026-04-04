-- Enable Read Access for Public Profile Fields
-- This allows any authenticated user (like a Goalie) to view the Name/Bio/Philosophy of a Coach.

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated 
USING ( true ); 
-- or more restrictive: USING ( role = 'coach' OR id = auth.uid() );
-- simpler: just let profiles be public if we want 'social' discovery.

-- If policy exists, this might fail, so we can wrap it or just use the dashboard.
-- Better approach: Drop and Recreate to be sure.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated 
USING ( true );
