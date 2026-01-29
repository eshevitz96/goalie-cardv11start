-- Add 'sport' column to events table to allow filtering
alter table public.events 
add column if not exists sport text; -- 'Hockey', 'Lacrosse', or null for 'Both'

-- Update our existing Simulation data
-- 1. King of the South (Box Lacrosse)
update public.events
set sport = 'Lacrosse'
where name like 'King of the South%';

-- 2. Goaliesmith (Lacrosse Company)
update public.events
set sport = 'Lacrosse'
where name like 'Goaliesmith%';

-- 3. St. Louis AAA Blues (Hockey)
update public.events
set sport = 'Hockey'
where name like 'Circle K%';
