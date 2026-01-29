-- Add Over 18 Consent to Profiles
alter table public.profiles 
add column if not exists is_over_18 boolean default false,
add column if not exists consent_agreed boolean default false;

-- Create Reflections Table for "Reflect" feature
create table if not exists public.reflections (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  title text,
  content text not null,
  mood text, -- 'happy', 'frustrated', 'neutral', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Reflections
alter table public.reflections enable row level security;

create policy "Users can manage own reflections" on public.reflections
  for all using (auth.uid() = goalie_id);

create policy "Admins can view reflections" on public.reflections
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Grant permissions (if needed, usually handled by RLS but good to be safe)
grant all on public.reflections to authenticated;
grant all on public.reflections to service_role;
