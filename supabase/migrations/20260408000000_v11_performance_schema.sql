-- V11 Performance & Analytics Schema
-- This migration creates the necessary tables for the V11 Performance Index tracking,
-- including sessions, stage events, and score snapshots.

-- 1. Performance Index Snapshots
-- Stores the calculated scores for Stability, Execution, and Readiness.
CREATE TABLE IF NOT EXISTS public.performance_index_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roster_id UUID REFERENCES public.roster_uploads(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'protocol_session', 'game_session', 'manual'
    source_id UUID,
    score_before INTEGER NOT NULL DEFAULT 0,
    score_after INTEGER NOT NULL DEFAULT 0,
    score_delta DECIMAL(10,1) NOT NULL DEFAULT 0,
    stability_score INTEGER NOT NULL DEFAULT 0,
    execution_score INTEGER NOT NULL DEFAULT 0,
    readiness_score INTEGER NOT NULL DEFAULT 0,
    summary_label TEXT,
    summary_reason TEXT,
    ruleset_version TEXT DEFAULT 'v1.1',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Protocol Sessions
-- Tracks the initiation and completion of training drills.
CREATE TABLE IF NOT EXISTS public.protocol_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roster_id UUID REFERENCES public.roster_uploads(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'complete', 'aborted'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Game Sessions
-- Metrics for live charting/reflection sessions.
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roster_id UUID REFERENCES public.roster_uploads(id) ON DELETE CASCADE,
    event_id UUID, -- References the 'events' table if applicable
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'complete'
    total_shots INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    save_percentage DECIMAL(10,3) DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Protocol Stage Events
-- Tracks the detailed step-by-step progress through a protocol.
CREATE TABLE IF NOT EXISTS public.protocol_stage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.protocol_sessions(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'complete'
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. Enable RLS
ALTER TABLE public.performance_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_stage_events ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS Policies
-- Goalies can view their own data
CREATE POLICY "Users can view their own snapshots" 
ON public.performance_index_snapshots FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own protocol sessions" 
ON public.protocol_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own game sessions" 
ON public.game_sessions FOR SELECT 
USING (auth.uid() = user_id);

-- 7. Realtime Support
ALTER PUBLICATION supabase_realtime ADD TABLE performance_index_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE protocol_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
