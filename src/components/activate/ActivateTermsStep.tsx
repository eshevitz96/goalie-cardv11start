"use client";

import { useState } from "react";
import { Loader2, Check, FileText, ArrowRight } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { clsx } from "clsx";

interface ActivateTermsStepProps {
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    onSubmit: () => void;
    error: string | null;
    isLoading: boolean;
}

export function ActivateTermsStep({ termsAccepted, setTermsAccepted, onSubmit, error, isLoading }: ActivateTermsStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                    <GoalieGuardLogo size={32} className="text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter font-black">Final Step</h1>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 border border-border text-xs text-muted-foreground h-48 overflow-y-auto leading-relaxed shadow-inner">
                <p className="font-bold text-foreground mb-2">Terms of Service</p>
                <p className="mb-2">By accessing GoalieGuard, you agree to our standard liability waiver and data privacy policies. We use AI to analyze performance and provide feedback.</p>
                <p className="mb-2">Data collected includes game stats, journal entries, and self-reported metrics. This data is shared with your assigned coaches and guardians.</p>
                <p>You agree to maintain a respectful environment and use the tools provided for athletic development purposes only.</p>
            </div>

            <div
                onClick={() => setTermsAccepted(!termsAccepted)}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
            >
                <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all", termsAccepted ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-background")}>
                    {termsAccepted && <Check size={14} />}
                </div>
                <div className="font-bold text-sm text-foreground">I Accept the Terms & Conditions</div>
            </div>

            {error && <div className="text-red-500 text-sm text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

            <button
                onClick={onSubmit}
                className={clsx(
                    "w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg",
                    termsAccepted && !isLoading ? "bg-foreground text-background hover:bg-foreground/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                disabled={!termsAccepted || isLoading}
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Activate Account <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}
