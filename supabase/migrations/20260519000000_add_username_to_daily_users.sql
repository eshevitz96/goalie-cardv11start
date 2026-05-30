-- Add username to daily_users for cross-ecosystem identity
ALTER TABLE public.daily_users
ADD COLUMN username text UNIQUE;

-- Create an index to quickly look up users by username across the ecosystem
CREATE INDEX IF NOT EXISTS idx_daily_users_username ON public.daily_users(username);
