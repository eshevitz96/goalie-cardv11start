"use server";

import { createClient } from "@supabase/supabase-js";

import { getStripe } from "@/lib/stripe";

import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing`);
    }
    return createClient(url, key);
}

async function verifyAdminOrCoach(accessCode?: string): Promise<boolean> {
    try {
        const serverSupabase = await createSupabaseServerClient();
        const { data: { user } } = await serverSupabase.auth.getUser();

        if (user) {
            const adminClient = getSupabaseAdmin();
            const [{ data: prof }, { data: usr }] = await Promise.all([
                adminClient.from('profiles').select('role').eq('id', user.id).maybeSingle(),
                adminClient.from('users').select('role').eq('auth_user_id', user.id).maybeSingle()
            ]);
            const role = prof?.role || usr?.role;
            if (role === 'coach' || role === 'admin' || user.email === 'eshevitz96@gmail.com') {
                return true;
            }
        }

        const envSecret = process.env.ADMIN_ROSTER_SECRET;
        if (envSecret && accessCode && accessCode.trim() === envSecret.trim()) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

export async function fetchAdminRoster(password?: string) {
    const isAuthorized = await verifyAdminOrCoach(password);
    if (!isAuthorized) {
        return { error: "Unauthorized: Coach or Admin access required." };
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

export async function deleteSubmission(id: string, password?: string) {
    const isAuthorized = await verifyAdminOrCoach(password);
    if (!isAuthorized) {
        return { error: "Unauthorized: Coach or Admin access required." };
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
