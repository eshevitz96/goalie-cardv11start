-- Migration: Add roles column to profiles table

-- 1. Add roles column as an array of text
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';

-- 2. Backfill roles based on existing 'role' column
UPDATE profiles 
SET roles = ARRAY[role::text] 
WHERE role IS NOT NULL AND (roles IS NULL OR roles = '{}');

-- 3. Add index for faster searching if needed (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN (roles);

-- 4. Grant permissions if necessary (usually handled by default policies, but good measure)
-- GRANT ALL ON profiles TO postgres, service_role;
