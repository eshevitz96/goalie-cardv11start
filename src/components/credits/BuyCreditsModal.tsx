
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { addCredits } from "@/app/credits/actions";
import { Check, Star, CreditCard } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    rosterId: string;
    onSuccess: (newBalance: number) => void;
}

const PACKAGES = [
    { credits: 1, cost: 85, label: "Single Lesson", popular: false },
    { credits: 5, cost: 400, label: "5-Pack", popular: true, savings: "Save $25" },
    { credits: 10, cost: 750, label: "10-Pack", popular: false, savings: "Save $100" }
];

export function BuyCreditsModal({ isOpen, onClose, rosterId, onSuccess }: BuyCreditsModalProps) {
    const toast = useToast();
    const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const handlePurchase = async () => {
        if (selectedPkg === null || !rosterId) return;

        setProcessing(true);
        // Simulate Stripe Checkout API Call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const pkg = PACKAGES[selectedPkg];

        // TODO: In real app, this would be a webhook or callback after payment
        // Calling server action to add credits
        const result = await addCredits(rosterId, pkg.credits, "simulated_stripe_id");

        if (result.success) {
            toast.success(`Purchased ${pkg.credits} Credits!`);
            onSuccess(result.balance);
            onClose();
        } else {
            toast.error("Purchase Failed: " + result.error);
        }
        setProcessing(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Purchase Training Credits" size="md">
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Select a credit package to book your sessions.</p>
                </div>

                <div className="grid gap-3">
                    {PACKAGES.map((pkg, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedPkg(idx)}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between
                                ${selectedPkg === idx
                                    ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                                    : 'border-border bg-card hover:border-primary/50'
                                }
                            `}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                    <Star size={8} fill="currentColor" /> Most Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedPkg === idx ? 'bg-primary border-primary' : 'border-border'}`}>
                                    {selectedPkg === idx && <Check size={12} className="text-primary-foreground" />}
                                </div>
                                <div>
                                    <div className="font-bold text-foreground text-sm">{pkg.label}</div>
                                    {pkg.savings && <div className="text-xs text-green-500 font-bold">{pkg.savings}</div>}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-lg font-black text-foreground">${pkg.cost}</div>
                                <div className="text-xs text-muted-foreground">{pkg.credits} Credit{pkg.credits > 1 ? 's' : ''}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-border">
                    {selectedPkg !== null && (
                        <div className="mb-4 space-y-2 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${PACKAGES[selectedPkg].cost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax (8.9%)</span>
                                <span>${(PACKAGES[selectedPkg].cost * 0.089).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                                <span>Total</span>
                                <span>${(PACKAGES[selectedPkg].cost * 1.089).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handlePurchase}
                        disabled={selectedPkg === null || processing}
                        className="w-full py-4 text-base font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {processing ? "Processing..." : (
                            <>
                                <CreditCard size={18} />
                                {selectedPkg !== null
                                    ? `Pay $${(PACKAGES[selectedPkg].cost * 1.089).toFixed(2)}`
                                    : "Select Package"}
                            </>
                        )}
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
                        <span className="w-3 h-3 bg-gray-400 rounded-full opacity-50" /> Secure Payment via Stripe
                    </p>
                </div>
            </div>
        </Modal>
    );
}
