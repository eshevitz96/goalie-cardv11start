-- Fix Sessions Table Permissions
-- This script explicitly drops and recreates the RLS policies for the 'sessions' table
-- to ensure Admins have full access and standard users can only view their own data.

-- 1. Enable RLS (Ensure it's on)
alter table public.sessions enable row level security;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Users can view own sessions" on public.sessions;
drop policy if exists "Admins can manage sessions" on public.sessions;
drop policy if exists "Admins All Sessions" on public.sessions;

-- 3. Re-create Admin Policy (FULL ACCESS)
create policy "Admins All Sessions"
on public.sessions
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- 4. Re-create User Policy (READ OWN)
-- Improved to check both goalie_id and linked roster_id (if we had a link),
-- but keeping it simple as per schema: access if goalie_id matches.
create policy "Users View Own Sessions"
on public.sessions
for select
using (
  auth.uid() = goalie_id
);

-- 5. Verification Helper (You can run this separately to check your status)
-- select id, role from public.profiles where id = auth.uid();
