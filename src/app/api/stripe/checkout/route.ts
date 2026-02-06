import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { priceId, amount, eventId, eventName, email, userId, returnUrl, mode } = body;

        if (!userId) {
            return new NextResponse("Missing userId", { status: 400 });
        }

        let lineItems;

        // Support both pre-created price IDs and dynamic amounts
        if (priceId) {
            lineItems = [{ price: priceId, quantity: 1 }];
        } else if (amount && eventName) {
            // Create a dynamic price for this event
            const price = await stripe.prices.create({
                currency: 'usd',
                unit_amount: amount, // Amount in cents
                product_data: {
                    name: eventName,
                },
            });
            lineItems = [{ price: price.id, quantity: 1 }];
        } else {
            return new NextResponse("Must provide either priceId or (amount + eventName)", { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            mode: mode || "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            customer_email: email,
            metadata: {
                userId,
                eventId: eventId || '',
            },
            success_url: `${returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/goalie`}?success=true`,
            cancel_url: `${returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/goalie`}?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
