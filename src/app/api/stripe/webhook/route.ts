import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    }

    return new NextResponse(null, { status: 200 });
}
