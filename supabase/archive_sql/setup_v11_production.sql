-- setup_v11_production.sql
-- Run this in your Supabase SQL Editor to finalize V11 feature parity.

-- 1. Extend Profiles for Team Hub connectivity
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);
ALTER TABLE public.roster_uploads ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- 2. Create Goalie Analytics tracking table
CREATE TABLE IF NOT EXISTS public.goalie_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goalie_id UUID REFERENCES auth.users(id),
    action_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Analytics
ALTER TABLE public.goalie_analytics ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Analytics
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Goalies can insert their own analytics' AND tablename = 'goalie_analytics') THEN
        CREATE POLICY "Goalies can insert their own analytics" 
            ON public.goalie_analytics FOR INSERT WITH CHECK (auth.uid() = goalie_id);
    END IF;
END $$;

-- 3. Create or Update Coach Requests table
CREATE TABLE IF NOT EXISTS public.coach_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goalie_id UUID REFERENCES auth.users(id),
    coach_id UUID REFERENCES public.profiles(id),
    roster_id UUID REFERENCES public.roster_uploads(id),
    goalie_why TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Coach Requests
ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for Coach Requests
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Goalies can manage their own coach requests' AND tablename = 'coach_requests') THEN
        CREATE POLICY "Goalies can manage their own coach requests" 
            ON public.coach_requests FOR ALL USING (auth.uid() = goalie_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coaches can view requests sent to them' AND tablename = 'coach_requests') THEN
        CREATE POLICY "Coaches can view requests sent to them" 
            ON public.coach_requests FOR SELECT USING (auth.uid() = coach_id);
    END IF;
END $$;

-- 4. Audit Shot Events (Ensure consistency)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shot_events' AND column_name='film_url') THEN
        ALTER TABLE public.shot_events ADD COLUMN film_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shot_events' AND column_name='roster_id') THEN
        ALTER TABLE public.shot_events ADD COLUMN roster_id UUID REFERENCES public.roster_uploads(id);
    END IF;
END $$;
