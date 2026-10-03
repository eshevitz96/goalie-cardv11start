"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";

export interface TransactionItem {
    id: string;
    date: number; // timestamp ms
    amount: number; // cents
    amountRefunded: number; // cents
    netAmount: number; // cents
    isRefunded: boolean;
    isPartialRefund: boolean;
    status: 'succeeded' | 'refunded' | 'partially_refunded' | 'pending' | 'failed';
    description: string;
    receiptUrl: string | null;
    paymentMethodBrand?: string | null;
    paymentMethodLast4?: string | null;
    refunds?: Array<{
        id: string;
        amount: number;
        created: number;
        reason?: string | null;
    }>;
}

export interface InvoiceItem {
    id: string;
    number: string | null;
    date: number;
    amountPaid: number;
    amountDue: number;
    status: string | null;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
}

export interface ParentBillingData {
    success: boolean;
    error?: string;
    customerFound: boolean;
    customerId?: string;
    customerEmail?: string;
    totalSpend: number; // net total in cents
    transactions: TransactionItem[];
    invoices: InvoiceItem[];
}

export async function fetchParentBillingData(): Promise<ParentBillingData> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return {
                success: false,
                error: "Unauthorized. Please sign in to view billing history.",
                customerFound: false,
                totalSpend: 0,
                transactions: [],
                invoices: []
            };
        }

        const userEmail = user.email.trim().toLowerCase();

        // 1. Look up stripe_customer_id in private_training_submissions
        let customerId: string | null = null;
        const { data: submission } = await supabase
            .from('private_training_submissions')
            .select('stripe_customer_id')
            .or(`email.ilike.${userEmail},guardian_email.ilike.${userEmail}`)
            .not('stripe_customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (submission?.stripe_customer_id) {
            customerId = submission.stripe_customer_id;
        }

        // 2. Fallback: Search directly in Stripe for customer by email
        if (!customerId) {
            try {
                const customers = await stripe.customers.list({
                    email: userEmail,
                    limit: 1
                });
                if (customers.data && customers.data.length > 0) {
                    customerId = customers.data[0].id;
                }
            } catch (err) {
                console.warn("[fetchParentBillingData] Stripe customer lookup warning:", err);
            }
        }

        if (!customerId) {
            return {
                success: true,
                customerFound: false,
                customerEmail: userEmail,
                totalSpend: 0,
                transactions: [],
                invoices: []
            };
        }

        // 3. Fetch charges from Stripe
        const chargesPromise = stripe.charges.list({
            customer: customerId,
            limit: 100
        });

        // 4. Fetch invoices from Stripe
        const invoicesPromise = stripe.invoices.list({
            customer: customerId,
            limit: 100
        });

        const [chargesRes, invoicesRes] = await Promise.all([chargesPromise, invoicesPromise]);

        const transactions: TransactionItem[] = chargesRes.data.map((charge) => {
            const amount = charge.amount || 0;
            const amountRefunded = charge.amount_refunded || 0;
            const netAmount = Math.max(0, amount - amountRefunded);
            const isRefunded = charge.refunded || (amountRefunded >= amount && amount > 0);
            const isPartialRefund = !isRefunded && amountRefunded > 0;

            let status: TransactionItem['status'] = 'succeeded';
            if (isRefunded) {
                status = 'refunded';
            } else if (isPartialRefund) {
                status = 'partially_refunded';
            } else if (charge.status === 'failed') {
                status = 'failed';
            } else if (charge.status === 'pending') {
                status = 'pending';
            }

            const card = (charge.payment_method_details as any)?.card;

            const refunds = charge.refunds?.data?.map((ref: any) => ({
                id: ref.id,
                amount: ref.amount,
                created: ref.created * 1000,
                reason: ref.reason
            })) || [];

            const desc = charge.description 
                || (charge.receipt_number ? `Receipt #${charge.receipt_number}` : '') 
                || (charge.billing_details?.name ? `Training Fee - ${charge.billing_details.name}` : 'GoalieCard Training Session');

            return {
                id: charge.id,
                date: charge.created * 1000,
                amount,
                amountRefunded,
                netAmount,
                isRefunded,
                isPartialRefund,
                status,
                description: desc,
                receiptUrl: charge.receipt_url || null,
                paymentMethodBrand: card?.brand || null,
                paymentMethodLast4: card?.last4 || null,
                refunds
            };
        });

        const invoices: InvoiceItem[] = invoicesRes.data.map((inv) => ({
            id: inv.id,
            number: inv.number,
            date: (inv.created || 0) * 1000,
            amountPaid: inv.amount_paid || 0,
            amountDue: inv.amount_due || 0,
            status: inv.status,
            hostedInvoiceUrl: inv.hosted_invoice_url || null,
            invoicePdf: inv.invoice_pdf || null,
        }));

        // Calculate net total spend across all successful charges
        const totalSpend = transactions
            .filter(tx => tx.status === 'succeeded' || tx.status === 'partially_refunded')
            .reduce((acc, tx) => acc + tx.netAmount, 0);

        return {
            success: true,
            customerFound: true,
            customerId,
            customerEmail: userEmail,
            totalSpend,
            transactions,
            invoices
        };
    } catch (error: any) {
        console.error("[fetchParentBillingData] Error:", error);
        return {
            success: false,
            error: error.message || "Failed to retrieve billing records from Stripe.",
            customerFound: false,
            totalSpend: 0,
            transactions: [],
            invoices: []
        };
    }
}
