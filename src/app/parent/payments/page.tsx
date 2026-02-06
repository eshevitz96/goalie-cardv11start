"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalSpend, setTotalSpend] = useState(0);

    useEffect(() => {
        const fetchPayments = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('goalie_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setTransactions(data);
                const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                setTotalSpend(total);
            }
            setIsLoading(false);
        };
        fetchPayments();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount / 100);
    };

    if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/parent"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        BILLING <span className="text-primary">HISTORY</span>
                    </h1>
                </div>

                {/* Transactions list */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Spend (YTD)</div>
                                <div className="text-3xl font-black text-white">{formatCurrency(totalSpend)}</div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline h-auto p-0 hover:bg-transparent"
                            >
                                <Download size={14} /> Download All
                            </Button>
                        </div>
                    </div>

                    <div className="divide-y divide-zinc-800">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">No transactions found.</div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-800/20 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{tx.description || "Payment"}</div>
                                            <div className="text-xs text-zinc-500">
                                                {new Date(tx.created_at).toLocaleDateString()} • {tx.stripe_payment_intent_id?.slice(-8) || "ID-XXXX"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-white">{formatCurrency(tx.amount)}</div>
                                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">
                                            {tx.status}
                                        </div>
                                    </div>
                                </div>
                            )))}
                    </div>
                </div>
            </div>
        </main>
    );
}
