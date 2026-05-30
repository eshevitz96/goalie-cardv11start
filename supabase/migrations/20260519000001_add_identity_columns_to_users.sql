-- 1. Add new columns to public.users
ALTER TABLE public.users
ADD COLUMN username text,
ADD COLUMN username_changed_at timestamp with time zone,
ADD COLUMN is_over_18 boolean DEFAULT false,
ADD COLUMN consent_agreed boolean DEFAULT false,
ADD COLUMN consent_agreed_at timestamp with time zone,
ADD COLUMN parent_email text,
ADD COLUMN parent_phone text,
ADD COLUMN onboarding_completed boolean DEFAULT false NOT NULL,
ADD COLUMN onboarding_completed_at timestamp with time zone;

-- 2. Add constraints
-- Check constraint for username regex
ALTER TABLE public.users
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-z0-9_]{3,20}$');

-- Partial unique index for lowercase usernames
CREATE UNIQUE INDEX users_username_lower_idx 
ON public.users (lower(username)) 
WHERE username IS NOT NULL;

-- 3. Trigger for username_changed_at
-- Create the trigger function
CREATE OR REPLACE FUNCTION public.update_username_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    NEW.username_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to public.users
CREATE TRIGGER trigger_update_username_changed_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_username_changed_at();

-- 4. Create public.reserved_usernames table
CREATE TABLE public.reserved_usernames (
  username text PRIMARY KEY
);

-- Enable RLS and add read-only policy for reserved_usernames
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for reserved_usernames" 
ON public.reserved_usernames FOR SELECT 
USING (true);

-- Populate reserved_usernames
INSERT INTO public.reserved_usernames (username) VALUES 
('admin'), ('support'), ('help'), ('root'), ('goaliecard'), 
('goalie_card'), ('gc'), ('vein'), ('veinos'), ('vein_os'), 
('elliott'), ('elliottm'), ('ciconcrete'), ('cic'), ('official'), 
('team'), ('staff'), ('mod'), ('moderator');
