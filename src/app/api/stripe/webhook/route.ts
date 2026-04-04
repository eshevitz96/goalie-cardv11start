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
    const signature = headers().get("Stripe-Signature") || "";

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: any) {
        console.error(`[STRIPE_WEBHOOK_ERROR] ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const metadata = session?.metadata || {};
        const userId = metadata.userId;

        // 1. Record General Payment (if possible)
        if (userId) {
            const { error: paymentError } = await supabase.from("payments").insert({
                goalie_id: userId,
                amount: session.amount_total,
                currency: session.currency,
                status: "succeeded",
                stripe_payment_intent_id: session.payment_intent as string,
                description: metadata.productType || "Stripe Checkout",
            });

            if (paymentError) {
                console.error("Supabase payment insert error:", paymentError);
                // We continue because processing the specific logic below is more important
            }
        }

        // 2. Specific Logic based on Metadata Type
        if (metadata.type === 'credit_purchase') {
            if (!userId) {
                console.error("Missing userId for credit_purchase");
                return new NextResponse("Missing userId", { status: 400 });
            }
            const creditAmount = parseInt(metadata.creditAmount || "0");
            if (creditAmount > 0) {
                const { error: creditError } = await supabase.from('credit_transactions').insert({
                    roster_id: userId,
                    amount: creditAmount,
                    transaction_type: 'purchase',
                    description: `Stripe Purchase: ${creditAmount} credits`,
                    stripe_payment_id: session.payment_intent as string
                });
                if (creditError) console.error("Credit dispensing error:", creditError);
            }
        } else if (metadata.type === 'team_credit_purchase') {
            const teamId = metadata.teamId;
            const creditAmount = parseInt(metadata.creditAmount || "0");
            if (teamId && creditAmount > 0) {
                await supabase.from('team_fund_transactions').insert({
                    team_id: teamId,
                    amount: creditAmount,
                    description: `Stripe Top-up: ${creditAmount} credits`,
                    metadata: { stripe_payment_id: session.payment_intent as string }
                });
                const { data: currentFund } = await supabase.from('team_credit_funds').select('balance').eq('team_id', teamId).maybeSingle();
                const newBalance = (currentFund?.balance || 0) + creditAmount;
                await supabase.from('team_credit_funds').upsert({ team_id: teamId, balance: newBalance, last_topup: new Date().toISOString() });
            }
        } else if (metadata.type === 'pro_upgrade') {
            const rosterId = metadata.rosterId;
            const coachId = metadata.coachId;
            const requestId = metadata.requestId;
            if (rosterId && coachId) {
                await supabase.from('roster_uploads').update({ assigned_coach_id: coachId }).eq('id', rosterId);
                if (requestId) await supabase.from('coach_requests').update({ status: 'completed' }).eq('id', requestId);
            }
        } else if (metadata.productType === 'private training access') {
            const submissionId = metadata.submissionId;
            if (submissionId) {
                const { error: subError } = await supabase.from('private_training_submissions').update({
                    payment_status: 'paid',
                    status: 'paid',
                    stripe_payment_intent_id: session.payment_intent as string,
                    notes: `Stripe Session Completed: ${session.id}`
                }).eq('id', submissionId);
                if (subError) console.error("Private training submission sync error:", subError);
            }
        } else if (userId) {
            // Default Activation Flow
            await supabase.from('roster_uploads').update({
                is_claimed: true,
                payment_status: 'paid',
                amount_paid: (session.amount_total || 0) / 100
            }).eq('id', userId);
        }
    }

    return new NextResponse(null, { status: 200 });
}
