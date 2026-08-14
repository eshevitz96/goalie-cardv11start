"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { InstitutionalSpinner } from "@/components/ui/Loaders";

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

    if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground"><InstitutionalSpinner size={40} /></div>;

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        BILLING <span className="text-primary">HISTORY</span>
                    </h1>
                </div>

                {/* Transactions list */}
                <div className="bg-card/20 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-border">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Spend (YTD)</div>
                                <div className="text-3xl font-black text-foreground">{formatCurrency(totalSpend)}</div>
                            </div>
                            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Download size={14} /> Download All
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No transactions found.</div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-secondary/20 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground">{tx.description || "Payment"}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleDateString()} • {tx.stripe_payment_intent_id?.slice(-8) || "ID-XXXX"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-foreground">{formatCurrency(tx.amount)}</div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
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
