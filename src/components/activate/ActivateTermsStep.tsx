"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { LegalAgreementModule } from "@/components/legal/LegalAgreementModule";
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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto">
            <div className="text-center mb-8 pt-6">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-2xl">
                    <GoalieGuardLogo size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-2">Legal Master Agreement</h1>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    By activating your Dashboard, you agree to the following mandatory safety and data standards.
                </p>
            </div>

            <LegalAgreementModule 
                showSubmit={true}
                submitLabel="Activate My Hub"
                isSubmitting={isLoading}
                onAccepted={onSubmit}
                error={error}
            />

            <div className="text-center pt-4">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                    © {new Date().getFullYear()} The Goalie Brand · All Rights Reserved
                </p>
            </div>
        </div>
    );
}
