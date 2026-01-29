import { stripe } from "@/lib/stripe";
import { supabase } from "@/utils/supabase/client"; // Note: In API routes, use createClient logic usually, but here I'll assume auth header or pass generic info.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { priceId, email, userId, returnUrl, mode } = body;

        if (!priceId || !userId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: mode || "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: email,
            metadata: {
                userId,
            },
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
