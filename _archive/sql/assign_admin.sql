-- GRANT ADMIN PRIVILEGES
-- Run this in the Supabase SQL Editor to make a specific user an Admin.

-- 1. Replace 'YOUR_EMAIL_HERE' with the email you use to log in.
DO $$
DECLARE
    target_email text := 'thegoaliebrand@gmail.com'; -- <--- ENTER YOUR EMAIL HERE
    target_user_id uuid;
BEGIN
    -- Find the user in auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users. Please sign up/log in first.', target_email;
    END IF;

    -- Ensure a profile exists (Upsert)
    INSERT INTO public.profiles (id, email, role)
    VALUES (target_user_id, target_email, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        email = EXCLUDED.email; -- Update email just in case

    RAISE NOTICE 'SUCCESS: User % is now an Admin.', target_email;
END $$;

-- 2. Verify the change
SELECT * FROM public.profiles WHERE role = 'admin';
