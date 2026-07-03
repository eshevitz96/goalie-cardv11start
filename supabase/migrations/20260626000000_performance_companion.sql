-- ----------------------------------------------------
-- TRIGGER FUNCTIONS
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------
-- TABLES DEFINITION
-- ----------------------------------------------------

-- 1. ATHLETE PROFILES (Permanent Identity State)
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    athlete_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_baseline NUMERIC(3,2) DEFAULT 4.0 CHECK (balance_baseline BETWEEN 1.0 AND 10.0),
    landing_baseline NUMERIC(3,2) DEFAULT 4.0 CHECK (landing_baseline BETWEEN 1.0 AND 10.0),
    conditioning_baseline NUMERIC(3,2) DEFAULT 4.0 CHECK (conditioning_baseline BETWEEN 1.0 AND 10.0),
    recent_fatigue_level VARCHAR(20) DEFAULT 'moderate',
    total_completed_missions INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFORMANCE MODELS (Continuously Evolving Understanding)
CREATE TABLE IF NOT EXISTS public.performance_models (
    model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance_score NUMERIC(3,2) DEFAULT 4.0 CHECK (balance_score BETWEEN 1.0 AND 10.0),
    landing_score NUMERIC(3,2) DEFAULT 4.0 CHECK (landing_score BETWEEN 1.0 AND 10.0),
    conditioning_score NUMERIC(3,2) DEFAULT 4.0 CHECK (conditioning_score BETWEEN 1.0 AND 10.0),
    fatigue_index NUMERIC(3,2) DEFAULT 0.0 CHECK (fatigue_index BETWEEN 0.0 AND 10.0),
    chronic_workload NUMERIC(5,2) DEFAULT 0.0,
    acute_workload NUMERIC(5,2) DEFAULT 0.0,
    model_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL, -- Track model logic iterations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONTRACTS (Macro Success Boundaries)
CREATE TABLE IF NOT EXISTS public.contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index enforcing max 1 active contract per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_contract 
ON public.contracts(athlete_id) 
WHERE status = 'active';

-- 4. KNOWLEDGE BASES (Structured Catalog Libraries)
CREATE TABLE IF NOT EXISTS public.knowledge_bases (
    kb_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_domain_version UNIQUE (domain, version)
);

-- 5. MISSIONS (Daily Target Assignments)
CREATE TABLE IF NOT EXISTS public.missions (
    mission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(contract_id) ON DELETE CASCADE NOT NULL,
    kb_id UUID REFERENCES public.knowledge_bases(kb_id) ON DELETE SET NULL,
    date DATE NOT NULL,
    estimated_time INT NOT NULL,
    mission_title VARCHAR(200) NOT NULL,
    mission_statement TEXT NOT NULL,
    blocks JSONB NOT NULL, -- V1 target tasks
    coach_focus TEXT NOT NULL,
    success_criteria TEXT NOT NULL,
    recovery_notes TEXT,
    explanation TEXT[] NOT NULL, -- Decision Trace logs
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index enforcing max 1 primary mission per contract per day
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_mission_per_day_per_contract 
ON public.missions(contract_id, date);

-- 6. COACH SESSIONS (Execution Logs - Mission vs Actuals; renamed to avoid collision)
CREATE TABLE IF NOT EXISTS public.coach_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES public.missions(mission_id) ON DELETE SET NULL, -- A mission can generate 0, 1, or many sessions
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    actual_time INT NOT NULL,
    completed_blocks JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'completed', 'partial', 'skipped')),
    source VARCHAR(30) DEFAULT 'mission' CHECK (source IN ('mission', 'manual', 'imported', 'coach_adjusted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COACH REFLECTIONS (Athlete Subjective Observations; renamed to avoid collision)
CREATE TABLE IF NOT EXISTS public.coach_reflections (
    reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.coach_sessions(session_id) ON DELETE CASCADE UNIQUE NOT NULL, -- 1 reflection per session
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    energy INT NOT NULL CHECK (energy BETWEEN 1 AND 10),
    balance_rating INT NOT NULL CHECK (balance_rating BETWEEN 1 AND 10),
    landing_rating INT NOT NULL CHECK (landing_rating BETWEEN 1 AND 10),
    conditioning_rating INT NOT NULL CHECK (conditioning_rating BETWEEN 1 AND 10),
    win_today TEXT,
    bottleneck TEXT,
    tomorrow_focus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LEARNING UPDATES (Permanent Audit Event logs)
CREATE TABLE IF NOT EXISTS public.learning_updates (
    learning_update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id UUID REFERENCES public.coach_reflections(reflection_id) ON DELETE CASCADE UNIQUE NOT NULL, -- 1 update per reflection
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    previous_model_state JSONB NOT NULL, -- Snapshot of baseline ratings before update
    updated_model_state JSONB NOT NULL, -- Snapshot of baseline ratings after update
    insights TEXT[] NOT NULL,
    deltas JSONB NOT NULL,
    model_version VARCHAR(50) DEFAULT 'v1.0' NOT NULL, -- Syncs logic model calculations
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MILESTONES (Macro Targets achieved)
CREATE TABLE IF NOT EXISTS public.milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(contract_id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    criteria_json JSONB NOT NULL,
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- TRIGGER ATTACHMENTS
-- ----------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_athlete_profiles ON public.athlete_profiles;
CREATE TRIGGER trigger_update_athlete_profiles BEFORE UPDATE ON public.athlete_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_performance_models ON public.performance_models;
CREATE TRIGGER trigger_update_performance_models BEFORE UPDATE ON public.performance_models FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_contracts ON public.contracts;
CREATE TRIGGER trigger_update_contracts BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_missions ON public.missions;
CREATE TRIGGER trigger_update_missions BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_coach_sessions ON public.coach_sessions;
CREATE TRIGGER trigger_update_coach_sessions BEFORE UPDATE ON public.coach_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------
-- ENABLE RLS
-- ----------------------------------------------------
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS POLICIES
-- ----------------------------------------------------
DROP POLICY IF EXISTS authenticated_select_kb ON public.knowledge_bases;
CREATE POLICY authenticated_select_kb ON public.knowledge_bases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS service_role_write_kb ON public.knowledge_bases;
CREATE POLICY service_role_write_kb ON public.knowledge_bases FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS owner_all_profiles ON public.athlete_profiles;
CREATE POLICY owner_all_profiles ON public.athlete_profiles FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_models ON public.performance_models;
CREATE POLICY owner_all_models ON public.performance_models FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_contracts ON public.contracts;
CREATE POLICY owner_all_contracts ON public.contracts FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_missions ON public.missions;
CREATE POLICY owner_all_missions ON public.missions FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_coach_sessions ON public.coach_sessions;
CREATE POLICY owner_all_coach_sessions ON public.coach_sessions FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_coach_reflections ON public.coach_reflections;
CREATE POLICY owner_all_coach_reflections ON public.coach_reflections FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_learning ON public.learning_updates;
CREATE POLICY owner_all_learning ON public.learning_updates FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS owner_all_milestones ON public.milestones;
CREATE POLICY owner_all_milestones ON public.milestones FOR ALL TO authenticated USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
