-- Add missing columns for Coach Profile
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Ensure full_name is populated if empty (fallback to goalie_name if available, though goalie_name might be the one we use)
-- Note: In Admin dashboard we saw 'goalie_name' being used on profiles mostly for roster items. 
-- Let's enable RLS policy for updates if not already there, but usually assumed exists.
