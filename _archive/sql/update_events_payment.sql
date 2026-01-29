-- Add payment details to events table
alter table public.events 
add column if not exists price int default 0, -- in cents
add column if not exists access_code text; -- generic code for bypass

-- Update existing rows with the user's specific scenario data
-- 1. King of the South (Team Event -> Free)
update public.events 
set price = 0
where name like 'King of the South%';

-- 2. Circle K (Team Event -> Free)
update public.events
set price = 0
where name like 'Circle K%';

-- 3. Goaliesmith (Paid -> $250, Code: VIPGOALIE)
update public.events
set price = 25000, access_code = 'VIPGOALIE'
where name like 'Goaliesmith%';
