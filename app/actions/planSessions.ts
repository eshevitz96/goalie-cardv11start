"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerAuthClient } from "@/utils/supabase/server";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function logPlanSessionAction(sessionId: string, reflection?: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const supabaseAuth = await createServerAuthClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
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
        if (session.user_id !== user.id && user.email !== 'elliott@goaliecard.com' && !user.email?.includes('admin')) {
            return { success: false, error: "Unauthorized access to this session." };
        }

        // 2. Create a row in training_sessions (athlete's activity log)
        const notesObj = {
            directive: session.directive,
            blocks: session.blocks,
            reflection: reflection || "Completed scheduled training plan workout."
        };

        const { data: loggedSession, error: logErr } = await supabaseAdmin
            .from('training_sessions')
            .insert({
                user_id: session.user_id,
                session_date: session.scheduled_date,
                title: session.title,
                training_type: session.training_type === 'reaction' ? 'other' : session.training_type,
                notes_summary: session.directive,
                notes: JSON.stringify(notesObj),
                duration_minutes: 45
            })
            .select('id')
            .single();

        if (logErr) {
            console.error("[logPlanSessionAction] Error inserting training_session:", logErr);
        }

        // 3. Mark plan_session as done
        const { error: updateErr } = await supabaseAdmin
            .from('plan_sessions')
            .update({
                status: 'done',
                log_id: loggedSession?.id || null
            })
            .eq('id', sessionId);

        if (updateErr) {
            return { success: false, error: updateErr.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[logPlanSessionAction] Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
