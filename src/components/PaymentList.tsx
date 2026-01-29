"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Clock, CreditCard } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase/client";

export function PaymentList({ rosterId }: { rosterId?: string }) {
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecentPayments = async () => {
            // Prioritize Roster ID (from Admin Upload) because Webhook saves it there
            if (rosterId) {
                const { data } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('goalie_id', rosterId)
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (data) setPayments(data);
                return;
            }

            // Fallback to Auth User ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('goalie_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) {
                setPayments(data);
            }
        };
        fetchRecentPayments();
    }, [rosterId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-end justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="text-accent" />
                    Payment History
                </h3>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stripe Secure</span>
            </div>

            <div className="space-y-3">
                {payments.length === 0 ? (
                    <div className="bg-card/50 border border-border p-4 rounded-xl text-center text-muted-foreground text-sm">
                        No payment history found.
                    </div>
                ) : (
                    payments.map((payment, index) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden bg-card/50 border border-border p-4 rounded-xl flex items-center justify-between hover:bg-muted/80 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        payment.status === "succeeded"
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-amber-500/10 text-amber-500"
                                    )}
                                >
                                    {payment.status === "succeeded" ? (
                                        <ArrowUpRight size={20} />
                                    ) : (
                                        <Clock size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className="text-foreground font-bold">{new Date(payment.created_at).toLocaleDateString()}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <span>{payment.stripe_payment_intent_id?.slice(-8) || 'Stripe'}</span>
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                        <span className="text-muted-foreground">{payment.description || 'Payment'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-foreground">{formatCurrency(payment.amount)}</div>
                                <div
                                    className={clsx(
                                        "text-xs font-medium uppercase tracking-wider",
                                        payment.status === "succeeded" ? "text-emerald-500" : "text-amber-500"
                                    )}
                                >
                                    {payment.status}
                                </div>
                            </div>
                        </motion.div>
                    )))}
            </div>

            <Link href="/parent/payments" className="w-full mt-4 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-all text-sm font-medium flex items-center justify-center">
                View All Transactions
            </Link>
        </div>
    );
}
