"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerAuthClient } from "@/utils/supabase/server";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface LogPlanSessionOptions {
    effort?: number;
    readiness?: number;
    reflection?: string;
}

export async function logPlanSessionAction(sessionId: string, options?: LogPlanSessionOptions): Promise<{
    success: boolean;
    error?: string;
    logId?: string;
}> {
    try {
        const supabaseAuth = await createServerAuthClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized: Sign in required." };
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch the plan session
        const { data: session, error: sessErr } = await supabaseAdmin
            .from('plan_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessErr || !session) {
            return { success: false, error: "Session not found." };
        }

        // Check ownership
        if (session.user_id !== user.id && user.email !== 'eshevitz96@gmail.com' && !user.email?.includes('admin')) {
            return { success: false, error: "Unauthorized access to this session." };
        }

        // Clamp effort (1-10) and readiness (1-10)
        const rawEffort = options?.effort !== undefined ? Number(options.effort) : 7;
        const effort = Math.max(1, Math.min(10, isNaN(rawEffort) ? 7 : Math.round(rawEffort)));

        let readiness: number | null = null;
        if (options?.readiness !== undefined && options.readiness !== null) {
            const rawReadiness = Number(options.readiness);
            readiness = Math.max(1, Math.min(10, isNaN(rawReadiness) ? 7 : Math.round(rawReadiness)));
        } else {
            readiness = 7;
        }

        // 2. Insert into training_sessions table
        const { data: loggedSession, error: logErr } = await supabaseAdmin
            .from('training_sessions')
            .insert({
                user_id: session.user_id,
                session_date: session.scheduled_date,
                training_type: session.training_type || 'strength',
                title: session.title,
                status: 'complete',
                plan_session_id: session.id,
                effort,
                readiness,
                notes_summary: session.directive,
                duration_minutes: 45
            })
            .select('id')
            .single();

        if (logErr || !loggedSession) {
            console.error("[logPlanSessionAction] Error inserting training_session:", logErr);
            return { success: false, error: logErr?.message || "Failed to create activity log." };
        }

        // 3. Mark plan_session as done and link log_id
        const { error: updateErr } = await supabaseAdmin
            .from('plan_sessions')
            .update({
                status: 'done',
                log_id: loggedSession.id
            })
            .eq('id', sessionId);

        if (updateErr) {
            console.error("[logPlanSessionAction] Error updating plan_session:", updateErr);
            return { success: false, error: updateErr.message };
        }

        return { success: true, logId: loggedSession.id };
    } catch (err: any) {
        console.error("[logPlanSessionAction] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
