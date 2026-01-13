"use client";

import { motion } from "framer-motion";
import { CreditCard, ArrowUpRight, Clock } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

const MOCK_PAYMENTS = [
    { id: 1, date: "Oct 1, 2023", amount: "$250.00", status: "succeeded", method: "Visa •••• 4242", goalie: "Leo Vance" },
    { id: 2, date: "Sep 1, 2023", amount: "$250.00", status: "succeeded", method: "Visa •••• 4242", goalie: "Jamie Vance" },
    { id: 3, date: "Aug 1, 2023", amount: "$250.00", status: "succeeded", method: "Visa •••• 4242", goalie: "Leo Vance" },
    { id: 4, date: "Nov 1, 2023", amount: "$250.00", status: "upcoming", method: "Visa •••• 4242", goalie: "Jamie Vance" },
];

export function PaymentList() {
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
                {MOCK_PAYMENTS.map((payment, index) => (
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
                                <div className="text-white font-bold">{payment.date}</div>
                                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                                    <span>{payment.method}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                    <span className="text-zinc-400">{payment.goalie}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-white">{payment.amount}</div>
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
                ))}
            </div>

            <Link href="/parent/payments" className="w-full mt-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all text-sm font-medium flex items-center justify-center">
                View All Transactions
            </Link>
        </div>
    );
}
