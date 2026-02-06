"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const PACKAGES = [
    { id: 1, name: "Single Session", price: 150, saves: 0 },
    { id: 2, name: "Standard 4-Pack", price: 500, saves: 100, recommended: true },
    { id: 3, name: "Pro 10-Pack", price: 1200, saves: 300 },
];

export default function RenewSession() {
    const [selectedPack, setSelectedPack] = useState(2);
    const [waiverAccepted, setWaiverAccepted] = useState(false);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/parent"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        RENEW <span className="text-primary">SESSIONS</span>
                    </h1>
                </div>

                {/* Package Selection */}
                <div className="grid gap-4">
                    {PACKAGES.map((pack) => (
                        <div
                            key={pack.id}
                            onClick={() => setSelectedPack(pack.id)}
                            className={`relative p-6 border rounded-3xl cursor-pointer transition-all ${selectedPack === pack.id
                                ? "bg-zinc-900 border-primary shadow-lg shadow-primary/10"
                                : "bg-black border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                }`}
                        >
                            {pack.recommended && (
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    Best Value
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className={`font-bold text-lg ${selectedPack === pack.id ? 'text-white' : 'text-zinc-300'}`}>{pack.name}</h3>
                                    {pack.saves > 0 && <span className="text-xs font-bold text-green-500">Save ${pack.saves}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-bold font-mono">${pack.price}</div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedPack === pack.id ? "bg-primary border-primary text-white" : "border-zinc-600"
                                        }`}>
                                        {selectedPack === pack.id && <Check size={14} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Waiver & Checkout */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                    <h3 className="tex-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="text-primary" />
                        Terms & Conditions
                    </h3>

                    <div className="h-32 bg-black border border-zinc-800 rounded-xl p-4 overflow-y-auto text-xs text-zinc-400 space-y-2">
                        <p><strong>1. Liability Waiver:</strong> I hereby release Goalie Card and its staff from any liability regarding injuries sustained during training.</p>
                        <p><strong>2. Cancellation Policy:</strong> Sessions must be cancelled at least 24 hours in advance to receive a credit. No refunds for missed sessions.</p>
                        <p><strong>3. Media Release:</strong> I consent to the use of video/photo for analysis and promotional purposes.</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className={`mt-0.5 w-5 h-5 rounded border border-zinc-600 flex items-center justify-center shrink-0 transition-colors ${waiverAccepted ? 'bg-primary border-primary text-white' : 'bg-black group-hover:border-zinc-500'}`}>
                            {waiverAccepted && <Check size={14} />}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={waiverAccepted}
                            onChange={(e) => setWaiverAccepted(e.target.checked)}
                        />
                        <span className="text-sm text-zinc-300 select-none">
                            I have read and agree to the Liability Waiver and Cancellation Policy.
                        </span>
                    </label>

                    <Button
                        disabled={!waiverAccepted}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold shadow-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 h-auto"
                    >
                        <CreditCard size={18} />
                        Pay ${PACKAGES.find(p => p.id === selectedPack)?.price}
                    </Button>
                </div>
            </div>
        </main>
    );
}
