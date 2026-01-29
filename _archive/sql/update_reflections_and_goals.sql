-- Update Reflections Table to support new activity tracking
alter table public.reflections 
add column if not exists activity_type text default 'practice', -- 'practice', 'game', 'training', 'none'
add column if not exists skip_reason text, -- 'rest', 'injury', 'sick', 'other'
add column if not exists injury_expected_return date,
add column if not exists injury_details text;

-- Create Goals Table
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  description text not null,
  category text default 'performance', -- 'performance', 'mental', 'physical'
  status text default 'active', -- 'active', 'completed', 'abandoned'
  target_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- RLS for Goals
alter table public.goals enable row level security;

create policy "Users can manage own goals" on public.goals
  for all using (auth.uid() = goalie_id);

create policy "Admins can view goals" on public.goals
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Grant permissions
grant all on public.goals to authenticated;
grant all on public.goals to service_role;
