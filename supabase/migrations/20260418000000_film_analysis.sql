-- Film Analysis: Game Reports
create table if not exists public.game_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date timestamptz not null default now(),
  sport text not null default 'Hockey',
  season text not null default '2024-25',
  created_at timestamptz not null default now()
);

alter table public.game_reports enable row level security;

create policy "Users manage own game reports"
  on public.game_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Film Analysis: Clips (video files stored in Supabase Storage)
create table if not exists public.film_clips (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.game_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  size bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.film_clips enable row level security;

create policy "Users manage own film clips"
  on public.film_clips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Film Analysis: Shot Events
create table if not exists public.film_shots (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.game_reports(id) on delete cascade,
  clip_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null default '1st',
  shot_type text not null default 'Wrist',
  is_deflected boolean not null default false,
  is_save boolean not null default true,
  net_x double precision,
  net_y double precision,
  rink_x double precision,
  rink_y double precision,
  video_time double precision,
  created_at timestamptz not null default now()
);

alter table public.film_shots enable row level security;

create policy "Users manage own film shots"
  on public.film_shots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
