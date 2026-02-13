-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if it exists (to avoid duplicates or conflicts if named the same)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Coaches are viewable by authenticated users" ON profiles;

-- Policy: Authenticated users can view profiles that are 'coach' OR their own profile
CREATE POLICY "Coaches are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (
  role = 'coach' OR id = auth.uid()
);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ( id = auth.uid() )
WITH CHECK ( id = auth.uid() );

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK ( id = auth.uid() );
