-- Clean slate: Drop existing tables
drop table if exists public.reviews cascade;
drop table if exists public.schedule_requests cascade;
drop table if exists public.sessions cascade;
drop table if exists public.profiles cascade;
drop table if exists public.roster_uploads cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. Roster Uploads (The "Book of Goalies" / Whitelist)
-- This is where the Admin CSV data goes. 
-- When a user signs up, we check this table to see if they have a pre-assigned ID.
create table public.roster_uploads (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null, -- The matching key
  goalie_name text,
  parent_name text,
  parent_phone text,
  grad_year int,
  team text,
  assigned_unique_id text, -- The pre-generated GC-XXXX ID
  is_claimed boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Profiles (Live Users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text, 
  role text default 'parent', -- 'parent', 'coach', 'admin'
  
  -- Goalie Specific
  goalie_name text, 
  parent_name text, 
  parent_phone text, 
  grad_year int, 
  team text, 
  
  -- Lacrosse Specific
  us_lacrosse_id text, 
  waiver_signed boolean default false,
  
  -- System Status
  status text default 'pending', 
  unique_id text, 
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Sessions
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  session_number int default 1,
  lesson_number int default 0,
  is_active boolean default true,
  last_lesson_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Schedule Requests
create table public.schedule_requests (
  id uuid default uuid_generate_v4() primary key,
  goalie_id uuid references public.profiles(id) on delete cascade,
  requested_date timestamp with time zone,
  note text,
  status text default 'pending', 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Reviews
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

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.roster_uploads enable row level security;

-- Public can read roster uploads to check for their email during signup
create policy "Public can check roster" on public.roster_uploads for select using (true);
-- Only authenticated users (admins realistically) can insert
create policy "Admins can upload roster" on public.roster_uploads for insert with check (true); 

create policy "Public Profiles" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
