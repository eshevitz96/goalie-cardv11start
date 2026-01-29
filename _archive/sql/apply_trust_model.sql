-- TRUST MODEL MIGRATION: IMMUTABILITY OF VOICE
-- Author: Antigravity
-- Date: 2026-01-24

-- 1. Add Authorship Columns
alter table public.reflections
add column if not exists author_id uuid references auth.users(id) default auth.uid(),
add column if not exists author_role text default 'goalie'; -- 'goalie', 'parent', 'coach'

-- 2. Backfill existing data
-- We assume existing data without explicit authorship was likely 'goalie' or 'demo'
-- But for safety, if the goalie_id matches the auth.uid at creation time (we can't know for sure), we default to goalie.
-- For the demo scenarios we just ran, we might want to clean them up or label them.
update public.reflections
set author_role = 'parent'
where author_role = 'goalie' 
and exists (
  select 1 from public.roster_uploads r
  where r.id = reflections.roster_id
  and lower(r.email) = (select email from auth.users where id = reflections.author_id)
);

-- 3. Enable RLS (Ensure it's on)
alter table public.reflections enable row level security;

-- 4. Drop Old Policy (The "Manage reflections" one was too broad)
drop policy if exists "Manage reflections" on public.reflections;

-- 5. Create NEW Trust Model Policies

-- A. Visibility (Who can SEE)
-- Rule: Parents and Goalies can see everything for their Roster ID.
create policy "View Roster Reflections" on public.reflections
for select using (
  -- 1. I am the Author
  auth.uid() = author_id
  OR
  -- 2. I am the Parent Owner of the Roster Slot
  exists (
    select 1 from public.roster_uploads r 
    where r.id = reflections.roster_id 
    and lower(r.email) = lower(auth.jwt() ->> 'email')
  )
  OR
  -- 3. I am the Linked Goalie for this Roster Slot (via Profile)
  (
     -- This requires the profile to be linked to the roster_upload.
     -- Currently we link via email matching or explicit assignment.
     -- Simplification: If I am the `goalie_id` on the reflection (subject)
     auth.uid() = goalie_id
  )
  OR
  -- 4. Admin
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- B. Mutability (Who can CREATE)
-- Rule: Anyone with access to the roster can write a note.
create policy "Create Reflections" on public.reflections
for insert with check (
   -- Must be authenticated and authorized for this roster
   (
     -- Parent Owner
     exists (
       select 1 from public.roster_uploads r 
       where r.id = roster_id 
       and lower(r.email) = lower(auth.jwt() ->> 'email')
     )
     OR
     -- Linked Goalie (Subject)
     auth.uid() = goalie_id
     OR
     -- Admins
     exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
   )
   -- AND ensure they don't spoof the author_id (Postgres sets default, but user can override in insert)
   -- We force author_id to be auth.uid() in the trigger or just rely on trust for now. 
   -- Better: `author_id = auth.uid()` check.
   AND author_id = auth.uid() 
);

-- C. Immutability (Who can EDIT/DELETE)
-- Rule: You can ONLY edit your own words.
create policy "Edit Own Words" on public.reflections
for update using (
  auth.uid() = author_id
);

create policy "Delete Own Words" on public.reflections
for delete using (
  auth.uid() = author_id
);
