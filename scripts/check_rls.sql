
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'roster_uploads';
