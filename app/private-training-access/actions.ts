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
                is_claimed: true
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

        const origin = "https://goaliecard.app";

        // ── Plan config ─────────────────────────────────────────────────────
        // block4: 4 sessions @ $125/session = $500 gross (fees absorbed into price)
        // block8: 8 sessions @ $115/session = $920 gross (fees absorbed into price)
        const PLANS: Record<string, { amount: number; name: string; description: string; priceId: string }> = {
            block4: {
                amount: 50000, // $500.00 in cents
                name: 'Private Training — 4 Session Block',
                description: '4 private goalie training sessions ($125/session). One-time payment.',
                priceId: process.env.STRIPE_PRICE_BLOCK4 || 'price_1TlKjFGj0SdRYIlhOISWOV1N',
            },
            block8: {
                amount: 92000, // $920.00 in cents
                name: 'Private Training — 8 Session Block',
                description: '8 private goalie training sessions ($115/session). One-time payment.',
                priceId: process.env.STRIPE_PRICE_BLOCK8 || 'price_1TlKjGGj0SdRYIlhMYW8GbwB',
            },
        };

        const plan = PLANS[planId];
        if (!plan) {
            return { error: `Invalid plan selected: ${planId}` };
        }

        // Test mode: use a $1.00 inline price so we can test without real charges
        const lineItems = isTestMode
            ? [{
                price_data: {
                    currency: 'usd' as const,
                    product_data: { name: `[TEST] ${plan.name}` },
                    unit_amount: 100, // $1.00
                },
                quantity: 1,
              }]
            : [{ price: plan.priceId, quantity: 1 }];

        // 2. Create Embedded Session — one-time payment, no subscription
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment',
            line_items: lineItems,
            return_url: `${origin}/private-training-access/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
            metadata: {
                submissionId: submission.id,
                athleteName: submission.athlete_name,
                email: submission.email,
                productType: 'private training access',
                planSelected: planId,
                sessions: planId === 'block4' ? '4' : '8',
                isTestMode: String(isTestMode)
            }
        } as any);
        
        // 3. Update submission with session ID
        await supabaseAdmin
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
            expand: ['payment_intent', 'invoice', 'subscription'],
        });
        
        // Handle one-time payment mode
        if (session.payment_intent) {
            const paymentIntent = session.payment_intent as any;
            if (paymentIntent.latest_charge) {
                const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                return { receiptUrl: charge.receipt_url };
            }
        }

        // Handle subscription mode
        if (session.invoice) {
            const invoice = typeof session.invoice === 'string' 
                ? await stripe.invoices.retrieve(session.invoice) 
                : session.invoice as any;
            
            if (invoice && invoice.hosted_invoice_url) {
                return { receiptUrl: invoice.hosted_invoice_url };
            }
        }

        return { error: "Payment not yet finalized or charge not found." };
    } catch (err: any) {
        console.error("[RECEIPT_FETCH_ERROR]", err);
        return { error: `Failed to fetch receipt: ${err.message}` };
    }
}
