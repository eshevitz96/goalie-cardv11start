-- Clean slate: Drop existing tables if they match the names (CASCADE removes dependencies)
drop table if exists public.reviews cascade;
drop table if exists public.schedule_requests cascade;
drop table if exists public.sessions cascade;
drop table if exists public.profiles cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Goalies & Parents linked)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text, 
  role text default 'parent', -- 'parent', 'coach', 'admin'
  
  -- Goalie Specific
  goalie_name text, 
  parent_name text, 
  parent_phone text, 
  
  -- Parsing Note: We will store grad_year as int, but inputs might need cleaning
  grad_year int, 
  team text, 
  
  -- Lacrosse Specific
  us_lacrosse_id text, 
  waiver_signed boolean default false,
  
  -- System Status
  status text default 'pending', -- 'active', 'pending', 'renew_needed'
  unique_id text, 
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Sessions (Tracking Progress)
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  
  session_number int default 1,
  lesson_number int default 0,
  
  is_active boolean default true,
  last_lesson_date timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Schedule Requests (Coach Inbox)
create table public.schedule_requests (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  
  requested_date timestamp with time zone,
  note text,
  status text default 'pending', 
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Session Logs (Reviews)
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  goalie_id uuid references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  
  rating_glove int,
  rating_blocker int,
  rating_pads int,
  rating_iq int,
  
  notes text,
  
  marketable_stat text, 
  marketable_quote text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.schedule_requests enable row level security;
alter table public.reviews enable row level security;

-- Policies (Simple)
-- Allow anyone to read profiles (needed for login/signup checks)
create policy "Public Profiles" on public.profiles for select using (true);
-- Allow users to insert their own profile (claiming account)
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
-- Allow users to update their own profile
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
