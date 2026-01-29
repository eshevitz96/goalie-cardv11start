-- 1. Update Events Table Schema to include 'sport'
alter table public.events 
add column if not exists sport text default 'Hockey';

-- 2. Create Test Events
-- Hockey Event
insert into public.events (name, date, location, status, image, price, sport, access_code)
values 
('St. Louis High School Hockey Showcase', now() + interval '14 days', 'Centene Community Ice Center', 'open', 'from-blue-600 to-indigo-600', 0, 'Hockey', null),
('NCAA Lacrosse Combine', now() + interval '30 days', 'Detroit, MI', 'open', 'from-orange-500 to-red-600', 15000, 'Lacrosse', 'UDMGOALIE')
on conflict do nothing;

-- 3. Update Existing Events to have sports (optional, based on name)
update public.events set sport = 'Lacrosse' where name ilike '%Lacrosse%' or name ilike '%Goaliesmith%';
update public.events set sport = 'Hockey' where name ilike '%Hockey%' or name ilike '%Circle K%';

-- 4. Setup Elliott Shevitz (The Admin/User)
-- Ensure he is in roster_uploads
insert into public.roster_uploads (email, goalie_name, team, grad_year, sport, is_claimed)
values ('thegoaliebrand@gmail.com', 'Elliott Shevitz', 'Ladue Rams', 2026, 'Hockey, Lacrosse', true)
on conflict (email) 
do update set 
  sport = 'Hockey, Lacrosse', 
  team = 'Ladue Rams',
  grad_year = 2026,
  goalie_name = 'Elliott Shevitz';

-- Ensure he has a profile linked
-- (This relies on the user signing up/logging in with this email, checking if profile exists)
update public.profiles 
set 
  sport = 'Hockey, Lacrosse',
  team = 'Ladue Rams',
  grad_year = 2026,
  goalie_name = 'Elliott Shevitz'
where email = 'thegoaliebrand@gmail.com';

-- 5. Setup Luke Grasso
-- Update roster if he exists by name
update public.roster_uploads
set 
  team = 'Detroit Mercy',
  grad_year = 2029, -- Freshman in College (approx)
  sport = 'Lacrosse'
where goalie_name ilike 'Luke Grasso';

-- If he doesn't exist, insert him (placeholder email since we don't know it, user said he's in system)
insert into public.roster_uploads (email, goalie_name, team, grad_year, sport, is_claimed)
select 'luke.grasso@example.com', 'Luke Grasso', 'Detroit Mercy', 2029, 'Lacrosse', true
where not exists (select 1 from public.roster_uploads where goalie_name ilike 'Luke Grasso');

-- 6. Clean up simulation/bad data if needed
-- (None for now)
