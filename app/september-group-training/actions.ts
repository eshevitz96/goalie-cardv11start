"use server";

import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { GROUP_TRAINING_CONFIG } from "@/constants/groupTraining";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing: ${!url ? 'URL ' : ''}${!key ? 'KEY ' : ''}`);
    }
    return createClient(url, key);
}

export async function validateAccessCode(code: string) {
    const isValid = GROUP_TRAINING_CONFIG.validCodes.includes(code.toUpperCase().trim());
    return { isValid };
}

export async function getAvailableDates() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const MAX_CAPACITY = 5;
        const TARGET_DATES = ['Sept 5', 'Sept 12', 'Sept 19'];
        
        // Count spots taken for each date
        // We consider a spot taken ONLY if payment is received.
        const { data, error } = await supabaseAdmin
            .from('private_training_submissions')
            .select('selected_dates')
            .eq('payment_status', 'paid');
            
        if (error) {
            console.error("Error fetching dates:", error);
            // Default to full capacity on error so we don't overbook
            return TARGET_DATES.map(date => ({ date, spotsLeft: 0 }));
        }
        
        const counts: Record<string, number> = {
            'Sept 5': 0,
            'Sept 12': 0,
            'Sept 19': 0
        };
        
        data.forEach(sub => {
            if (Array.isArray(sub.selected_dates)) {
                sub.selected_dates.forEach((d: string) => {
                    if (counts[d] !== undefined) {
                        counts[d]++;
                    }
                });
            }
        });
        
        return TARGET_DATES.map(date => ({
            date,
            spotsLeft: Math.max(0, MAX_CAPACITY - counts[date])
        }));
    } catch (err: any) {
        console.error("Exception fetching dates:", err);
        return ['Sept 5', 'Sept 12', 'Sept 19'].map(date => ({ date, spotsLeft: 0 }));
    }
}

export async function createGroupSubmission(data: {
    athleteName: string;
    parentName?: string;
    email: string;
    phone: string;
    accessCode: string;
}) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        const { data: existingRoster } = await supabaseAdmin
            .from('roster_uploads')
            .select('id')
            .or(`email.ilike.${data.email.trim()},athlete_email.ilike.${data.email.trim()},guardian_email.ilike.${data.email.trim()}`)
            .maybeSingle();

        const { data: submission, error: insertError } = await supabaseAdmin
            .from('private_training_submissions')
            .insert({
                athlete_name: data.athleteName,
                parent_name: data.parentName,
                email: data.email,
                phone: data.phone,
                access_code: data.accessCode,
                status: 'invited',
                roster_id: existingRoster?.id
            })
            .select()
            .single();
        
        if (insertError) {
            return { error: `Database Error: ${insertError.message}` };
        }
        
        return { 
            submissionId: submission.id, 
            hasExistingCard: !!existingRoster 
        };
    } catch (err: any) {
        return { error: `Internal Server Error: ${err.message}` };
    }
}

export async function createConnectedCard(submissionId: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        const { data: sub, error: subError } = await supabaseAdmin
            .from('private_training_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();
        
        if (subError || !sub) return { error: "Submission not found for card connection." };
        
        const uniqueId = 'TGB-' + Math.floor(1000 + Math.random() * 9000);
        const { data: roster, error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .insert({
                goalie_name: sub.athlete_name,
                parent_name: sub.parent_name,
                email: sub.email.trim(),
                athlete_phone: sub.phone,
                assigned_unique_id: uniqueId,
                sport: 'Hockey',
                is_claimed: true
            })
            .select()
            .single();
        
        if (rosterError) {
            return { error: `Registry Error: ${rosterError.message}` };
        }
        
        await supabaseAdmin
            .from('private_training_submissions')
            .update({ roster_id: roster.id })
            .eq('id', submissionId);

        return { success: true, rosterId: roster.id };
    } catch (err: any) {
        return { error: `Internal Server Error: ${err.message}` };
    }
}

export async function updateWaiverStatus(submissionId: string, confirmed: boolean, signature?: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        const updatePayload: any = {
            waiver_completed: confirmed,
            status: 'waiver pending'
        };
        
        if (signature) {
            updatePayload.digital_signature = signature;
        }

        const { error } = await supabaseAdmin
            .from('private_training_submissions')
            .update(updatePayload)
            .eq('id', submissionId);
        
        if (error) {
            return { error: `Database Error: ${error.message}` };
        }
        
        return { success: true };
    } catch (err: any) {
        return { error: `Internal Server Error: ${err.message}` };
    }
}

export async function createEmbeddedCheckoutSession(submissionId: string, planId: string, isTestMode: boolean, selectedDates: string[]) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        const { data: submission, error: subError } = await supabaseAdmin
            .from('private_training_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();
        
        if (subError || !submission) {
            return { error: "Submission not found." };
        }
        
        if (!submission.waiver_completed) {
            return { error: "Waiver must be completed before payment." };
        }

        const origin = "https://goaliecard.app";

        const PLANS: Record<string, { amount: number; name: string; description: string }> = {
            session1: {
                amount: 15000,
                name: 'September Group Training — 1 Session',
                description: 'Group training at Lambert. One-time payment.',
            },
            session2: {
                amount: 30000,
                name: 'September Group Training — 2 Sessions',
                description: 'Group training at Lambert. One-time payment.',
            },
            session3: {
                amount: 45000,
                name: 'September Group Training — 3 Sessions',
                description: 'Group training at Lambert. One-time payment.',
            },
        };

        const plan = PLANS[planId];
        if (!plan) {
            return { error: `Invalid plan selected: ${planId}` };
        }

        let baseAmount = plan.amount;
        // Standard Stripe fee calculation (2.9% + $0.30) to ensure net payout equals the exact base rate:
        // Total = Math.ceil((baseAmount + 30) / (1 - 0.029)) = Math.ceil((baseAmount + 30) / 0.971)
        let totalTargetCents = Math.ceil((baseAmount + 30) / 0.971);
        let feeAmount = totalTargetCents - baseAmount;

        if (isTestMode) {
            baseAmount = 100;
            feeAmount = 34; // $1.34 total -> $1.00 net payout
        }

        const lineItems = [
            {
                price_data: {
                    currency: 'usd' as const,
                    product_data: {
                        name: isTestMode ? `[TEST] ${plan.name}` : plan.name,
                        description: plan.description,
                    },
                    unit_amount: baseAmount,
                },
                quantity: 1,
            },
            {
                price_data: {
                    currency: 'usd' as const,
                    product_data: {
                        name: 'Card Processing & Admin Fee',
                        description: 'Standard 2.9% + $0.30 transaction fee',
                    },
                    unit_amount: feeAmount,
                },
                quantity: 1,
            },
        ];

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment',
            line_items: lineItems,
            return_url: `${origin}/september-group-training/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
            metadata: {
                submissionId: submission.id,
                athleteName: submission.athlete_name,
                email: submission.email,
                productType: 'september group training',
                planSelected: planId,
                selectedDates: selectedDates.join(', '),
                isTestMode: String(isTestMode)
            }
        } as any);
        
        await supabaseAdmin
            .from('private_training_submissions')
            .update({
                stripe_session_id: session.id,
                is_test_mode: isTestMode,
                selected_dates: selectedDates
            })
            .eq('id', submissionId);
        
        return { clientSecret: session.client_secret };
    } catch (err: any) {
        return { error: `Payment Setup Error: ${err.message}` };
    }
}
