import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        if (!session?.metadata?.userId) {
            return new NextResponse("Webhook Error: Missing userId in metadata", { status: 400 });
        }

        const { error } = await supabase.from("payments").insert({
            goalie_id: session.metadata.userId,
            amount: session.amount_total,
            currency: session.currency,
            status: "succeeded",
            stripe_payment_intent_id: session.payment_intent as string,
            description: "Stripe Checkout", // Could be dynamic based on line items
        });

        if (error) {
            console.error("Supabase payment insert error:", error);
            return new NextResponse("Database Error", { status: 500 });
        }

        // SYNC: Update Roster Uploads so Admin Dashboard sees it
        // We assume session.metadata.userId is the Roster ID (passed from ActivatePage)
        const { error: rosterError } = await supabase
            .from('roster_uploads')
            .update({
                is_claimed: true,
                payment_status: 'paid',
                amount_paid: (session.amount_total || 0) / 100 // Convert cents to dollars
            })
            .eq('id', session.metadata.userId);

        if (rosterError) {
            console.error("Roster sync error:", rosterError);
            // Don't fail the webhook for this, but log it
        }
    }

    return new NextResponse(null, { status: 200 });
}
