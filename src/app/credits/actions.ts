"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

// Admin client for secure transactions
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getBalance(rosterId: string) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        // Try to call RPC first
        const { data, error } = await supabaseAdmin.rpc('get_goalie_balance', { target_roster_id: rosterId });

        if (error) {
            // Fallback: Calculate manually if RPC fails/doesn't exist yet
            console.warn("RPC get_goalie_balance failed, falling back to manual sum:", error.message);
            const { data: transactions, error: txError } = await supabaseAdmin
                .from('credit_transactions')
                .select('amount')
                .eq('roster_id', rosterId);

            if (txError) throw txError;

            const balance = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
            return { success: true, balance };
        }

        return { success: true, balance: data || 0 };
    } catch (err: any) {
        console.error("Get Balance Error:", err);
        return { success: false, error: err.message };
    }
}

export async function addCredits(rosterId: string, amount: number, paymentRef?: string) {
    if (!rosterId || amount <= 0) return { success: false, error: "Invalid parameters" };

    try {
        const { error } = await supabaseAdmin.from('credit_transactions').insert({
            roster_id: rosterId,
            amount: amount,
            description: `Purchased ${amount} Credits`,
            metadata: { payment_ref: paymentRef, source: 'web_stripe_sim' }
        });

        if (error) throw error;

        // Return new balance
        return await getBalance(rosterId);
    } catch (err: any) {
        console.error("Add Credits Error:", err);
        return { success: false, error: err.message };
    }
}

export async function deductCredit(rosterId: string, description: string) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        // 1. Check Balance
        const balanceResult = await getBalance(rosterId);
        if (!balanceResult.success) throw new Error(balanceResult.error);

        const currentBalance = balanceResult.balance;

        if (currentBalance < 1) {
            return { success: false, error: "Insufficient Credits. Please purchase more." };
        }

        // 2. Deduct
        const { error } = await supabaseAdmin.from('credit_transactions').insert({
            roster_id: rosterId,
            amount: -1,
            description: description || "Session Booking",
            metadata: { source: 'web_scheduling' }
        });

        if (error) throw error;

        return { success: true };

    } catch (err: any) {
        console.error("Deduct Credit Error:", err);
        return { success: false, error: err.message };
    }
}

export async function processScheduleRequest(requestId: string, action: 'confirmed' | 'declined', coachNote?: string) {
    if (!requestId || !action) return { success: false, error: "Invalid parameters" };

    try {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Unauthorized" };

        // 1. Fetch Request Details (need goalie_id to refund)
        const { data: req, error: reqError } = await supabaseAdmin
            .from('schedule_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (reqError || !req) throw new Error("Request not found");

        // 2. Perform Update
        const { error: updateError } = await supabaseAdmin
            .from('schedule_requests')
            .update({
                status: action,
                // updated_by: user.id (if column exists)
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // 3. Handle Credits
        if (action === 'declined') {
            // AUTOMATIC REFUND (Use addCredits internal logic or direct insert)
            // We'll insert a refund transaction directly to be safe
            await supabaseAdmin.from('credit_transactions').insert({
                roster_id: req.goalie_id,
                amount: 1,
                description: `Refund: Request Declined by Coach`,
                metadata: { source: 'auto_refund', request_id: requestId }
            });

        } else if (action === 'confirmed') {
            // MARK SLOT BOOKED
            if (req.slot_id) {
                await supabaseAdmin
                    .from('coach_availability')
                    .update({ is_booked: true })
                    .eq('id', req.slot_id);
            }
        }

        return { success: true };

    } catch (err: any) {
        console.error("Process Request Error:", err);
        return { success: false, error: err.message };
    }
}

export async function unlockAnalysis(rosterId: string, eventId: string) {
    if (!rosterId || !eventId) return { success: false, error: "Invalid parameters" };

    try {
        // 1. Check Balance
        const { balance, success: balSuccess, error: balError } = await getBalance(rosterId);
        if (!balSuccess) throw new Error(balError);

        if (balance < 1) {
            return { success: false, error: "Insufficient Credits. Please purchase more." };
        }

        // 2. Deduct 
        const { error } = await supabaseAdmin.from('credit_transactions').insert({
            roster_id: rosterId,
            amount: -1,
            description: "Game Intelligence Unlock",
            metadata: { 
                event_id: eventId, 
                type: 'analysis_unlock', 
                source: 'v11_event_intel' 
            }
        });

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error("Unlock Analysis Error:", err);
        return { success: false, error: err.message };
    }
}

