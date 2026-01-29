create table public.coach_availability (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references public.profiles(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_booked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.coach_availability enable row level security;

-- Policies (Simple for now: everyone can read, only coaches can write)
create policy "Public can view availability" 
  on public.coach_availability for select 
  using (true);

create policy "Coaches can manage their own availability" 
  on public.coach_availability for all 
  using (auth.uid() = coach_id);
