-- ============================================================================
-- COACH CARD DECISION ENGINE & MISSION REVISIONS MIGRATION (PHASE 3)
-- Date: 2026-09-16
-- ============================================================================

-- 1. Mission Revisions Table (Immutability Chain)
create table if not exists public.mission_revisions (
    id text primary key default gen_random_uuid()::text,
    original_mission_id text not null,
    revision_number integer not null default 1,
    trigger text not null, -- 'warmup_reassessment', 'safety_gate_symptom', 'athlete_modification', 'schedule_shift', 'coach_override'
    timestamp timestamptz not null default now(),
    previous_phases_json jsonb not null default '[]'::jsonb,
    revised_phases_json jsonb not null default '[]'::jsonb,
    revised_objective text,
    rationale text not null,
    athlete_state_before_json jsonb not null default '{}'::jsonb,
    athlete_state_after_json jsonb default null,
    decision_audit_ref text default null,
    created_at timestamptz default now()
);

-- Index for fast lookup by original mission
create index if not exists idx_mission_revisions_original_mission on public.mission_revisions(original_mission_id);

-- 2. Extend Planned Missions Table
alter table public.planned_missions 
add column if not exists objective text default 'MAINTAIN_CAPACITY',
add column if not exists is_rest_day boolean default false,
add column if not exists explanation_json jsonb default null,
add column if not exists audit_trail_json jsonb default null;

-- 3. Extend Completed Sessions Table
alter table public.completed_sessions
add column if not exists mission_objective text default null,
add column if not exists athlete_override_json jsonb default null,
add column if not exists decision_audit_ref text default null;

-- 4. Enable RLS
alter table public.mission_revisions enable row level security;

create policy "Users can view their own mission revisions"
    on public.mission_revisions for select
    using (true);

create policy "Users can insert their own mission revisions"
    on public.mission_revisions for insert
    with check (true);
