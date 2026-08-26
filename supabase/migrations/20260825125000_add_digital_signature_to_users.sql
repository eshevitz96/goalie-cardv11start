-- Add digital_signature to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS digital_signature TEXT;
