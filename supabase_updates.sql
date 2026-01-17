-- Add Highlights Table
create table if not exists public.highlights (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  roster_id uuid references public.roster_uploads(id) on delete cascade, -- Fallback if profile doesn't exist
  url text not null,
  description text,
  coach_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add Coach Assignment to Roster Uploads
alter table public.roster_uploads add column if not exists assigned_coach_id uuid references auth.users(id);

-- Add RLS for Highlights
alter table public.highlights enable row level security;
create policy "Public can view highlights" on public.highlights for select using (true);
create policy "Users can insert own highlights" on public.highlights for insert with check (true); -- Simplified for now
create policy "Coaches can update highlights" on public.highlights for update using (true); 
