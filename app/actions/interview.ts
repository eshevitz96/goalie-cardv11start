"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

export interface GoalRungItem {
    id?: string;
    order?: number;
    title: string;
    status?: 'active' | 'pending' | 'completed';
}

export interface InterviewGoalData {
    summit: string;
    current_level: string;
    target_date: string;
    obstacles: string;
    rungs: GoalRungItem[];
}

export interface InterviewPlanInputs {
    sport: 'hockey' | 'lacrosse' | string;
    catch_hand: string;
    days_available: string[];
    session_length: number; // 30, 45, 60, 90
    team_practice_days: string[];
    team_game_days: string[];
    team_schedule_varies?: boolean;
    access_equipment: string[];
    notes_workaround?: string;
    share_with_coach?: boolean;
}

/**
 * Checks interview eligibility:
 * - Must be a private training client (matched in private_training_submissions or stripe_customer_id)
 * - Returns whether interview has already been completed
 * - Returns initial profile data for prefilling
 */
export async function checkInterviewStatus(): Promise<{
    isPrivateClient: boolean;
    isCompleted: boolean;
    profile: {
        sport: string;
        catch_hand: string;
        grad_year: string | number | null;
        date_of_birth: string | null;
    } | null;
}> {
    try {
        const isInterviewEnabled = 
            process.env.NEXT_PUBLIC_TRAINING_INTERVIEW_ENABLED === 'true' || 
            process.env.TRAINING_INTERVIEW_ENABLED === 'true';

        if (!isInterviewEnabled) {
            return { isPrivateClient: false, isCompleted: true, profile: null };
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email) {
            return { isPrivateClient: false, isCompleted: false, profile: null };
        }

        const userEmail = user.email.toLowerCase().trim();
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Check private_training_submissions match
        const { data: submission } = await supabaseAdmin
            .from('private_training_submissions')
            .select('id')
            .or(`email.ilike.${userEmail},guardian_email.ilike.${userEmail}`)
            .limit(1)
            .maybeSingle();

        // 2. Fetch profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('onboarding_completed_at, onboarding_completed, primary_sport, sport, handedness, grad_year, date_of_birth, stripe_customer_id')
            .eq('id', user.id)
            .maybeSingle();

        const isPrivate = Boolean(submission || profile?.stripe_customer_id);
        const isCompleted = Boolean(profile?.onboarding_completed_at || profile?.onboarding_completed);

        return {
            isPrivateClient: isPrivate,
            isCompleted: isCompleted,
            profile: {
                sport: profile?.primary_sport || profile?.sport || 'hockey',
                catch_hand: profile?.handedness || 'Left',
                grad_year: profile?.grad_year || null,
                date_of_birth: profile?.date_of_birth || null
            }
        };
    } catch (err) {
        console.error("[checkInterviewStatus] Error:", err);
        return { isPrivateClient: false, isCompleted: false, profile: null };
    }
}

/**
 * Helper to derive age band from date_of_birth or grad_year
 */
export async function deriveAgeBand(dob: string | null, gradYear: string | number | null): Promise<'under-14' | '14-17' | '18+'> {
    const currentYear = new Date().getFullYear();

    if (dob) {
        const birthDate = new Date(dob);
        if (!isNaN(birthDate.getTime())) {
            const age = currentYear - birthDate.getFullYear();
            if (age < 14) return 'under-14';
            if (age <= 17) return '14-17';
            return '18+';
        }
    }

    if (gradYear) {
        const gy = typeof gradYear === 'string' ? parseInt(gradYear, 10) : gradYear;
        if (!isNaN(gy)) {
            const yearsUntilGrad = gy - currentYear;
            if (yearsUntilGrad >= 5) return 'under-14';
            if (yearsUntilGrad >= 0) return '14-17';
            return '18+';
        }
    }

    return '14-17';
}

/**
 * Saves interview responses:
 * 1. Idempotently writes/updates training_goals (1 active goal per goalie)
 * 2. Idempotently writes/updates training_plans (storing all inputs, source='generated')
 * 3. Sets shared_with_coach = Boolean(share_with_coach) (default false)
 * 4. Sets profiles.onboarding_completed_at and onboarding_completed = true
 * 5. NEVER writes athlete_profiles
 */
export async function saveInterviewAction({
    goalData,
    planInputs
}: {
    goalData: InterviewGoalData;
    planInputs: InterviewPlanInputs;
}): Promise<{
    success: boolean;
    goalId?: string;
    planId?: string;
    error?: string;
}> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const supabaseAdmin = getSupabaseAdmin();
        const shareWithCoach = Boolean(planInputs.share_with_coach);

        // 1. Fetch user profile to derive age band
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('date_of_birth, grad_year')
            .eq('id', user.id)
            .maybeSingle();

        const derivedAgeBand = await deriveAgeBand(profile?.date_of_birth || null, profile?.grad_year || null);

        // 2. Format rungs
        const formattedRungs = (goalData.rungs || []).map((r, idx) => ({
            title: typeof r === 'string' ? r : r.title,
            status: 'active',
            order: idx + 1
        }));

        // 3. IDEMPOTENT write to training_goals (1 active goal per goalie)
        const { data: existingGoal } = await supabaseAdmin
            .from('training_goals')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let targetGoalId: string;

        if (existingGoal) {
            const { data: updatedGoal, error: updateGoalErr } = await supabaseAdmin
                .from('training_goals')
                .update({
                    summit: goalData.summit.trim(),
                    sport: planInputs.sport || 'hockey',
                    target_date: goalData.target_date ? new Date(goalData.target_date).toISOString().split('T')[0] : null,
                    rungs: formattedRungs,
                    shared_with_coach: shareWithCoach,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingGoal.id)
                .select('id')
                .single();

            if (updateGoalErr) {
                console.error("[saveInterviewAction] Error updating training_goals:", updateGoalErr);
                return { success: false, error: updateGoalErr.message };
            }
            targetGoalId = updatedGoal.id;
        } else {
            const { data: insertedGoal, error: insertGoalErr } = await supabaseAdmin
                .from('training_goals')
                .insert({
                    user_id: user.id,
                    summit: goalData.summit.trim(),
                    sport: planInputs.sport || 'hockey',
                    target_date: goalData.target_date ? new Date(goalData.target_date).toISOString().split('T')[0] : null,
                    rungs: formattedRungs,
                    status: 'active',
                    shared_with_coach: shareWithCoach
                })
                .select('id')
                .single();

            if (insertGoalErr) {
                console.error("[saveInterviewAction] Error inserting training_goals:", insertGoalErr);
                return { success: false, error: insertGoalErr.message };
            }
            targetGoalId = insertedGoal.id;
        }

        // 4. IDEMPOTENT write to training_plans (source = 'generated')
        const planInputsPayload = {
            current_level: goalData.current_level,
            obstacles: goalData.obstacles,
            target_date: goalData.target_date,
            sport: planInputs.sport,
            catch_hand: planInputs.catch_hand,
            days_available: planInputs.days_available,
            session_length: planInputs.session_length,
            team_practice_days: planInputs.team_practice_days,
            team_game_days: planInputs.team_game_days,
            team_schedule_varies: Boolean(planInputs.team_schedule_varies),
            access_equipment: planInputs.access_equipment,
            notes_workaround: planInputs.notes_workaround ? planInputs.notes_workaround.trim() : null,
            derived_age_band: derivedAgeBand
        };

        const { data: existingPlan } = await supabaseAdmin
            .from('training_plans')
            .select('id')
            .eq('user_id', user.id)
            .in('status', ['draft', 'pending_approval'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let targetPlanId: string;

        if (existingPlan) {
            const { data: updatedPlan, error: updatePlanErr } = await supabaseAdmin
                .from('training_plans')
                .update({
                    goal_id: targetGoalId,
                    source: 'generated',
                    status: 'draft',
                    inputs: planInputsPayload,
                    shared_with_coach: shareWithCoach,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingPlan.id)
                .select('id')
                .single();

            if (updatePlanErr) {
                console.error("[saveInterviewAction] Error updating training_plans:", updatePlanErr);
                return { success: false, error: updatePlanErr.message };
            }
            targetPlanId = updatedPlan.id;
        } else {
            const { data: insertedPlan, error: insertPlanErr } = await supabaseAdmin
                .from('training_plans')
                .insert({
                    user_id: user.id,
                    goal_id: targetGoalId,
                    source: 'generated',
                    status: 'draft',
                    start_date: new Date().toISOString().split('T')[0],
                    phases: [],
                    inputs: planInputsPayload,
                    shared_with_coach: shareWithCoach
                })
                .select('id')
                .single();

            if (insertPlanErr) {
                console.error("[saveInterviewAction] Error creating training_plans:", insertPlanErr);
                return { success: false, error: insertPlanErr.message };
            }
            targetPlanId = insertedPlan.id;
        }

        // 5. Update profiles table
        const profileUpdates: any = {
            onboarding_completed_at: new Date().toISOString(),
            onboarding_completed: true
        };

        if (planInputs.sport) {
            profileUpdates.primary_sport = planInputs.sport;
        }
        if (planInputs.catch_hand) {
            profileUpdates.handedness = planInputs.catch_hand;
        }

        await supabaseAdmin
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id);

        return {
            success: true,
            goalId: targetGoalId,
            planId: targetPlanId
        };
    } catch (err: any) {
        console.error("[saveInterviewAction] Unexpected error:", err);
        return { success: false, error: err.message || "Failed to save training interview" };
    }
}
