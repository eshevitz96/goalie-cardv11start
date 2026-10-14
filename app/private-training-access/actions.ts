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
 * 
 * SECURITY & PROFILE LINKING RULES:
 * - May ONLY use the signed-in user's authenticated auth id and verified email.
 * - NEVER matches by name, a typed email, or roster lookup.
 * - NEVER attaches an existing goalie record that belongs to another account.
 * - If signed in and the user already has a Goalie Card explicitly linked to their auth ID, links that card.
 * - New signups / unlinked users get a fresh, empty profile.
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
        const serverSupabase = await createServerSupabase();
        
        // 1. Check for authenticated session (strictly signed-in user)
        const { data: { user } } = await serverSupabase.auth.getUser();

        let rosterId: string | null = null;

        // If signed in, only attach a card explicitly linked to THIS user's auth ID.
        // Never match by typed email, name, or arbitrary roster lookup.
        if (user?.id) {
            const { data: existingOwnCard, error: cardError } = await supabaseAdmin
                .from('roster_uploads')
                .select('id')
                .eq('linked_user_id', user.id)
                .maybeSingle();

            if (!cardError && existingOwnCard) {
                rosterId = existingOwnCard.id;
            }
        }

        // New signup or user without an existing card: gets a fresh, empty profile.
        // Never attaches to another user's existing record.
        if (!rosterId) {
            const uniqueId = 'TGB-' + Math.floor(1000 + Math.random() * 9000);
            const { data: newRoster, error: rosterCreateError } = await supabaseAdmin
                .from('roster_uploads')
                .insert({
                    goalie_name: data.athleteName,
                    parent_name: data.parentName || null,
                    email: user?.email || data.email.trim(), // Verified email if signed in, otherwise typed email for the new record
                    athlete_phone: data.phone,
                    assigned_unique_id: uniqueId,
                    sport: 'Lacrosse',
                    is_claimed: !!user?.id,
                    linked_user_id: user?.id || null
                })
                .select('id')
                .maybeSingle();

            if (rosterCreateError) {
                console.error("[ROSTER_CREATE_ERROR]", rosterCreateError);
            } else if (newRoster) {
                rosterId = newRoster.id;
            }
        }

        const { data: submission, error: insertError } = await supabaseAdmin
            .from('private_training_submissions')
            .insert({
                athlete_name: data.athleteName,
                parent_name: data.parentName,
                email: user?.email || data.email,
                phone: data.phone,
                access_code: data.accessCode,
                status: 'invited',
                roster_id: rosterId
            })
            .select()
            .single();
        
        if (insertError) {
            console.error("[SUBMISSION_INSERT_ERROR]", insertError);
            return { error: `Database Error: ${insertError.message}` };
        }
        
        return { 
            submissionId: submission.id, 
            hasExistingCard: !!rosterId 
        };
    } catch (err: any) {
        console.error("[ACTION_EXCEPTION]", err);
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
 * Creates a Stripe Checkout Session for the private training one-time package.
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

        const planKey = (planId === 'block8' || planId === '8-lessons') ? 'block8' : 'block4';
        const plan = PRIVATE_ACCESS_CONFIG.plans[planKey];

        const headersList = await headers();
        const host = headersList.get('host') || 'goaliecard.app';
        const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        const origin = `${proto}://${host}`;

        // 2. Line Items based on mode
        const stripe = getStripe();
        const lineItems = isTestMode
            ? [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.name,
                            description: `${plan.name} (${plan.subtext}) - One-time payment (Test Mode)`,
                        },
                        unit_amount: 100, // $1.00 test amount
                    },
                    quantity: 1,
                }
            ]
            : [
                {
                    price: plan.priceId,
                    quantity: 1,
                }
            ];

        // 3. Create Embedded Session (one-time payment mode)
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment', // One-time payment
            line_items: lineItems,
            return_url: `${origin}/private-training-access/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
            metadata: {
                submissionId: submission.id,
                athleteName: submission.athlete_name,
                email: submission.email,
                productType: 'private training access',
                planSelected: plan.id,
                packageName: plan.name,
                isTestMode: String(isTestMode)
            }
        } as any);
        
        // 4. Update submission with session ID
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
