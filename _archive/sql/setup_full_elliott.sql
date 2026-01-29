-- CLEANUP: Remove old simulation data to avoid confusion
delete from public.roster_uploads where email in ('elliott.goalie@example.com');

-- 1. ELLIOTT (High School) - The "HS Card"
-- Linked to his main email so it shows up in his dashboard.
insert into public.roster_uploads (
    email, goalie_name, parent_name, team, sport, 
    assigned_unique_id, is_claimed, grad_year, height, weight, catch_hand
)
values (
    'thegoaliebrand@gmail.com', 'Elliott Shevitz (HS)', 'David Shevitz', 'Ladue Rams', 'Hockey', 
    'GC-HS-01', true, 2026, '6-1', '190', 'Left'
)
on conflict (email, assigned_unique_id) do update set is_claimed = true;

-- 2. ELLIOTT (Pro) - The "Pro Card"
-- Also linked to his main email. This gives him the "Swipe" effect between two cards.
insert into public.roster_uploads (
    email, goalie_name, parent_name, team, sport, 
    assigned_unique_id, is_claimed, grad_year, height, weight, catch_hand
)
values (
    'thegoaliebrand@gmail.com', 'Elliott Shevitz (Pro)', 'David Shevitz', 'St. Louis Blues', 'Hockey', 
    'GC-PRO-01', true, 2024, '6-2', '205', 'Left'
)
on conflict (email, assigned_unique_id) do update set is_claimed = true;


-- 3. COACH ID / ADMIN ID Configuration
-- We ensure his Profile has the permissions.
-- Note: In this system, 'Admin' is usually a flag or a specific role. 
-- For demo purposes, we can give him a 'coach' role secondary, or simply trust that 'Admin' can navigate everywhere.
-- To keep it simple: We Set his ID to be 'Admin' but ensure he can see Parent View.
update public.profiles 
set role = 'admin', 
    is_admin = true
where email = 'thegoaliebrand@gmail.com';

-- 4. Ensure Events exist for these personas
-- Update St. Louis Showcase to be Hockey
update public.events set sport = 'Hockey' where name ilike '%St. Louis%';
