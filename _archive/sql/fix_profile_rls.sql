-- Enable RLS
ALTER TABLE roster_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own roster" ON roster_uploads;
DROP POLICY IF EXISTS "Users can update own roster" ON roster_uploads;

-- Policy for displaying the roster
CREATE POLICY "Users can view own roster" 
ON roster_uploads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    email = auth.email()
  )
);

-- Policy for updating the roster
CREATE POLICY "Users can update own roster" 
ON roster_uploads 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    email = auth.email()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    email = auth.email()
  )
);

-- Note: This assumes the user is logged in via Supabase Auth and their email matches the roster email.
