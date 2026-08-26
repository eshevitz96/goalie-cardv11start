"use server";

import { createClient } from "@supabase/supabase-js";

import { getStripe } from "@/lib/stripe";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing`);
    }
    return createClient(url, key);
}

export async function fetchAdminRoster(password: string) {
    // Hardcoded simple protection
    if (password !== "ShevitzBears23") {
        return { error: "Incorrect password." };
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('private_training_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { error: `Database Error: ${error.message}` };
        }

        // Auto-heal/sync any pending sessions with Stripe
        if (data && data.length > 0) {
            const stripe = getStripe();
            for (const sub of data) {
                if (sub.payment_status !== 'paid' && sub.stripe_session_id) {
                    try {
                        const session = await stripe.checkout.sessions.retrieve(sub.stripe_session_id);
                        if (session.payment_status === 'paid') {
                            await supabase
                                .from('private_training_submissions')
                                .update({
                                    payment_status: 'paid',
                                    status: 'paid',
                                    stripe_payment_intent_id: session.payment_intent as string,
                                    notes: `Stripe Session Verified: ${session.id}`
                                })
                                .eq('id', sub.id);
                            
                            sub.payment_status = 'paid';
                            sub.status = 'paid';
                        }
                    } catch (e) {
                        // ignore if session lookup fails
                    }
                }
            }
        }

        // Return the secure payload
        return { data };
    } catch (err: any) {
        return { error: `Server Error: ${err.message}` };
    }
}

export async function deleteSubmission(id: string, password: string) {
    if (password !== "ShevitzBears23") {
        return { error: "Incorrect password." };
    }

    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('private_training_submissions')
            .delete()
            .eq('id', id);

        if (error) {
            return { error: `Database Error: ${error.message}` };
        }

        return { success: true };
    } catch (err: any) {
        return { error: `Server Error: ${err.message}` };
    }
}
