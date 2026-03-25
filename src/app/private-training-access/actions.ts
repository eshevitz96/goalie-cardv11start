"use server";

import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";
import { headers } from "next/headers";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing: ${!url ? 'URL ' : ''}${!key ? 'KEY ' : ''}`);
    }
    return createClient(url, key);
}

/**
 * Validates the access code.
 */
export async function validateAccessCode(code: string) {
    const isValid = PRIVATE_ACCESS_CONFIG.validCodes.includes(code.toUpperCase().trim());
    return { isValid };
}

/**
 * Creates a new submission record (initial 'invited' state)
 * and returns the record ID.
 */
export async function createPrivateSubmission(data: {
    athleteName: string;
    parentName?: string;
    email: string;
    phone: string;
    accessCode: string;
}) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // 1. Check if a card already exists (check primary email, athlete email, and guardian email)
        const { data: existingRoster, error: rosterCheckError } = await supabaseAdmin
            .from('roster_uploads')
            .select('id')
            .or(`email.ilike.${data.email.trim()},athlete_email.ilike.${data.email.trim()},guardian_email.ilike.${data.email.trim()}`)
            .maybeSingle();
        
        if (rosterCheckError) {
            console.error("[ROSTER_CHECK_ERROR]", rosterCheckError);
            return { error: "Roster scan failed. Please check your DB connection." };
        }

        const { data: submission, error: insertError } = await supabaseAdmin
            .from('private_training_submissions')
            .insert({
                athlete_name: data.athleteName,
                parent_name: data.parentName,
                email: data.email,
                phone: data.phone,
                access_code: data.accessCode,
                status: 'invited',
                roster_id: existingRoster?.id // Link if exists
            })
            .select()
            .single();
        
        if (insertError) {
            console.error("[SUBMISSION_INSERT_ERROR]", insertError);
            return { error: `Database Error: ${insertError.message}` };
        }
        
        return { 
            submissionId: submission.id, 
            hasExistingCard: !!existingRoster 
        };
    } catch (err: any) {
        console.error("[ACTION_EXCEPTION]", err);
        return { error: `Internal Server Error: ${err.message}` };
    }
}

/**
 * Creates a linked Goalie Card for the submission.
 */
export async function createConnectedCard(submissionId: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // 1. Get submission details
        const { data: sub, error: subError } = await supabaseAdmin
            .from('private_training_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();
        
        if (subError || !sub) return { error: "Submission not found for card connection." };
        
        // 2. Create roster entry
        const uniqueId = 'TGB-' + Math.floor(1000 + Math.random() * 9000);
        const { data: roster, error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .insert({
                goalie_name: sub.athlete_name,
                parent_name: sub.parent_name,
                email: sub.email.trim(),
                athlete_phone: sub.phone,
                assigned_unique_id: uniqueId,
                sport: 'Hockey', // Defaulting for TGB
                is_claimed: true,
                status: 'active'
            })
            .select()
            .single();
        
        if (rosterError) {
            console.error("[ROSTER_CREATE_ERROR]", rosterError);
            return { error: `Registry Error: ${rosterError.message}` };
        }
        
        // 3. Link submission to the new roster entry
        const { error: linkError } = await supabaseAdmin
            .from('private_training_submissions')
            .update({ roster_id: roster.id })
            .eq('id', submissionId);

        if (linkError) {
            console.error("[LINK_ERROR]", linkError);
            // Non-blocking for the flow, but good to know
        }
        
        return { success: true, rosterId: roster.id };
    } catch (err: any) {
        console.error("[CARD_CONNECT_EXCEPTION]", err);
        return { error: `Internal Server Error: ${err.message}` };
    }
}

/**
 * Updates the waiver status of a submission.
 */
export async function updateWaiverStatus(submissionId: string, confirmed: boolean) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        const { error } = await supabaseAdmin
            .from('private_training_submissions')
            .update({
                waiver_completed: confirmed,
                status: 'waiver pending'
            })
            .eq('id', submissionId);
        
        if (error) {
            console.error("[WAIVER_UPDATE_ERROR]", error);
            return { error: `Database Error: ${error.message}` };
        }
        
        return { success: true };
    } catch (err: any) {
        console.error("[WAIVER_UPDATE_EXCEPTION]", err);
        return { error: `Internal Server Error: ${err.message}` };
    }
}

/**
 * Creates a Stripe Checkout Session for the private training.
 */
export async function createEmbeddedCheckoutSession(submissionId: string, planId: string, isTestMode: boolean) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // 1. Fetch submission details
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
        
        const isMonthly = planId === 'monthly';
        const isSeason = planId === 'season';
        const isStandard = planId === 'standard';
        
        const origin = "https://goalie-cardv11start.vercel.app";
        
        // Price logic based on plan
        let baseAmount = 160000;
        let feeAmount = 4810;
        let planName = 'Standard Block (16 Lessons)';
        let intervalCount = 1;
        
        if (planId === 'season') {
            baseAmount = 240000;
            feeAmount = 7210;
            planName = 'Season Commitment (24 Lessons)';
            intervalCount = 6;
        } else if (planId === 'monthly') {
            baseAmount = 40000;
            feeAmount = 1225;
            planName = 'Legacy Member (Monthly Sub)';
            intervalCount = 1;
        } else if (planId === 'standard') {
            baseAmount = 160000;
            feeAmount = 4810;
            planName = 'Standard Block (16 Lessons)';
            intervalCount = 4;
        }

        if (isTestMode) {
            baseAmount = 100;
            feeAmount = 34;
        }

        // 2. Create Embedded Session
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'subscription', // ALL plans are now recurring subscriptions
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: planName,
                            description: isMonthly ? 'Recurring monthly training access.' : 
                                         isSeason ? '24 lesson blocks every 6 months.' : '16 lesson blocks every 4 months.',
                        },
                        unit_amount: baseAmount,
                        recurring: { interval: 'month', interval_count: intervalCount },
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Processing & Admin Fee',
                            description: 'Standard 2.9% + $0.30 transaction fee',
                        },
                        unit_amount: feeAmount,
                        recurring: { interval: 'month', interval_count: intervalCount },
                    },
                    quantity: 1,
                }
            ],
            return_url: `${origin}/private-training-access/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
            metadata: {
                submissionId: submission.id,
                athleteName: submission.athlete_name,
                email: submission.email,
                productType: 'private training access',
                planSelected: planId,
                isTestMode: String(isTestMode)
            }
        } as any);
        
        // 3. Update submission
        const supabase = getSupabaseAdmin();
        await supabase
            .from('private_training_submissions')
            .update({
                stripe_session_id: session.id,
                is_test_mode: isTestMode
            })
            .eq('id', submissionId);
        
        return { clientSecret: session.client_secret };
    } catch (err: any) {
        console.error("[EMBEDDED_SESSION_ERROR]", err);
        return { error: `Payment Setup Error: ${err.message}` };
    }
}

/**
 * Fetches submisison by ID for the success page.
 */
export async function getSubmissionById(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('private_training_submissions')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) return null;
    return data;
}

/**
 * Fetches the Stripe receipt URL for a given session.
 */
export async function getReceiptUrl(sessionId: string) {
    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });
        
        const paymentIntent = session.payment_intent as any;
        if (!paymentIntent || !paymentIntent.latest_charge) {
            return { error: "Payment not yet finalized or charge not found." };
        }

        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        return { receiptUrl: charge.receipt_url };
    } catch (err: any) {
        console.error("[RECEIPT_FETCH_ERROR]", err);
        return { error: `Failed to fetch receipt: ${err.message}` };
    }
}
