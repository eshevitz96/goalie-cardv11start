-- V11 Core Migration (Phase 1)
-- Transitions training protocols to the database and reinforces data integrity.

-- 1. Create Protocol Templates Table
CREATE TABLE IF NOT EXISTS public.protocol_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration TEXT,
    type TEXT, -- 'physical', 'mental'
    category TEXT, -- 'physical', 'mental', 'recovery'
    description TEXT,
    target_indices JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Protocol Stages (Steps) Table
CREATE TABLE IF NOT EXISTS public.protocol_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id TEXT REFERENCES public.protocol_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    duration_seconds INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reinforce Cascading Deletes for Performance Tables
-- Snapshots
ALTER TABLE public.performance_index_snapshots
DROP CONSTRAINT IF EXISTS performance_index_snapshots_user_id_fkey,
ADD CONSTRAINT performance_index_snapshots_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Protocol Sessions
ALTER TABLE public.protocol_sessions
DROP CONSTRAINT IF EXISTS protocol_sessions_user_id_fkey,
ADD CONSTRAINT protocol_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Game Sessions
ALTER TABLE public.game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_user_id_fkey,
ADD CONSTRAINT game_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Protocol Stage Events
ALTER TABLE public.protocol_stage_events
DROP CONSTRAINT IF EXISTS protocol_stage_events_session_id_fkey,
ADD CONSTRAINT protocol_stage_events_session_id_fkey
FOREIGN KEY (session_id) REFERENCES public.protocol_sessions(id) ON DELETE CASCADE;

-- 5. Enable RLS for Definitions
ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_stages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Public Read for Core Content)
CREATE POLICY "Anyone can view active protocols" 
ON public.protocol_templates FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can view protocol stages" 
ON public.protocol_stages FOR SELECT 
USING (true);

-- 7. Indexing for Performance
CREATE INDEX IF NOT EXISTS idx_snapshots_roster_id ON public.performance_index_snapshots(roster_id);
CREATE INDEX IF NOT EXISTS idx_protocol_sessions_roster_id ON public.protocol_sessions(roster_id);
CREATE INDEX IF NOT EXISTS idx_protocol_stages_template_id ON public.protocol_stages(template_id);
