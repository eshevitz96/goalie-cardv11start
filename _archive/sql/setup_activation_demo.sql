-- 1. Create a "Goalie" user who needs parental consent (Under 18)
-- We'll use a new email for Elliott's "Goalie Account" distinct from his parent account for the demo.
-- Or better yet, we can reset Elliott's existing profile to be 'goalie' role to see if flow blocks him.

-- Setup: Create a roster entry that is "Pending Activation"
-- Using a new fake email for the "Goalie" persona to simulate the 'ask parent' flow.
insert into public.roster_uploads (email, goalie_name, parent_name, parent_phone, grad_year, team, sport, assigned_unique_id, is_claimed)
values ('elliott.goalie@example.com', 'Elliott Shevitz (Goalie)', 'Mr. Shevitz', '555-0100', 2026, 'Ladue Rams', 'Hockey, Lacrosse', 'GC-DEMO-01', false)
on conflict (email) do update 
set is_claimed = false, assigned_unique_id = 'GC-DEMO-01';

-- 2. Ensure RLS allows public lookup for activation
drop policy if exists "Public Roster Lookup" on public.roster_uploads;
create policy "Public Roster Lookup" on public.roster_uploads
for select using (true);
