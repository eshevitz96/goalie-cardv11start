"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

export interface LogWorkoutParams {
    sessionType: 'private' | 'team' | 'wall_ball' | 'footwork' | 'reaction' | 'film' | 'other' | 'coach_mission';
    durationMins: number;
    title: string;
    notes?: string;
    sessionDate?: string;
    userId?: string | null;
    userEmail?: string | null;
    reflection?: {
        win?: string;
        tightness?: string;
    };
}

export async function saveTrainingSession(payload: LogWorkoutParams) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        let authUserId: string | null = null;
        let publicUserId: string | null = null;

        // 1. Check server session cookie first
        try {
            const serverSupabase = await createClient();
            const { data: { user } } = await serverSupabase.auth.getUser();
            if (user?.id) {
                authUserId = user.id;
            }
        } catch (e) {
            // Cookie read fallback
        }

        // 2. Resolve public.users record
        let userRecord = null;
        if (authUserId) {
            const { data } = await supabaseAdmin
                .from('users')
                .select('id, email, auth_user_id')
                .eq('auth_user_id', authUserId)
                .maybeSingle();
            userRecord = data;
        }

        if (!userRecord && payload.userId && payload.userId !== '00000000-0000-0000-0000-000000000000') {
            const { data } = await supabaseAdmin
                .from('users')
                .select('id, email, auth_user_id')
                .or(`id.eq.${payload.userId},auth_user_id.eq.${payload.userId}`)
                .maybeSingle();
            userRecord = data;
        }

        if (!userRecord && payload.userEmail) {
            const { data } = await supabaseAdmin
                .from('users')
                .select('id, email, auth_user_id')
                .ilike('email', payload.userEmail.trim())
                .maybeSingle();
            userRecord = data;
        }

        // Dev mode fallback
        if (!userRecord && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_BYPASS === 'true')) {
            const { data } = await supabaseAdmin
                .from('users')
                .select('id, email, auth_user_id')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            userRecord = data;
        }

        if (!userRecord) {
            return { success: false, error: "Unauthorized: User session required." };
        }

        publicUserId = userRecord.id;
        authUserId = userRecord.auth_user_id || userRecord.id;


        // 3. Fetch Roster & Context
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, is_pro')
            .or(`linked_user_id.eq.${authUserId},linked_user_id.eq.${publicUserId}`)
            .maybeSingle();

        const { data: reflection } = await supabaseAdmin
            .from('reflections')
            .select('soreness, sleep_quality')
            .or(`author_id.eq.${authUserId},author_id.eq.${publicUserId},goalie_id.eq.${authUserId},goalie_id.eq.${publicUserId}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const { data: shots } = await supabaseAdmin
            .from('shot_events')
            .select('result')
            .or(`goalie_id.eq.${authUserId},goalie_id.eq.${publicUserId}`);

        // 4. Insert into training_sessions table
        const sessionDate = payload.sessionDate || new Date().toISOString().slice(0, 10);
        const notesSummary = [
            payload.notes,
            payload.reflection?.win ? `Win: ${payload.reflection.win}` : '',
            payload.reflection?.tightness ? `Tightness/Recovery: ${payload.reflection.tightness}` : ''
        ].filter(Boolean).join('\n');

        const { data: insertedSession, error: sessionError } = await supabaseAdmin
            .from('training_sessions')
            .insert({
                user_id: publicUserId,
                session_date: sessionDate,
                training_type: payload.sessionType || 'other',
                title: payload.title || 'Goalie Training Session',
                status: 'complete',
                duration_minutes: payload.durationMins || 45,
                notes_summary: notesSummary
            })
            .select('*')
            .single();

        if (sessionError) {
            console.error("[saveTrainingSession] Insert error:", sessionError);
            throw sessionError;
        }

        // 5. Calculate Dimensions (Stability, Execution, Readiness)
        // Stability (50%) - Shot Save %
        const saves = shots?.filter(s => s.result === 'save' || s.result === 'clear').length || 0;
        const totalShots = shots?.length || 0;
        const svPct = totalShots > 0 ? (saves / totalShots) : 0.910;
        const stabilityRaw = Math.min(100, (svPct / 0.95) * 100);

        // Execution (30%) - Anti-spam: Active training days in last 30d
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const { data: recentSessions } = await supabaseAdmin
            .from('training_sessions')
            .select('session_date')
            .eq('user_id', publicUserId)
            .eq('status', 'complete')
            .gte('session_date', thirtyDaysAgo);

        const uniqueDays = new Set((recentSessions || []).map(s => s.session_date));
        const activeDaysCount = Math.max(1, uniqueDays.size);
        const executionRaw = Math.min(100, Math.max(50, activeDaysCount * 5 + 50));

        // Readiness (20%) - Physical soreness, sleep, consistency
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const { data: fortnightSessions } = await supabaseAdmin
            .from('training_sessions')
            .select('session_date')
            .eq('user_id', publicUserId)
            .eq('status', 'complete')
            .gte('session_date', fourteenDaysAgo);

        const fortnightDays = new Set((fortnightSessions || []).map(s => s.session_date)).size;
        const streakRaw = Math.min(100, Math.max(1, fortnightDays) * 10);
        
        const soreness = reflection?.soreness || 5;
        const sleep = reflection?.sleep_quality || 7;
        const readinessStatsRaw = ((10 - soreness) * 5) + (sleep * 5);
        const readinessRaw = Math.min(100, (streakRaw * 0.5) + (readinessStatsRaw * 0.5));

        // 6. Apply Exponent & Compute Total
        const isPro = roster?.is_pro ?? false;
        const difficultyExponent = isPro ? 1.8 : 1.0;
        const rawWeightedTotal = (stabilityRaw * 0.5) + (executionRaw * 0.3) + (readinessRaw * 0.2);
        const scoreAfter = Math.round(100 * Math.pow(rawWeightedTotal / 100, difficultyExponent));

        // 7. Strict Chain Rule: Read last snapshot
        const { data: lastSnapshot } = await supabaseAdmin
            .from('performance_index_snapshots')
            .select('score_after')
            .eq('user_id', publicUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const scoreBefore = lastSnapshot?.score_after ?? 72;
        const scoreDelta = parseFloat((scoreAfter - scoreBefore).toFixed(1));

        // 8. Insert new Snapshot
        const { data: newSnapshot, error: snapError } = await supabaseAdmin
            .from('performance_index_snapshots')
            .insert({
                user_id: publicUserId,
                source_type: 'training_session',
                source_id: insertedSession.id,
                score_before: scoreBefore,
                score_after: scoreAfter,
                score_delta: scoreDelta,
                stability_score: Math.round(stabilityRaw),
                execution_score: Math.round(executionRaw),
                readiness_score: Math.round(readinessRaw),
                summary_label: payload.title || 'Training Completed',
                summary_reason: `Logged ${payload.durationMins}m ${payload.sessionType} training session`,
                ruleset_version: 'v1.2-atomic'
            })
            .select('*')
            .single();

        if (snapError) {
            console.error("[saveTrainingSession] Snapshot insert error:", snapError);
            throw snapError;
        }

        return {
            success: true,
            sessionId: insertedSession.id,
            snapshot: newSnapshot,
            scoreBefore,
            scoreAfter,
            scoreDelta
        };

    } catch (err: any) {
        console.error("[saveTrainingSession] Fatal error:", err);
        return { success: false, error: err.message || "Failed to save workout session." };
    }
}
