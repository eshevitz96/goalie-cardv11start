import { stripe } from "@/lib/stripe";
import { supabase } from "@/utils/supabase/client"; // Note: In API routes, use createClient logic usually, but here I'll assume auth header or pass generic info.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { priceId, priceData, email, userId, returnUrl, mode, metadata = {} } = body;

        if (!userId || (!priceId && !priceData)) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const lineItems = priceId
            ? [{ price: priceId, quantity: 1 }]
            : [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: priceData.product_name,
                    },
                    unit_amount: priceData.unit_amount,
                },
                quantity: 1,
            }];

        // Stripe requires all metadata values to be strings
        const safeMetadata: Record<string, string> = { userId };
        for (const [key, value] of Object.entries(metadata)) {
            safeMetadata[key] = String(value);
        }

        const sessionConfig: any = {
            mode: mode || "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            metadata: safeMetadata,
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
        };

        if (email) {
            sessionConfig.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
