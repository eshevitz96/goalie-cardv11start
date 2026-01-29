-- NUCLEAR OPTION: DISABLE RLS FOR IMPORT
-- Run this in the Supabase SQL Editor to mistakenly remove all security blocks for the import tables.

ALTER TABLE roster_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled (optional, for your own sanity check)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('roster_uploads', 'sessions');
