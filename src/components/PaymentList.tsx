"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Clock, CreditCard } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase/client";

export function PaymentList() {
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecentPayments = async () => {
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
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-end justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="text-accent" />
                    Payment History
                </h3>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stripe Secure</span>
            </div>

            <div className="space-y-3">
                {payments.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-center text-zinc-500 text-sm">
                        No payment history found.
                    </div>
                ) : (
                    payments.map((payment, index) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
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
                                    <div className="text-white font-bold">{new Date(payment.created_at).toLocaleDateString()}</div>
                                    <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                                        <span>{payment.stripe_payment_intent_id?.slice(-8) || 'Stripe'}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                        <span className="text-zinc-400">{payment.description || 'Payment'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-white">{formatCurrency(payment.amount)}</div>
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

            <Link href="/parent/payments" className="w-full mt-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm font-medium flex items-center justify-center">
                View All Transactions
            </Link>
        </div>
    );
}
