-- 1. Drop existing policies on roster_uploads
DROP POLICY IF EXISTS "Users can update own roster" ON public.roster_uploads;
DROP POLICY IF EXISTS "Users can view own roster" ON public.roster_uploads;
DROP POLICY IF EXISTS "Allow public update of roster" ON public.roster_uploads;
DROP POLICY IF EXISTS "Enable select for owners and admins" ON public.roster_uploads;
DROP POLICY IF EXISTS "Enable update for owners" ON public.roster_uploads;

-- 2. CREATE SELECT POLICY
-- Allows users to see their own row (linked or email match) and admins to see all.
CREATE POLICY "Enable select for owners and admins" ON public.roster_uploads
FOR SELECT TO authenticated
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
  OR
  linked_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- 3. CREATE UPDATE POLICY
-- Allows users to update their own row (linked or email match).
CREATE POLICY "Enable update for owners" ON public.roster_uploads
FOR UPDATE TO authenticated
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
  OR
  linked_user_id = auth.uid()
)
WITH CHECK (
  lower(email) = lower(auth.jwt() ->> 'email')
  OR
  linked_user_id = auth.uid()
);

-- 4. Ensure INSERT is still allowed for activation flow
DROP POLICY IF EXISTS "Enable insert for all users" ON public.roster_uploads;
CREATE POLICY "Enable insert for all users" ON public.roster_uploads 
FOR INSERT TO authenticated, anon 
WITH CHECK (true);
