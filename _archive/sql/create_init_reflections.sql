-- Create Reflections Table (if not exists)
create table if not exists public.reflections (
  id uuid default uuid_generate_v4() primary key,
  roster_id uuid references public.roster_uploads(id) on delete cascade,
  goalie_id uuid references public.profiles(id) on delete set null, -- Optional link to profile directly
  title text,
  content text,
  mood text default 'neutral', -- happy, frustrated, neutral
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.reflections enable row level security;

-- Consolidated Policy:
create policy "Manage reflections" on public.reflections
for all using (
  -- 1. Owner of Roster Entry (Parent)
  exists (
    select 1 from public.roster_uploads r 
    where r.id = reflections.roster_id 
    and lower(r.email) = lower(auth.jwt() ->> 'email')
  )
  OR
  -- 2. Linked Goalie Profile
  (auth.uid() = goalie_id)
  OR
  -- 3. Admin
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Index
create index if not exists idx_reflections_roster on public.reflections(roster_id);
