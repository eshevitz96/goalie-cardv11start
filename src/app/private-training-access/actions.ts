"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";
import { headers } from "next/headers";

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
        const supabase = createClient();
        
        // 1. Check if a card already exists for this email
        const { data: existingRoster, error: rosterCheckError } = await supabase
            .from('roster_uploads')
            .select('id')
            .ilike('email', data.email.trim())
            .maybeSingle();
        
        if (rosterCheckError) {
            console.error("[ROSTER_CHECK_ERROR]", rosterCheckError);
            return { error: "Roster scan failed. Please check your DB connection." };
        }

        const { data: submission, error: insertError } = await supabase
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
    const supabase = createClient();
    
    // 1. Get submission details
    const { data: sub } = await supabase
        .from('private_training_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
    
    if (!sub) throw new Error("Submission not found.");
    
    // 2. Create roster entry
    const uniqueId = 'TGB-' + Math.floor(1000 + Math.random() * 9000);
    const { data: roster, error: rosterError } = await supabase
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
    
    if (rosterError) throw new Error(`Roster creation failed: ${rosterError.message}`);
    
    // 3. Link submission to the new roster entry
    await supabase
        .from('private_training_submissions')
        .update({ roster_id: roster.id })
        .eq('id', submissionId);
    
    return { rosterId: roster.id };
}

/**
 * Updates the waiver status of a submission.
 */
export async function updateWaiverStatus(submissionId: string, completed: boolean) {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('private_training_submissions')
        .update({
            waiver_completed: completed,
            status: completed ? 'ready for payment' : 'waiver pending'
        })
        .eq('id', submissionId);
    
    if (error) {
        console.error("[PRIVATE_SUBMISSION_WAIVER_UPDATE_ERROR]", error);
        throw new Error("Failed to update waiver status.");
    }
    
    return { success: true };
}

/**
 * Creates a Stripe Checkout Session for the private training.
 */
export async function createPrivateCheckoutSession(submissionId: string, isTestMode: boolean) {
    const supabase = createClient();
    
    // 1. Fetch submission details
    const { data: submission, error: subError } = await supabase
        .from('private_training_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
    
    if (subError || !submission) {
        throw new Error("Submission not found.");
    }
    
    if (!submission.waiver_completed) {
        throw new Error("Waiver must be completed before payment.");
    }
    
    // 2. Determine price ID
    // Note: In a real scenario, these would be in Stripe. 
    // Here we use the config or placeholders.
    const priceId = isTestMode 
        ? PRIVATE_ACCESS_CONFIG.stripe.testPriceId 
        : PRIVATE_ACCESS_CONFIG.stripe.livePriceId;

    const origin = headers().get("origin");
    
    // 3. Create Stripe session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Private Training Access',
                        description: `Invite-only training for ${submission.athlete_name}`,
                    },
                    unit_amount: isTestMode ? 100 : 160000, // $1 or $1600
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        customer_email: submission.email,
        success_url: `${origin}/private-training-access/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submissionId}`,
        cancel_url: `${origin}/private-training-access?submission_id=${submissionId}`,
        metadata: {
            submissionId: submission.id,
            athleteName: submission.athlete_name,
            parentName: submission.parent_name || '',
            email: submission.email,
            accessCode: submission.access_code,
            waiverCompleted: 'true',
            productType: 'private training access',
            isTestMode: String(isTestMode)
        }
    });
    
    // 4. Update submission with session info
    await supabase
        .from('private_training_submissions')
        .update({
            stripe_session_id: session.id,
            is_test_mode: isTestMode
        })
        .eq('id', submissionId);
    
    return { url: session.url };
}

/**
 * Fetches submisison by ID for the success page.
 */
export async function getSubmissionById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('private_training_submissions')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) return null;
    return data;
}
