-- V11 Hardened Performance Index & Protocol Session Atomic Pipeline
-- Ensures row-level locking, prevents race conditions, and guarantees strict chain continuity

-- 1. Ensure Realtime Publication includes performance_index_snapshots and protocol_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'performance_index_snapshots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_index_snapshots;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'protocol_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.protocol_sessions;
    END IF;
END $$;

-- 2. Atomic RPC Function with Row Locking
CREATE OR REPLACE FUNCTION public.log_protocol_session_and_sync_pi(
    p_template_id TEXT,
    p_session_type TEXT,
    p_duration_mins INTEGER,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_roster_id UUID;
    v_protocol_id UUID;
    v_new_snap_id UUID;
    v_last_score_after INTEGER;
    v_score_before INTEGER;
    v_score_after INTEGER;
    v_score_delta NUMERIC;
    
    v_saves BIGINT := 0;
    v_total_shots BIGINT := 0;
    v_sv_pct NUMERIC := 0.900;
    
    v_soreness NUMERIC := 5.0;
    v_sleep NUMERIC := 7.0;
    v_active_days BIGINT := 1;
    v_streak_raw NUMERIC := 12.0;
    v_readiness_stats_raw NUMERIC := 60.0;
    
    v_stability_raw NUMERIC := 80.0;
    v_execution_raw NUMERIC := 60.0;
    v_readiness_raw NUMERIC := 70.0;
    
    v_raw_weighted NUMERIC := 75.0;
    v_is_pro BOOLEAN := FALSE;
    v_exponent NUMERIC := 1.0;
BEGIN
    -- 1. Security check: Must be authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: auth.uid() is null');
    END IF;

    -- 2. Resolve roster linkage if exists
    SELECT id, is_pro INTO v_roster_id, v_is_pro
    FROM public.roster_uploads
    WHERE linked_user_id = v_user_id
    LIMIT 1;

    -- 3. Insert protocol session
    INSERT INTO public.protocol_sessions (
        user_id,
        roster_id,
        template_id,
        status,
        started_at,
        completed_at,
        metadata
    ) VALUES (
        v_user_id,
        v_roster_id,
        p_template_id,
        'complete',
        NOW() - (COALESCE(p_duration_mins, 30) || ' minutes')::INTERVAL,
        NOW(),
        COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'duration_mins', COALESCE(p_duration_mins, 30),
            'session_type', COALESCE(p_session_type, 'off_ice')
        )
    ) RETURNING id INTO v_protocol_id;

    -- 4. Lock latest snapshot for this user (Concurrency Control / Zero Forking)
    SELECT score_after INTO v_last_score_after
    FROM public.performance_index_snapshots
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    -- 5. Calculate Stability (50% weight - Shot Save %)
    SELECT 
        COUNT(*) FILTER (WHERE result IN ('save', 'clear')),
        COUNT(*)
    INTO v_saves, v_total_shots
    FROM public.shot_events
    WHERE goalie_id = v_user_id;

    IF v_total_shots > 0 THEN
        v_sv_pct := (v_saves::NUMERIC / v_total_shots::NUMERIC);
    ELSE
        v_sv_pct := 0.900;
    END IF;
    v_stability_raw := LEAST(100.0, (v_sv_pct / 0.95) * 100.0);

    -- 6. Calculate Execution (30% weight - Capped Active Protocol Days in last 30d)
    -- Anti-Spam Protection: Count unique active training days rather than raw clicks
    SELECT COUNT(DISTINCT DATE_TRUNC('day', completed_at)) * 10 + 50
    INTO v_execution_raw
    FROM public.protocol_sessions
    WHERE user_id = v_user_id 
      AND status = 'complete' 
      AND completed_at >= NOW() - INTERVAL '30 days';

    v_execution_raw := LEAST(100.0, GREATEST(50.0, COALESCE(v_execution_raw, 60.0)));

    -- 7. Calculate Readiness (20% weight - Physical Soreness + Sleep + Consistency)
    SELECT soreness, sleep_quality 
    INTO v_soreness, v_sleep
    FROM public.reflections
    WHERE author_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    v_soreness := COALESCE(v_soreness, 5.0);
    v_sleep := COALESCE(v_sleep, 7.0);

    SELECT COUNT(DISTINCT DATE_TRUNC('day', completed_at))
    INTO v_active_days
    FROM public.protocol_sessions
    WHERE user_id = v_user_id 
      AND status = 'complete' 
      AND completed_at >= NOW() - INTERVAL '14 days';

    v_streak_raw := LEAST(100.0, GREATEST(1, COALESCE(v_active_days, 1)) * 12.0);
    v_readiness_stats_raw := ((10.0 - v_soreness) * 5.0) + (v_sleep * 5.0);
    v_readiness_raw := (v_streak_raw * 0.6) + (v_readiness_stats_raw * 0.4);

    -- 8. Apply Adaptive Formula & Exponent
    v_raw_weighted := (v_stability_raw * 0.5) + (v_execution_raw * 0.3) + (v_readiness_raw * 0.2);
    v_exponent := CASE WHEN COALESCE(v_is_pro, false) THEN 1.8 ELSE 1.0 END;
    v_score_after := ROUND(100.0 * POWER(v_raw_weighted / 100.0, v_exponent));

    -- Strict Chain Rule: score_before MUST equal previous score_after
    v_score_before := COALESCE(v_last_score_after, 72);
    v_score_delta := v_score_after - v_score_before;

    -- 9. Insert new snapshot
    INSERT INTO public.performance_index_snapshots (
        user_id,
        roster_id,
        source_type,
        source_id,
        score_before,
        score_after,
        score_delta,
        stability_score,
        execution_score,
        readiness_score,
        summary_label,
        summary_reason,
        ruleset_version,
        metadata
    ) VALUES (
        v_user_id,
        v_roster_id,
        'protocol_session',
        v_protocol_id,
        v_score_before,
        v_score_after,
        v_score_delta,
        ROUND(v_stability_raw),
        ROUND(v_execution_raw),
        ROUND(v_readiness_raw),
        COALESCE(p_metadata->>'title', 'Training Completed'),
        'Recalculated after ' || COALESCE(p_session_type, 'workout') || ' session',
        'v1.1',
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_new_snap_id;

    RETURN jsonb_build_object(
        'success', true,
        'protocol_id', v_protocol_id,
        'snapshot_id', v_new_snap_id,
        'score_before', v_score_before,
        'score_after', v_score_after,
        'score_delta', v_score_delta,
        'stability_score', ROUND(v_stability_raw),
        'execution_score', ROUND(v_execution_raw),
        'readiness_score', ROUND(v_readiness_raw)
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.log_protocol_session_and_sync_pi(TEXT, TEXT, INTEGER, JSONB) TO authenticated;
