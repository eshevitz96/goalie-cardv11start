"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { verifyCoachAuthorization } from "@/app/training/book/actions";

export interface FeedbackSubmission {
    id: string;
    user_id: string;
    kind: 'menu' | 'prompt';
    rating: number | null;
    body: string;
    page: string | null;
    created_at: string;
    user_name?: string;
    user_email?: string;
}

/**
 * Checks if the current logged-in user is an eligible private training beta client.
 * Eligible users have a matched row in private_training_submissions.
 */
export async function checkFeedbackEligibility(): Promise<{ eligible: boolean; totalCompletedSessions: number }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return { eligible: false, totalCompletedSessions: 0 };
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

        if (!submission) {
            return { eligible: false, totalCompletedSessions: 0 };
        }

        // 2. Query total completed training sessions
        const { count } = await supabaseAdmin
            .from('training_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'complete');

        return { eligible: true, totalCompletedSessions: count || 0 };
    } catch (err) {
        console.error("[checkFeedbackEligibility] Error:", err);
        return { eligible: false, totalCompletedSessions: 0 };
    }
}

/**
 * Submit beta feedback to the feedback table.
 */
export async function submitFeedback(params: {
    kind: 'menu' | 'prompt';
    rating?: number | null;
    body?: string;
    page?: string;
    screenshotUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "You must be signed in to submit feedback." };
        }

        const supabaseAdmin = getSupabaseAdmin();

        let finalBody = (params.body || '').trim();
        if (params.screenshotUrl) {
            finalBody = finalBody 
                ? `${finalBody}\n\n[Attachment: ${params.screenshotUrl}]`
                : `[Attachment: ${params.screenshotUrl}]`;
        }

        const { error } = await supabaseAdmin
            .from('feedback')
            .insert({
                user_id: user.id,
                kind: params.kind,
                rating: params.rating || null,
                body: finalBody,
                page: params.page || null,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error("[submitFeedback] Database error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[submitFeedback] Error:", err);
        return { success: false, error: err.message || "Failed to submit feedback." };
    }
}

/**
 * Fetch all submitted feedback for the coach view (gated to coaches/admins, sorted newest first).
 */
export async function getFeedbackForCoach(): Promise<{ success: boolean; feedback: FeedbackSubmission[]; error?: string }> {
    try {
        const auth = await verifyCoachAuthorization();
        if (!auth.isAuthorized) {
            return { success: false, feedback: [], error: "Unauthorized access" };
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch all feedback records newest first
        const { data: feedbackData, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .select('id, user_id, kind, rating, body, page, created_at')
            .order('created_at', { ascending: false });

        if (feedbackError) {
            console.error("[getFeedbackForCoach] Database error:", feedbackError);
            return { success: false, feedback: [], error: feedbackError.message };
        }

        if (!feedbackData || feedbackData.length === 0) {
            return { success: true, feedback: [] };
        }

        // 2. Fetch profiles for submitters
        const userIds = Array.from(new Set(feedbackData.map(f => f.user_id).filter(Boolean)));
        let profileMap: Record<string, { name: string; email: string }> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, display_name, first_name, last_name, email, goalie_name')
                .in('id', userIds);

            if (profiles) {
                profiles.forEach(p => {
                    const name = p.display_name || 
                        (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null) || 
                        p.goalie_name || 
                        p.email || 
                        'Athlete';
                    profileMap[p.id] = {
                        name,
                        email: p.email || ''
                    };
                });
            }
        }

        const enriched: FeedbackSubmission[] = feedbackData.map(f => ({
            ...f,
            user_name: profileMap[f.user_id]?.name || 'Client',
            user_email: profileMap[f.user_id]?.email || ''
        }));

        return { success: true, feedback: enriched };
    } catch (err: any) {
        console.error("[getFeedbackForCoach] Error:", err);
        return { success: false, feedback: [], error: err.message || "Failed to fetch feedback" };
    }
}
