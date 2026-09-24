-- ============================================================================
-- COACH CARD DECOUPLED EXECUTION & WORKLOAD SCHEMA
-- Version: 2026-09-16 (Phase 1 / Slice 1)
--
-- Core Mandates:
-- 1. Decouple Planned Missions vs. Completed Sessions vs. Athlete Decisions.
-- 2. Nullable load vector scores (no pseudo-precise 0-10 numbers without evidence).
-- 3. Historical provenance & correction auditability (supersession rather than destructive mutation).
-- ============================================================================

-- 1. LOAD EVENTS: Structured and Unstructured Cumulative Workload
CREATE TABLE IF NOT EXISTS public.load_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL, -- 'running', 'gym_strength', 'ice_hockey', 'stick_and_puck', 'tryout', 'rollerblading', 'yoga', 'yard_work', 'walking', 'travel', 'recovery', 'other'
    title TEXT NOT NULL,
    start_timestamp TIMESTAMPTZ NOT NULL,
    duration_mins INTEGER NOT NULL,
    is_structured_training BOOLEAN DEFAULT true,

    -- Nullable load vectors (no fabricated precision)
    lower_body_load_score INTEGER CHECK (lower_body_load_score IS NULL OR (lower_body_load_score >= 0 AND lower_body_load_score <= 10)),
    upper_body_load_score INTEGER CHECK (upper_body_load_score IS NULL OR (upper_body_load_score >= 0 AND upper_body_load_score <= 10)),
    cardio_load_score INTEGER CHECK (cardio_load_score IS NULL OR (cardio_load_score >= 0 AND cardio_load_score <= 10)),
    mobility_load_score INTEGER CHECK (mobility_load_score IS NULL OR (mobility_load_score >= 0 AND mobility_load_score <= 10)),
    sport_specific_load_score INTEGER CHECK (sport_specific_load_score IS NULL OR (sport_specific_load_score >= 0 AND sport_specific_load_score <= 10)),

    load_estimation_source TEXT DEFAULT 'unestimated', -- 'athlete_reported', 'coach_estimated', 'measured_device', 'unestimated'
    load_estimation_confidence TEXT DEFAULT 'NOT_APPLICABLE', -- 'EXACT', 'ESTIMATED', 'UNKNOWN', 'NOT_APPLICABLE'

    notes TEXT,

    -- Provenance & Audit fields
    record_source TEXT DEFAULT 'athlete_track_manual', -- 'historical_dossier', 'athlete_track_manual', 'mission_completion', 'conversational_import', 'external_device'
    date_confidence TEXT DEFAULT 'EXACT', -- 'EXACT', 'RECONSTRUCTED', 'DATE_UNCERTAIN'
    completion_confidence TEXT DEFAULT 'EXACT', -- 'EXACT', 'RECONSTRUCTED', 'PARTIAL_UNCONFIRMED', 'UNKNOWN'
    source_reference TEXT,
    superseded_by UUID REFERENCES public.load_events(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PLANNED MISSIONS: Prescription Record
CREATE TABLE IF NOT EXISTS public.planned_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    setting TEXT NOT NULL, -- 'gym', 'home', 'field', 'travel', 'other'
    level TEXT NOT NULL, -- 'foundation', 'competitive', 'elite'
    readiness INTEGER NOT NULL, -- 1-5
    rationale TEXT NOT NULL, -- Decision trail explaining why this volume/intensity was prescribed
    active_hypothesis_id TEXT, -- If explicitly testing a sequence hypothesis
    contract_milestone_ref TEXT, -- Linkage to overarching Season Contract milestone
    phases_json JSONB NOT NULL, -- WorkoutPhase[]
    total_estimated_minutes INTEGER NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COMPLETED SESSIONS: Execution Reality & Provenance
CREATE TABLE IF NOT EXISTS public.completed_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mission_id UUID REFERENCES public.planned_missions(id),
    date DATE NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_mins INTEGER,
    completed_exercises_json JSONB NOT NULL, -- CompletedExerciseRecord[]
    omitted_exercise_ids TEXT[] DEFAULT '{}',
    athlete_reflection_raw TEXT, -- Natural language reflection note
    athlete_reflection_structured JSONB, -- Parsed multi-dimensional feel vectors
    coach_observations TEXT,
    within_session_adaptations_json JSONB DEFAULT '[]', -- WithinSessionAdaptation[]
    tags TEXT[] DEFAULT '{}',

    -- Provenance & Audit fields
    record_source TEXT DEFAULT 'mission_completion', -- 'historical_dossier', 'athlete_track_manual', 'mission_completion', 'conversational_import'
    date_confidence TEXT DEFAULT 'EXACT', -- 'EXACT', 'RECONSTRUCTED', 'DATE_UNCERTAIN'
    completion_confidence TEXT DEFAULT 'EXACT', -- 'EXACT', 'RECONSTRUCTED', 'PARTIAL_UNCONFIRMED', 'UNKNOWN'
    source_reference TEXT,
    superseded_by UUID REFERENCES public.completed_sessions(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ATHLETE DECISIONS: Autoregulation and Intentional Adjustments
CREATE TABLE IF NOT EXISTS public.athlete_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id UUID REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_title TEXT NOT NULL,
    prescribed_load TEXT,
    actual_load TEXT,
    progression_status TEXT NOT NULL, -- 'progressed', 'maintained', 'intentionally_held', 'attempted_failed', 'reduced_for_readiness', 'reduced_for_fatigue', 'reduced_for_pain', 'reduced_for_schedule', 'technique_limited', 'equipment_limited', 'athlete_modified', 'omitted'
    athlete_reason TEXT, -- e.g. "didn't chase 70 on incline, preserved reserve before ice"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_load_events_user_date ON public.load_events(user_id, start_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_planned_missions_user_date ON public.planned_missions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_completed_sessions_user_date ON public.completed_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_decisions_session ON public.athlete_decisions(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.load_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_decisions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow access to own rows or dev-bypass user)
CREATE POLICY "Users can manage own load events" ON public.load_events
    FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Users can manage own planned missions" ON public.planned_missions
    FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Users can manage own completed sessions" ON public.completed_sessions
    FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);

CREATE POLICY "Users can manage own athlete decisions" ON public.athlete_decisions
    FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid);
