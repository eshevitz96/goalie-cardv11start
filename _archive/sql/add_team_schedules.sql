-- Create a table for external team schedules
create table if not exists public.team_schedules (
  id uuid default uuid_generate_v4() primary key,
  team_name text not null, -- e.g. "St. Louis AAA Blues 16U"
  sport text default 'Hockey',
  
  -- Event Details
  event_name text, -- e.g. "Game vs Chicago Mission"
  date timestamp with time zone,
  location text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.team_schedules enable row level security;
create policy "Public read schedules" on public.team_schedules for select using (true);
create policy "Admins manage schedules" on public.team_schedules for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Insert dummy schedule for St. Louis AAA Blues
insert into public.team_schedules (team_name, sport, event_name, date, location)
values
('St. Louis AAA Blues', 'Hockey', 'vs. Chicago Mission', '2026-02-14 18:00:00+00', 'Centene Community Ice Center'),
('St. Louis AAA Blues', 'Hockey', 'vs. Shattuck St. Mary''s', '2026-02-15 10:00:00+00', 'Centene Community Ice Center');
