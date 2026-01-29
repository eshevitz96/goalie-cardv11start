-- Make a user an Admin (Run this in Supabase SQL Editor)
-- Replace the email below with your login email

update public.profiles
set role = 'admin'
where email = 'elliott@goaliecard.com'; -- CHANGE THIS TO YOUR LOGIN EMAIL

-- Verify the change
select id, email, role from public.profiles where email = 'elliott@goaliecard.com';
