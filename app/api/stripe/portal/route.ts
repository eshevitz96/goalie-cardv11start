import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = createClient();
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
        const { data: submission, error: subError } = await supabase
            .from('private_training_submissions')
            .select('stripe_customer_id')
            .eq('email', email.toLowerCase())
            .eq('payment_status', 'paid')
            .not('stripe_customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (subError) {
            console.error("[PORTAL_DB_ERROR]", subError);
            return NextResponse.json({ error: "Database lookup failed." }, { status: 500 });
        }

        const customerId = submission?.stripe_customer_id;

        // 3. Return 404 if no customer ID found
        if (!customerId) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
        }

        // 4. Call stripe.billingPortal.sessions.create
        const origin = new URL(req.url).origin;
        const returnUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
            ? `${origin}/profile`
            : 'https://goaliecard.app/profile';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        // 5. Returns the portal session URL
        return NextResponse.json({ url: portalSession.url });
    } catch (error: any) {
        console.error("[STRIPE_PORTAL_ROUTE_ERROR]", error);
        return NextResponse.json({ 
            error: error.message || "An unexpected error occurred generating billing portal session." 
        }, { status: 500 });
    }
}
