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
        const customerId = session.customer as string;

        // Capture customer ID and update private_training_submissions & users tables
        if (customerId) {
            try {
                // 1. Update stripe_customer_id in private_training_submissions where stripe_session_id matches session.id
                const { data: updatedSubs, error: subErr } = await supabase
                    .from('private_training_submissions')
                    .update({ stripe_customer_id: customerId })
                    .eq('stripe_session_id', session.id)
                    .select('email');

                if (subErr) {
                    console.error("Failed to update stripe_customer_id in private_training_submissions:", subErr);
                }

                // 2. Also write it to public.users.stripe_customer_id if a matching user record exists (match by email)
                const email = (updatedSubs && updatedSubs[0]?.email) || session.customer_details?.email || metadata.email;
                if (email) {
                    const { error: userUpdateError } = await supabase
                        .from('users')
                        .update({ stripe_customer_id: customerId })
                        .eq('email', email.toLowerCase());

                    if (userUpdateError) {
                        console.error("Failed to sync stripe_customer_id to public.users:", userUpdateError);
                    }
                }
            } catch (err) {
                console.error("Error processing customer ID sync in webhook:", err);
            }
        }

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
                const { data: subData, error: subError } = await supabase.from('private_training_submissions').update({
                    payment_status: 'paid',
                    status: 'paid',
                    stripe_payment_intent_id: session.payment_intent as string,
                    stripe_customer_id: customerId,
                    notes: `Stripe Session Completed: ${session.id}`
                }).eq('id', submissionId).select('athlete_name, email, digital_signature').single();
                
                if (subError) {
                    console.error("Private training submission sync error:", subError);
                } else if (subData && process.env.RESEND_API_KEY) {
                    try {
                        let receiptUrl = '';
                        if (session.payment_intent) {
                            try {
                                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
                                if (paymentIntent.latest_charge) {
                                    const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
                                    receiptUrl = charge.receipt_url || '';
                                }
                            } catch (e) {
                                console.error("Failed to fetch receipt url:", e);
                            }
                        }

                        const fromEmail = process.env.EMAIL_FROM_ADDRESS || "Goalie Card Private Training <onboarding@resend.dev>";
                        
                        await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                            },
                            body: JSON.stringify({
                                from: fromEmail,
                                to: ["e@cmmncreators.com", subData.email],
                                subject: `Private Training Waiver Confirmation: ${subData.athlete_name}`,
                                html: `
                                    <h2>Private Training Waiver Confirmed</h2>
                                    <p><strong>Athlete:</strong> ${subData.athlete_name}</p>
                                    <p><strong>Email:</strong> ${subData.email}</p>
                                    <p><strong>Plan:</strong> ${metadata.planSelected || 'Unknown'}</p>
                                    ${receiptUrl ? `<p><strong>Receipt/Invoice:</strong> <a href="${receiptUrl}">View Receipt</a></p>` : ''}
                                    <hr />
                                    <h3>Digital Signature</h3>
                                    <p><em>"${subData.digital_signature || 'Not provided'}"</em></p>
                                    <p>User accepted all required waivers: Liability Release, Payment Policy, Code of Conduct, and Extended Liability Waiver.</p>
                                `
                            }),
                        });
                    } catch (emailError) {
                        console.error("Failed to send waiver email:", emailError);
                    }
                }
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
