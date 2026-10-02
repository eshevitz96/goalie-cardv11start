import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Authentication Check — must be logged in
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = user.email;
        if (!email) {
            return NextResponse.json({ error: "User email not found" }, { status: 400 });
        }

        // 2. Looks up stripe_customer_id for the authenticated user from private_training_submissions (match by email)
        const { data: submission } = await supabase
            .from('private_training_submissions')
            .select('stripe_customer_id')
            .or(`email.ilike.${email.trim()},guardian_email.ilike.${email.trim()}`)
            .not('stripe_customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let customerId = submission?.stripe_customer_id;

        // 3. Fallback: Search directly in Stripe for customer by email
        if (!customerId) {
            try {
                const customers = await stripe.customers.list({
                    email: email.trim().toLowerCase(),
                    limit: 1
                });
                if (customers.data && customers.data.length > 0) {
                    customerId = customers.data[0].id;
                }
            } catch (stripeErr) {
                console.warn("[PORTAL_STRIPE_LOOKUP_WARN]", stripeErr);
            }
        }

        // 4. Return error if no Stripe customer found for this user
        if (!customerId) {
            return NextResponse.json({ 
                error: "No active billing record found for your account. Please complete an initial booking or enrollment." 
            }, { status: 404 });
        }

        // 5. Call stripe.billingPortal.sessions.create
        const origin = new URL(req.url).origin;
        const returnUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
            ? `${origin}/profile`
            : 'https://goaliecard.app/profile';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        // 6. Returns the portal session URL
        return NextResponse.json({ url: portalSession.url });
    } catch (error: any) {
        console.error("[STRIPE_PORTAL_ROUTE_ERROR]", error);
        return NextResponse.json({ 
            error: error.message || "An unexpected error occurred generating billing portal session." 
        }, { status: 500 });
    }
}
