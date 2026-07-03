-- Migration: Fix Database-Wide RLS Leaks & Systemic UUID Mismatches
-- Created: 2026-06-11
-- Target: Remote Supabase DB

-- Wrap in a single transaction to ensure all-or-nothing execution
BEGIN;

-- 1. Enable RLS on all 12 tables (ensuring any disabled tables are active)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 2. DYNAMIC TEARDOWN: Drop ALL existing policies on the 12 tables to ensure no leaks survive.
-- Postgres OR's policies together, so this block loops through pg_policies to drop every single one.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN (
              'users', 'profiles', 'game_sessions', 'seasons', 
              'performance_index_snapshots', 'protocol_sessions', 
              'training_sessions', 'team_memberships', 'user_settings', 
              'roster_uploads', 'sessions', 'reflections'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;


-- 3. Define Clean, Unified Policies for target tables (excluding Reflections to seal it completely)

-- ==========================================
-- Users Table
-- ==========================================
CREATE POLICY "Users can read own record" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own record" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can delete own record" ON public.users
    FOR DELETE TO authenticated
    USING (auth.uid() = auth_user_id);


-- ==========================================
-- Profiles Table
-- ==========================================
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- ==========================================
-- Roster Uploads (Checking all 3 email fields: email, athlete_email, guardian_email)
-- ==========================================
CREATE POLICY "Enable select for owners and admins" ON public.roster_uploads
    FOR SELECT TO authenticated
    USING (
        lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(athlete_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR linked_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable update for owners" ON public.roster_uploads
    FOR UPDATE TO authenticated
    USING (
        lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(athlete_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR linked_user_id = auth.uid()
    )
    WITH CHECK (
        lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(athlete_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR linked_user_id = auth.uid()
    );

CREATE POLICY "Allow authenticated users to upload" ON public.roster_uploads
    FOR INSERT TO authenticated, anon
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(athlete_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(guardian_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );

CREATE POLICY "Admins can delete roster" ON public.roster_uploads
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ==========================================
-- Sessions Table
-- ==========================================
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT TO authenticated
    USING (auth.uid() = goalie_id);

CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL TO authenticated
    USING (auth.uid() = goalie_id)
    WITH CHECK (auth.uid() = goalie_id);


-- ==========================================
-- Public.User-Linked Tables (Storing public user ID in user_id)
-- ==========================================

-- Game Sessions
CREATE POLICY "Users can read own game sessions" ON public.game_sessions
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own game sessions" ON public.game_sessions
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Seasons
CREATE POLICY "Users can read own seasons" ON public.seasons
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own seasons" ON public.seasons
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Performance Index Snapshots
CREATE POLICY "Users can view their own snapshots" ON public.performance_index_snapshots
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own snapshots" ON public.performance_index_snapshots
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Protocol Sessions
CREATE POLICY "Users can view their own protocol sessions" ON public.protocol_sessions
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own protocol sessions" ON public.protocol_sessions
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Training Sessions
CREATE POLICY "Users can read own training sessions" ON public.training_sessions
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own training sessions" ON public.training_sessions
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Team Memberships
CREATE POLICY "Users can read own memberships" ON public.team_memberships
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own memberships" ON public.team_memberships
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- User Settings
CREATE POLICY "Users can read own settings" ON public.user_settings
    FOR SELECT TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL TO authenticated
    USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

COMMIT;
