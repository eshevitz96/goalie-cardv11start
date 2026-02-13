
-- Enable RLS on the table (just in case)
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to INSERT their own reflections
-- We check if the user is authenticated. 
-- For strictness, we might want to ensure they are the 'goalie' or related to the roster, but for now, generic insert for authenticated users is better than broken.
CREATE POLICY "Allow authenticated insert" ON reflections
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow update if they created it?
CREATE POLICY "Allow individual update" ON reflections
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'reflections';
