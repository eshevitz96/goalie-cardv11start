"use client";

import { useState } from "react";
import { Loader2, ArrowRight, AlertCircle, Check } from "lucide-react";
import { clsx } from "clsx";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface ActivateSecurityStepProps {
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string | React.ReactNode | null;
}

export function ActivateSecurityStep({
    termsAccepted,
    setTermsAccepted,
    onSubmit,
    isLoading,
    error
}: ActivateSecurityStepProps) {
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!termsAccepted) {
            setLocalError("Please accept the terms to continue.");
            return;
        }

        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 flex flex-col items-start gap-4">
                <BrandLogo />
                <h2 className="text-xl font-bold text-foreground/80 tracking-tight">
                    Activate Your Card
                </h2>
                <p className="text-muted-foreground text-xs leading-normal">
                    Accept the terms to generate a secure activation link for your email address.
                </p>
            </div>

            <div className="space-y-4">
                <div className="bg-secondary/30 rounded-xl p-4 border border-border text-[10px] text-muted-foreground h-40 overflow-y-auto leading-relaxed scrollbar-hide space-y-2">
                    <p className="font-bold text-foreground mb-2 text-xs">Terms of Service & Data Consent</p>
                    <p>
                        <strong className="text-foreground">1. Privacy & Sharing:</strong> Your data is private to you. Your coach sees film, reflections, and training only when you choose to share them. Linked parents or guardians can see their athlete&apos;s account. We use secure third-party service providers to run the app and generate training insights; they process data only to provide these services. We do not sell personal data.
                    </p>
                    <p>
                        <strong className="text-foreground">2. Automated Processing & Training Insights:</strong> To provide personalized training recommendations, workload analysis, and performance insights, your workout logs, reflections, and athletic metrics are processed using automated computational systems and secure third-party service providers. These automated suggestions do not replace qualified medical advice, physical therapy, or in-person coaching supervision.
                    </p>
                    <p>
                        <strong className="text-foreground">3. Minors & Guardian Consent:</strong> If you are under 18, a parent or guardian must complete or approve this sign-up. Parents and guardians consenting on behalf of minors acknowledge and authorize this data processing.
                    </p>
                    <p>
                        <strong className="text-foreground">4. Liability Waiver:</strong> Athletic training carries inherent physical risks. You assume all risks associated with executing any recommended exercises, drills, or training sessions.
                    </p>
                </div>

                <div
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                >
                    <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-all", termsAccepted ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-background")}>
                        {termsAccepted && <Check size={12} />}
                    </div>
                    <div className="font-bold text-xs text-foreground">I Accept the Terms & Conditions</div>
                </div>
            </div>

            {(error || localError) && (
                <div className="text-red-500 text-sm flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> 
                    <div>{error || localError}</div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 text-md font-bold uppercase tracking-widest rounded-2xl shadow-xl bg-primary text-white hover:scale-[1.02] transition-transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="animate-spin text-white" size={20} /> : <>Activate Card <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}
