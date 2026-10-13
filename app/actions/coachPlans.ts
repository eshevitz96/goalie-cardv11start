"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { verifyCoachAuthorization } from "@/app/training/book/actions";
import { PlanGenerationRuleChecks, GeneratedPlanPhase } from "@/app/actions/planGeneration";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface CoachPendingPlanItem {
    id: string;
    user_id: string;
    goal_id: string;
    status: string;
    source: string;
    created_at: string;
    updated_at: string;
    inputs: any;
    generation: {
        status?: string;
        message?: string;
        rule_checks?: PlanGenerationRuleChecks;
        phases?: GeneratedPlanPhase[];
        total_sessions?: number;
        generated_at?: string;
    } | null;
    athlete: {
        id: string;
        goalie_name: string;
        email: string;
        sport?: string;
        catch_hand?: string;
        grad_year?: string | number;
    };
    goal: {
        id: string;
        summit: string;
        sport: string;
        target_date: string | null;
        rungs: Array<{ title: string; order: number; status: string }>;
    } | null;
    sessionCount: number;
}

/**
 * Fetches all training plans pending coach approval
 */
export async function fetchPendingTrainingPlans(): Promise<{
    success: boolean;
    plans: CoachPendingPlanItem[];
    error?: string;
}> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, plans: [], error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Query plans pending approval (or generated drafts)
        const { data: plansData, error: plansErr } = await supabaseAdmin
            .from('training_plans')
            .select('*')
            .in('status', ['pending_approval', 'draft'])
            .order('created_at', { ascending: false });

        if (plansErr) {
            console.error("[fetchPendingTrainingPlans] Error:", plansErr);
            return { success: false, plans: [], error: plansErr.message };
        }

        if (!plansData || plansData.length === 0) {
            return { success: true, plans: [] };
        }

        const userIds = Array.from(new Set(plansData.map(p => p.user_id).filter(Boolean)));
        const goalIds = Array.from(new Set(plansData.map(p => p.goal_id).filter(Boolean)));
        const planIds = plansData.map(p => p.id);

        // 2. Fetch profiles
        const { data: profilesData } = await supabaseAdmin
            .from('profiles')
            .select('id, goalie_name, display_name, first_name, last_name, email, primary_sport, sport, handedness, grad_year')
            .in('id', userIds);

        const profileMap = new Map((profilesData || []).map(p => [p.id, p]));

        // 3. Fetch goals
        const { data: goalsData } = await supabaseAdmin
            .from('training_goals')
            .select('*')
            .in('id', goalIds);

        const goalMap = new Map((goalsData || []).map(g => [g.id, g]));

        // 4. Fetch session counts
        const { data: sessionsData } = await supabaseAdmin
            .from('plan_sessions')
            .select('plan_id');

        const sessionCountMap: Record<string, number> = {};
        for (const s of (sessionsData || [])) {
            sessionCountMap[s.plan_id] = (sessionCountMap[s.plan_id] || 0) + 1;
        }

        const result: CoachPendingPlanItem[] = plansData.map(p => {
            const prof = profileMap.get(p.user_id);
            const goal = goalMap.get(p.goal_id);
            const athleteName = prof?.goalie_name || 
                (prof?.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : null) || 
                prof?.display_name || 
                prof?.email?.split('@')[0] || 
                "Athlete";

            return {
                id: p.id,
                user_id: p.user_id,
                goal_id: p.goal_id,
                status: p.status,
                source: p.source,
                created_at: p.created_at,
                updated_at: p.updated_at,
                inputs: p.inputs,
                generation: p.generation,
                athlete: {
                    id: p.user_id,
                    goalie_name: athleteName,
                    email: prof?.email || "",
                    sport: prof?.primary_sport || prof?.sport || "hockey",
                    catch_hand: prof?.handedness || "Left",
                    grad_year: prof?.grad_year || ""
                },
                goal: goal ? {
                    id: goal.id,
                    summit: goal.summit,
                    sport: goal.sport,
                    target_date: goal.target_date,
                    rungs: goal.rungs || []
                } : null,
                sessionCount: sessionCountMap[p.id] || 0
            };
        });

        return { success: true, plans: result };
    } catch (err: any) {
        console.error("[fetchPendingTrainingPlans] Unexpected error:", err);
        return { success: false, plans: [], error: err.message };
    }
}

/**
 * Coach approves and activates a training plan
 */
export async function approveTrainingPlanAction(planId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const serverSupabase = await createServerSupabase();
    const { data: { user }, error: authErr } = await serverSupabase.auth.getUser();
    if (!user) {
        console.error("[approveTrainingPlanAction] Unauthorized: No active auth session.", { planId, authErr });
        return { success: false, error: "Unauthorized: Sign in required (no active session found). Please refresh and sign in as Coach." };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error: profErr } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

    if (profErr || !profile) {
        console.error("[approveTrainingPlanAction] Profile lookup failed:", { planId, userId: user.id, email: user.email, profErr });
        return { success: false, error: `Unauthorized: Profile not found for ${user.email || user.id}.` };
    }

    // Security check: ONLY check profiles.role in ('coach', 'admin'); auth user email fallback only
    const role = profile.role;
    const isCoachOrAdmin = role === 'coach' || role === 'admin' || user.email === 'eshevitz96@gmail.com';

    if (!isCoachOrAdmin) {
        console.error("[approveTrainingPlanAction] Role check rejected:", { planId, userId: user.id, email: user.email, role });
        return {
            success: false,
            error: `Unauthorized (currently signed in as ${user.email || 'unknown'}, role: ${role || 'none'}): Only coach or admin accounts can approve training plans. Please sign in as eshevitz96@gmail.com.`
        };
    }

    try {
        // 1. Fetch target plan to get athlete user_id
        const { data: targetPlan, error: targetErr } = await supabaseAdmin
            .from('training_plans')
            .select('id, user_id, status')
            .eq('id', planId)
            .single();

        if (targetErr || !targetPlan) {
            console.error("[approveTrainingPlanAction] Target plan not found:", { planId, targetErr });
            return { success: false, error: `Training plan not found (${targetErr?.message || planId}).` };
        }

        // 2. Archive any existing active plans for this athlete
        const { error: archiveErr } = await supabaseAdmin
            .from('training_plans')
            .update({
                status: 'archived',
                updated_at: new Date().toISOString()
            })
            .eq('user_id', targetPlan.user_id)
            .eq('status', 'active')
            .neq('id', planId);

        if (archiveErr) {
            console.warn("[approveTrainingPlanAction] Warning archiving previous plans:", archiveErr);
        }

        // 3. Activate the newly approved plan and verify the updated row
        const nowIso = new Date().toISOString();
        const { data: updatedPlan, error } = await supabaseAdmin
            .from('training_plans')
            .update({
                status: 'active',
                approved_by: user.id,
                approved_at: nowIso,
                updated_at: nowIso
            })
            .eq('id', planId)
            .select('id, status, approved_by, approved_at')
            .maybeSingle();

        if (error) {
            console.error("[approveTrainingPlanAction] Database update error:", { planId, error });
            return { success: false, error: error.message };
        }

        if (!updatedPlan || updatedPlan.status !== 'active') {
            console.error("[approveTrainingPlanAction] Update did not activate plan:", { planId, updatedPlan });
            return { success: false, error: "Plan approval failed: database row was not updated to active." };
        }

        console.info("[approveTrainingPlanAction] Plan approved:", {
            planId: updatedPlan.id,
            approvedBy: updatedPlan.approved_by,
            approvedAt: updatedPlan.approved_at
        });

        return { success: true };
    } catch (err: any) {
        console.error("[approveTrainingPlanAction] Unexpected error:", err);
        return { success: false, error: err.message || "Unexpected server error while approving plan." };
    }
}

/**
 * Coach rejects / requests revisions on a plan
 */
export async function rejectTrainingPlanAction(planId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('training_plans')
            .update({
                status: 'draft',
                approved_by: null,
                approved_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', planId);

        if (error) {
            console.error("[rejectTrainingPlanAction] Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[rejectTrainingPlanAction] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
