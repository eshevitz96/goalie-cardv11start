"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Add credits to a goalie (called by admin when goalie pays for a month) */
export async function addCredits({
    rosterId,
    amount,
    description,
}: {
    rosterId: string;
    amount: number;
    description?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin.from('credit_transactions').insert({
            roster_id: rosterId,
            amount: Math.abs(amount),
            description: description || `${Math.abs(amount)} lesson credits added`,
        });
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/** Deduct 1 credit when a coach logs a lesson */
export async function logLessonCredit({
    rosterId,
    coachName,
    notes,
}: {
    rosterId: string;
    coachName?: string;
    notes?: string;
}): Promise<{ success: boolean; error?: string; newBalance?: number }> {
    try {
        // Check current balance first
        const { data: txs, error: fetchError } = await supabaseAdmin
            .from('credit_transactions')
            .select('amount')
            .eq('roster_id', rosterId);

        if (fetchError) throw fetchError;

        const balance = txs?.reduce((sum, t) => sum + t.amount, 0) || 0;
        if (balance <= 0) {
            return { success: false, error: "No credits remaining for this goalie." };
        }

        const { error } = await supabaseAdmin.from('credit_transactions').insert({
            roster_id: rosterId,
            amount: -1,
            description: coachName
                ? `Lesson logged by ${coachName}${notes ? ` — ${notes}` : ''}`
                : `Lesson logged${notes ? ` — ${notes}` : ''}`,
        });

        if (error) throw error;
        return { success: true, newBalance: balance - 1 };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/** Get current credit balance for a goalie */
export async function getCreditBalance(rosterId: string): Promise<number> {
    const { data } = await supabaseAdmin
        .from('credit_transactions')
        .select('amount')
        .eq('roster_id', rosterId);
    return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
}
