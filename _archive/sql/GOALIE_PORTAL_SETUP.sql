-- 1. Add Consent Fields to Profiles
alter table public.profiles 
add column if not exists is_over_18 boolean default false,
add column if not exists consent_agreed boolean default false;

-- 2. Create Reflections Table (if not exists)
create table if not exists public.reflections (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  title text,
  content text not null,
  mood text, -- 'happy', 'frustrated', 'neutral', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Link Reflections to Roster (for Parent/Goalie dual access)
alter table public.reflections 
add column if not exists roster_id uuid references public.roster_uploads(id) on delete cascade;

-- 4. Enable RLS
alter table public.reflections enable row level security;

-- 5. Create RLS Policies
drop policy if exists "Users can manage own reflections" on public.reflections;
drop policy if exists "Admins can view reflections" on public.reflections;
drop policy if exists "Manage reflections via Roster" on public.reflections;

create policy "Manage reflections via Roster" on public.reflections
for all using (
  -- User owns the Linked Profile
  (auth.uid() = goalie_id)
  OR 
  -- User owns the Linked Roster Entry (Parent email match)
  exists (
    select 1 from public.roster_uploads r 
    where r.id = reflections.roster_id 
    and lower(r.email) = lower(auth.jwt() ->> 'email')
  )
  OR
  -- Admin Access
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 6. Indexes
create index if not exists idx_reflections_roster on public.reflections(roster_id);
create index if not exists idx_reflections_goalie on public.reflections(goalie_id);
