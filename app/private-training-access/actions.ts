"use server";

import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { 
    PRIVATE_ACCESS_CONFIG, 
    resolveAccessPath, 
    AccessPath, 
    PlanDisplay 
} from "@/constants/privateAccess";
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
 * Validates the access code and returns the server-determined path and plans.
 * Never exposes price IDs to the client.
 */
export async function validateAccessCode(code: string): Promise<{
    isValid: boolean;
    path: AccessPath | null;
    plans: PlanDisplay[];
}> {
    const path = resolveAccessPath(code);
    if (!path) {
        return { isValid: false, path: null, plans: [] };
    }

    if (path === 'founding') {
        const plans: PlanDisplay[] = Object.values(PRIVATE_ACCESS_CONFIG.foundingPlans).map(p => ({
            id: p.id,
            name: p.name,
            amount: p.amount,
            amountFormatted: p.amountFormatted,
            billingText: p.billingText,
            subtext: p.subtext,
            isRecurring: p.isRecurring,
            intervalCount: p.intervalCount
        }));
        return { isValid: true, path, plans };
    }

    if (path === 'new-clients') {
        const plans: PlanDisplay[] = Object.values(PRIVATE_ACCESS_CONFIG.newClientPlans).map(p => ({
            id: p.id,
            name: p.name,
            amount: p.amount,
            amountFormatted: p.amountFormatted,
            billingText: p.billingText,
            subtext: p.subtext,
            isRecurring: p.isRecurring,
            isDefault: p.isDefault,
            badge: (p as any).badge
        }));
        return { isValid: true, path, plans };
    }

    return { isValid: false, path: null, plans: [] };
}

/**
 * Resumes an existing pending submission (e.g. waiver pending) and returns its original code's pricing.
 */
export async function resumeSubmission(submissionId: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: sub, error } = await supabaseAdmin
            .from('private_training_submissions')
            .select('*')
            .eq('id', submissionId)
            .maybeSingle();

        if (error || !sub) {
            return { error: "Submission not found." };
        }

        const path = resolveAccessPath(sub.access_code);
        if (!path) {
            return { error: "Submission has an invalid access code." };
        }

        const validation = await validateAccessCode(sub.access_code);

        let resumeStep: 'info' | 'waiver' | 'plan-selection' = 'info';
        if (sub.waiver_completed) {
            resumeStep = 'plan-selection';
        } else if (sub.status === 'waiver pending' || sub.athlete_name) {
            resumeStep = 'waiver';
        }

        return {
            success: true,
            submission: {
                id: sub.id,
                athleteName: sub.athlete_name,
                parentName: sub.parent_name || '',
                email: sub.email,
                phone: sub.phone,
                accessCode: sub.access_code,
                waiverCompleted: sub.waiver_completed,
                status: sub.status,
                digitalSignature: sub.digital_signature || ''
            },
            path,
            plans: validation.plans,
            step: resumeStep
        };
    } catch (err: any) {
        console.error("[RESUME_SUBMISSION_ERROR]", err);
        return { error: `Failed to resume submission: ${err.message}` };
    }
}

/**
 * Creates or updates a submission record.
 * 
 * SECURITY & PROFILE LINKING RULES:
 * - May ONLY use the signed-in user's authenticated auth id and verified email.
 * - NEVER matches by name, a typed email, or roster lookup.
 * - NEVER attaches an existing goalie record that belongs to another account.
 * - If signed in and the user already has a Goalie Card explicitly linked to their auth ID, links that card.
 * - New signups / unlinked users get a fresh, empty profile.
 * - Sport is taken directly from the form (defaulting to 'Lacrosse').
 * - Resumes an existing pending submission (by submissionId) rather than creating duplicates.
 */
export async function createPrivateSubmission(data: {
    athleteName: string;
    parentName?: string;
    email: string;
    phone: string;
    accessCode: string;
    sport?: string;
    submissionId?: string;
}) {
    try {
        const path = resolveAccessPath(data.accessCode);
        if (!path) {
            return { error: "Invalid access code. Please check your invitation." };
        }

        const supabaseAdmin = getSupabaseAdmin();
        const serverSupabase = await createServerSupabase();
        
        // 1. Check for authenticated session (strictly signed-in user)
        const { data: { user } } = await serverSupabase.auth.getUser();

        let rosterId: string | null = null;
        const selectedSport = data.sport && data.sport.trim() ? data.sport.trim() : 'Lacrosse';

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
                    email: user?.email || data.email.trim(),
                    athlete_phone: data.phone,
                    assigned_unique_id: uniqueId,
                    sport: selectedSport,
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

        // 2. Resume existing submission if ID provided, otherwise insert new
        let submissionId = data.submissionId;

        if (submissionId) {
            const { error: updateError } = await supabaseAdmin
                .from('private_training_submissions')
                .update({
                    athlete_name: data.athleteName,
                    parent_name: data.parentName || null,
                    email: user?.email || data.email,
                    phone: data.phone,
                    access_code: data.accessCode,
                    roster_id: rosterId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', submissionId);

            if (updateError) {
                console.error("[SUBMISSION_UPDATE_ERROR]", updateError);
                return { error: `Database Error: ${updateError.message}` };
            }
        } else {
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
            submissionId = submission.id;
        }

        const validation = await validateAccessCode(data.accessCode);
        
        return { 
            submissionId, 
            hasExistingCard: !!rosterId,
            path,
            plans: validation.plans
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
 * Creates a Stripe Checkout Session.
 * 
 * SERVER-SIDE ENFORCEMENT RULES:
 * - Reads access_code strictly from the database submission record. Never trusts client prices.
 * - 'goalie2026' (founding): mode = 'subscription', uses founding subscription prices.
 * - 'goalie2027' (new-clients): mode = 'payment', uses one-time package prices.
 * - Mismatched or invalid plans are rejected server-side.
 */
export async function createEmbeddedCheckoutSession(submissionId: string, planId: string, isTestMode: boolean) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // 1. Fetch submission details from database
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

        // 2. Resolve pricing path strictly from the stored access code
        const path = resolveAccessPath(submission.access_code);
        if (!path) {
            return { error: "Invalid access code associated with submission." };
        }

        const headersList = await headers();
        const host = headersList.get('host') || 'goaliecard.app';
        const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
        const origin = `${proto}://${host}`;

        const stripe = getStripe();
        let checkoutMode: 'subscription' | 'payment';
        let lineItems: any[];
        let planName: string;
        let selectedPlanId: string;

        if (path === 'founding') {
            const plan = (PRIVATE_ACCESS_CONFIG.foundingPlans as any)[planId];
            if (!plan) {
                return { error: `Invalid plan "${planId}" for founding membership.` };
            }
            checkoutMode = 'subscription';
            planName = plan.name;
            selectedPlanId = plan.id;

            lineItems = isTestMode
                ? [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: plan.name,
                                description: `${plan.name} (${plan.subtext}) - Founding Member Subscription (Test Mode)`,
                            },
                            unit_amount: 100, // $1.00 test subscription
                            recurring: { interval: 'month', interval_count: plan.intervalCount || 1 },
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
        } else if (path === 'new-clients') {
            const plan = (PRIVATE_ACCESS_CONFIG.newClientPlans as any)[planId];
            if (!plan) {
                return { error: `Invalid plan "${planId}" for new client training.` };
            }
            checkoutMode = plan.isRecurring ? 'subscription' : 'payment';
            planName = plan.name;
            selectedPlanId = plan.id;

            lineItems = isTestMode
                ? [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: plan.name,
                                description: `${plan.name} (${plan.subtext}) - Total includes card processing & transaction fees (Test Mode)`,
                            },
                            unit_amount: 100, // $1.00 test amount
                            ...(plan.isRecurring ? { recurring: { interval: 'month', interval_count: 1 } } : {})
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
        } else {
            return { error: "Unsupported access path." };
        }

        // 3. Create Embedded Checkout Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: checkoutMode,
            line_items: lineItems,
            branding_settings: {
                background_color: '#121215',
                button_color: '#FFFFFF',
            },
            return_url: `${origin}/private-training-access/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
            metadata: {
                submissionId: submission.id,
                athleteName: submission.athlete_name,
                email: submission.email,
                productType: 'private training access',
                accessPath: path,
                accessCode: submission.access_code,
                planSelected: selectedPlanId,
                packageName: planName,
                isTestMode: String(isTestMode)
            }
        } as any);
        
        // 4. Update submission with session ID and mode
        await supabaseAdmin
            .from('private_training_submissions')
            .update({
                stripe_session_id: session.id,
                is_test_mode: isTestMode,
                package_type: selectedPlanId
            })
            .eq('id', submissionId);
        
        return { clientSecret: session.client_secret };
    } catch (err: any) {
        console.error("[EMBEDDED_SESSION_ERROR]", err);
        return { error: `Payment Setup Error: ${err.message}` };
    }
}

/**
 * Fetches submission by ID for the success page.
 */
export async function getSubmissionById(id: string) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('private_training_submissions')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error("[GET_SUBMISSION_ERROR]", error);
        return null;
    }
    return data;
}

/**
 * Retrieves the hosted invoice/receipt URL from Stripe.
 */
export async function getReceiptUrl(sessionId: string) {
    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'invoice', 'subscription']
        });

        // 1. If it has a payment intent with latest charge
        if (session.payment_intent && typeof session.payment_intent === 'object') {
            const paymentIntent: any = session.payment_intent;
            if (paymentIntent.latest_charge) {
                const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                if (charge.receipt_url) return { receiptUrl: charge.receipt_url };
            }
        }

        // 2. If it's a subscription with invoice
        if (session.invoice) {
            const invoice: any = typeof session.invoice === 'string' 
                ? await stripe.invoices.retrieve(session.invoice) 
                : session.invoice;
            
            if (invoice?.hosted_invoice_url) {
                return { receiptUrl: invoice.hosted_invoice_url };
            }
        }

        return { error: "Receipt is still being finalized. It has been sent to your email." };
    } catch (err: any) {
        console.error("[RECEIPT_URL_ERROR]", err);
        return { error: `Failed to fetch receipt: ${err.message}` };
    }
}
