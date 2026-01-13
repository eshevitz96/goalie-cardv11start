"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const TRANSACTIONS = [
    { id: "INV-001", date: "Oct 24, 2024", amount: "$150.00", status: "Paid", item: "Private Lesson (1hr)" },
    { id: "INV-002", date: "Oct 15, 2024", amount: "$150.00", status: "Paid", item: "Private Lesson (1hr)" },
    { id: "INV-003", date: "Oct 01, 2024", amount: "$500.00", status: "Paid", item: "Standard 4-Pack" },
    { id: "INV-004", date: "Sep 20, 2024", amount: "$150.00", status: "Paid", item: "Private Lesson (1hr)" },
];

export default function TransactionHistory() {
    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
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
                                <div className="text-3xl font-black text-white">$2,450.00</div>
                            </div>
                            <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                <Download size={14} /> Download All
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-zinc-800">
                        {TRANSACTIONS.map((tx) => (
                            <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-zinc-800/20 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{tx.item}</div>
                                        <div className="text-xs text-zinc-500">{tx.date} • {tx.id}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-white">{tx.amount}</div>
                                    <button className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end hover:text-white">
                                        <Download size={10} /> PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
