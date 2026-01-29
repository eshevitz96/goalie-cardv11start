-- Enable Delete permissions for roster_uploads and sessions
-- This is critical for the Admin Console's "Reset Database" and "Delete Goalie" features.

-- Roster Uploads Policies
alter table public.roster_uploads enable row level security;

-- Drop existing delete policies to avoid conflicts
drop policy if exists "Enable delete for users" on public.roster_uploads;
drop policy if exists "Allow public delete" on public.roster_uploads;

-- Create a permissive delete policy (allows Admin to clear roster)
create policy "Allow public delete" on public.roster_uploads for delete using (true);

-- Sessions Policies
alter table public.sessions enable row level security;

drop policy if exists "Enable delete for sessions" on public.sessions;
drop policy if exists "Allow public delete" on public.sessions;

create policy "Allow public delete" on public.sessions for delete using (true);

-- Ensure Insert is also open if not already (for CSV upload)
create policy "Allow public insert" on public.roster_uploads for insert with check (true);
create policy "Allow public insert" on public.sessions for insert with check (true);
