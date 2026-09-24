-- ============================================================================
-- COACH CARD ATHLETE STATE SENSING SCHEMA (PHASE 2)
-- Version: 2026-09-16
--
-- Adds:
-- 1. Pre-session natural language state sensing with raw + structured vectors.
-- 2. Ambiguity and confirmation status logging.
-- 3. Post-session conversational reflections and within-session reassessment tracking.
-- ============================================================================

-- Add State Sensing and Confirmation fields to completed_sessions
ALTER TABLE public.completed_sessions
ADD COLUMN IF NOT EXISTS pre_session_state_raw TEXT,
ADD COLUMN IF NOT EXISTS pre_session_state_structured JSONB,
ADD COLUMN IF NOT EXISTS pre_session_confirmation_status TEXT DEFAULT 'unconfirmed', -- 'unconfirmed', 'athlete_confirmed', 'athlete_corrected'
ADD COLUMN IF NOT EXISTS post_session_reflection_raw TEXT,
ADD COLUMN IF NOT EXISTS post_session_reflection_structured JSONB,
ADD COLUMN IF NOT EXISTS post_session_confirmation_status TEXT DEFAULT 'unconfirmed',
ADD COLUMN IF NOT EXISTS within_session_reassessments_json JSONB DEFAULT '[]';

-- Add State Context to planned_missions
ALTER TABLE public.planned_missions
ADD COLUMN IF NOT EXISTS pre_session_state_raw TEXT,
ADD COLUMN IF NOT EXISTS pre_session_state_structured JSONB,
ADD COLUMN IF NOT EXISTS safety_gate_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warmup_reassessment_required BOOLEAN DEFAULT false;

-- Index for querying unconfirmed reflections or specific soreness behaviors
CREATE INDEX IF NOT EXISTS idx_completed_sessions_soreness 
ON public.completed_sessions USING gin ((pre_session_state_structured -> 'soreness'));
