"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PACKAGES = [
    { 
        id: 1, 
        name: "Monthly 4-Pack Membership", 
        basePrice: 400, 
        fee: 12.26, 
        totalPrice: 412.26, 
        billingType: "Recurring Monthly",
        isRecurring: true,
        mode: "subscription",
        badge: "Monthly Membership",
        description: "Billed monthly • 4 private training sessions per billing cycle ($100/lesson)",
        recommended: true 
    },
    { 
        id: 2, 
        name: "Single Private Session", 
        basePrice: 125, 
        fee: 4.04, 
        totalPrice: 129.04, 
        billingType: "One-Time Payment",
        isRecurring: false,
        mode: "payment",
        badge: "Pay-As-You-Go",
        description: "One-time session • 1-on-1 private goalie training session (60 mins)",
        recommended: false 
    },
    { 
        id: 3, 
        name: "Pro 10-Pack Block", 
        basePrice: 950, 
        fee: 28.50, 
        totalPrice: 978.50, 
        billingType: "One-Time Payment",
        isRecurring: false,
        mode: "payment",
        badge: "10-Lesson Block",
        description: "One-time payment • 10 private training sessions with full analytics ($95/lesson)",
        recommended: false 
    },
];

export default function RenewSession() {
    const [selectedPack, setSelectedPack] = useState(1);
    const [waiverAccepted, setWaiverAccepted] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const currentPkg = PACKAGES.find(p => p.id === selectedPack) || PACKAGES[0];

    const handleCheckout = async () => {
        if (!waiverAccepted) return;
        setIsCheckingOut(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: `private_${currentPkg.id}`,
                    mode: currentPkg.mode,
                    amount: Math.round(currentPkg.totalPrice * 100),
                    packageName: currentPkg.name,
                    baseAmount: currentPkg.basePrice,
                    feeAmount: currentPkg.fee
                })
            });
            const data = await res.json();
            if (data?.url) {
                window.location.href = data.url;
            } else {
                alert("Redirecting to checkout...");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            setIsCheckingOut(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        TRAINING <span className="text-[#00E676]">PACKAGES & RENEWALS</span>
                    </h1>
                </div>

                {/* Package Selection */}
                <div className="grid gap-4">
                    {PACKAGES.map((pack) => (
                        <div
                            key={pack.id}
                            onClick={() => setSelectedPack(pack.id)}
                            className={`relative p-6 border rounded-3xl cursor-pointer transition-all ${selectedPack === pack.id
                                    ? "bg-zinc-900 border-[#00E676] shadow-lg shadow-[#00E676]/10"
                                    : "bg-black border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                                }`}
                        >
                            {pack.badge && (
                                <div className={`absolute -top-3 left-6 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                    pack.isRecurring ? "bg-[#00E676] text-black" : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                                }`}>
                                    {pack.badge}
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className={`font-bold text-lg ${selectedPack === pack.id ? 'text-white' : 'text-zinc-300'}`}>{pack.name}</h3>
                                    <p className="text-xs text-zinc-400">{pack.description}</p>
                                    <p className="text-[11px] text-zinc-500 font-mono">
                                        ${pack.basePrice} rate + ${pack.fee.toFixed(2)} card fee
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-xl font-bold font-mono text-white">
                                            ${pack.totalPrice.toFixed(2)}{pack.isRecurring ? '/mo' : ''}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 font-medium">{pack.billingType}</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selectedPack === pack.id ? "bg-[#00E676] border-[#00E676] text-black font-bold" : "border-zinc-600"
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

                    <button
                        onClick={handleCheckout}
                        disabled={!waiverAccepted || isCheckingOut}
                        className="w-full py-4 bg-[#00E676] text-black rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-[#00E676]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <CreditCard size={18} />
                        {isCheckingOut ? "Connecting to Checkout..." : `Pay $${currentPkg.totalPrice.toFixed(2)} (${currentPkg.name})`}
                    </button>
                </div>
            </div>
        </main>
    );
}
