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
                <div className="bg-secondary/30 rounded-xl p-4 border border-border text-[10px] text-muted-foreground h-40 overflow-y-auto leading-relaxed scrollbar-hide">
                    <p className="font-bold text-foreground mb-2 text-xs">Terms of Service & Privacy</p>
                    <div className="space-y-2">
                        <p>By activating your Goalie Card, you enter into a binding agreement with Goalie Card ("the Company"). You acknowledge that Goalie Card is a performance monitoring and athletic development platform.</p>

                        <p className="font-bold text-foreground/80">1. Data Usage & AI Analysis</p>
                        <p>We utilize advanced technical models and AI to analyze your training data, reflections, and performance metrics. This data is used to provide personalized feedback and insights. You grant Goalie Card a non-exclusive license to use this data for service improvement and aggregated research.</p>

                        <p className="font-bold text-foreground/80">2. Privacy & Sharing</p>
                        <p>Your data is strictly shared with assigned coaches, guardians, and organizations you are affiliated with. We do not sell your personal data to third parties. For users under 18, guardian consent is mandatory and verified through parent email linkage.</p>

                        <p className="font-bold text-foreground/80">3. Liability Waiver</p>
                        <p>Athletic training involves inherent risks. Goalie Card is a tool for development and does not replace qualified medical advice or supervised physical training. You assume all risks associated with the implementation of AI-generated suggestions.</p>

                        <p className="font-bold text-foreground/80">4. Community Guidelines</p>
                        <p>You agree to provide honest reflections and maintain professional conduct when interacting with the AI Coach and human staff. Misuse of the platform may lead to account suspension.</p>
                    </div>
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
