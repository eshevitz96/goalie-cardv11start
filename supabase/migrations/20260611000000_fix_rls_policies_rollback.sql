-- Rollback (DOWN) Migration: Revert RLS Policies & Disable Security on Leaking Tables
-- Created: 2026-06-11
-- Target: Remote Supabase DB

-- 1. Drop the new unified policies
-- Users
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can delete own record" ON public.users;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

-- Roster Uploads
DROP POLICY IF EXISTS "Enable select for owners and admins" ON public.roster_uploads;
DROP POLICY IF EXISTS "Enable update for owners" ON public.roster_uploads;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON public.roster_uploads;
DROP POLICY IF EXISTS "Admins can delete roster" ON public.roster_uploads;

-- Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;

-- Reflections
DROP POLICY IF EXISTS "Users can view own reflections" ON public.reflections;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.reflections;
DROP POLICY IF EXISTS "Users can manage own reflections" ON public.reflections;

-- Game Sessions
DROP POLICY IF EXISTS "Users can read own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can manage own game sessions" ON public.game_sessions;

-- Seasons
DROP POLICY IF EXISTS "Users can read own seasons" ON public.seasons;
DROP POLICY IF EXISTS "Users can manage own seasons" ON public.seasons;

-- Performance Index Snapshots
DROP POLICY IF EXISTS "Users can view their own snapshots" ON public.performance_index_snapshots;
DROP POLICY IF EXISTS "Users can manage own snapshots" ON public.performance_index_snapshots;

-- Protocol Sessions
DROP POLICY IF EXISTS "Users can view their own protocol sessions" ON public.protocol_sessions;
DROP POLICY IF EXISTS "Users can manage own protocol sessions" ON public.protocol_sessions;

-- Training Sessions
DROP POLICY IF EXISTS "Users can read own training sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can manage own training sessions" ON public.training_sessions;

-- Team Memberships
DROP POLICY IF EXISTS "Users can read own memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Users can manage own memberships" ON public.team_memberships;

-- User Settings
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;


-- 2. Restore previous policies (UUID mismatch policies)

-- Users Table
CREATE POLICY "Users can read own record" ON public.users FOR SELECT USING (auth.uid() = id);

-- Game Sessions
CREATE POLICY "Users can read own game sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions FOR ALL USING (auth.uid() = user_id);

-- Seasons
CREATE POLICY "Users can read own seasons" ON public.seasons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own season settings" ON public.seasons FOR ALL USING (auth.uid() = user_id);

-- Performance Index Snapshots
CREATE POLICY "Users can view their own snapshots" ON public.performance_index_snapshots FOR SELECT USING (auth.uid() = user_id);

-- Protocol Sessions
CREATE POLICY "Users can read own protocol sessions" ON public.protocol_sessions FOR SELECT USING (auth.uid() = user_id);

-- Training Sessions
CREATE POLICY "Users can read own training sessions" ON public.training_sessions FOR SELECT USING (auth.uid() = user_id);

-- Team Memberships
CREATE POLICY "Users can read own memberships" ON public.team_memberships FOR SELECT USING (auth.uid() = user_id);

-- User Settings
CREATE POLICY "Users can read own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

-- Reflections
CREATE POLICY "Allow authenticated insert" ON public.reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);


-- 3. Disable RLS on the tables that previously had RLS disabled or open
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections DISABLE ROW LEVEL SECURITY;
