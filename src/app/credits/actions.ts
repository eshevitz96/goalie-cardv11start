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
        // 1. Get Individual Balance
        const { data: indData, error: indError } = await supabaseAdmin.rpc('get_goalie_balance', { target_roster_id: rosterId });
        let indBalance = indData || 0;

        if (indError) {
            console.warn("RPC failed, calculating manual sum:", indError.message);
            const { data: transactions } = await supabaseAdmin
                .from('credit_transactions')
                .select('amount')
                .eq('roster_id', rosterId);
            indBalance = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        }

        // 2. Get Team Balance (if part of an Org)
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('team_id')
            .eq('id', rosterId)
            .single();

        let teamBalance = 0;
        if (roster?.team_id) {
            const { data: fund } = await supabaseAdmin
                .from('team_credit_funds')
                .select('balance')
                .eq('team_id', roster.team_id)
                .maybeSingle();
            teamBalance = fund?.balance || 0;
        }

        return { 
            success: true, 
            balance: indBalance, 
            teamBalance: teamBalance,
            totalCredits: indBalance + teamBalance 
        };
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
        // 1. Check ALL Balances
        const balanceResult = await getBalance(rosterId);
        if (!balanceResult.success) throw new Error(balanceResult.error);

        const indBal = balanceResult.balance || 0;
        const teamBal = balanceResult.teamBalance || 0;

        // 2. Determine where to deduct from
        if (indBal > 0) {
            // Priority 1: Individual Credits
            const { error } = await supabaseAdmin.from('credit_transactions').insert({
                roster_id: rosterId,
                amount: -1,
                description: "Game Intelligence Unlock (Personal)",
                metadata: { event_id: eventId, type: 'analysis_unlock', source: 'v11_personal' }
            });
            if (error) throw error;
            return { success: true, method: 'personal' };

        } else if (teamBal > 0) {
            // Priority 2: Team Fund
            const { data: roster } = await supabaseAdmin
                .from('roster_uploads')
                .select('team_id, linked_user_id')
                .eq('id', rosterId)
                .single();

            if (!roster?.team_id) throw new Error("No team found despite team balance.");

            // TRANSACTIONAL: Deduct from fund and log in fund_transactions
            const { error: fundErr } = await supabaseAdmin.rpc('deduct_team_credit', { 
                target_team_id: roster.team_id,
                user_id_ref: roster.linked_user_id,
                event_id_ref: eventId
            });

            // If RPC is missing, do it manually (less safe, but allows development)
            if (fundErr) {
                console.warn("deduct_team_credit RPC missing, using manual deduction");
                // Insert Audit log
                await supabaseAdmin.from('team_fund_transactions').insert({
                    team_id: roster.team_id,
                    amount: -1,
                    description: `Game Intel Unlock (Team Fund)`,
                    goalie_id: roster.linked_user_id,
                    metadata: { event_id: eventId }
                });
                
                // Update Balance
                const { error: updateErr } = await supabaseAdmin
                    .from('team_credit_funds')
                    .update({ balance: teamBal - 1 })
                    .eq('team_id', roster.team_id);
                
                if (updateErr) throw updateErr;
            }

            return { success: true, method: 'team_fund' };
        } else {
            return { success: false, error: "Insufficient Credits. Please purchase as individual or join a Team Deal." };
        }
    } catch (err: any) {
        console.error("Unlock Analysis Error:", err);
        return { success: false, error: err.message };
    }
}

