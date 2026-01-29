-- Link Reflections to Roster (for Parent/Goalie dual access)
alter table public.reflections 
add column if not exists roster_id uuid references public.roster_uploads(id) on delete cascade;

-- Index for performance
create index if not exists idx_reflections_roster on public.reflections(roster_id);

-- Update RLS to allow access via Roster ID
drop policy if exists "Users can manage own reflections" on public.reflections;
drop policy if exists "Admins can view reflections" on public.reflections;

create policy "Manage reflections via Roster" on public.reflections
for all using (
  -- User owns the Linked Profile
  auth.uid() = goalie_id 
  OR 
  -- User owns the Roster Entry (Parent email match or assigned unique ID match logic handled in app, 
  -- but strictly RLS usually checks Auth UID linkage or email).
  -- For Simplicity & Security: We allow if Roster Email matches Auth Email
  exists (
    select 1 from public.roster_uploads r 
    where r.id = reflections.roster_id 
    and lower(r.email) = lower(auth.jwt() ->> 'email')
  )
  OR
  -- Admin Access
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
