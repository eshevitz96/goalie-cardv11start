
"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase/client";
import { checkUserStatus } from "@/app/actions";

// Components
import { ActivateEmailStep } from "@/components/activate/ActivateEmailStep";
import { ActivateProfileWizard, type ProfilePayload } from "@/components/activate/ActivateProfileWizard";
import { ActivateBaselineStep } from "@/components/activate/ActivateBaselineStep";
import { ActivateSecurityStep } from "@/components/activate/ActivateSecurityStep";
import { BrandPulse, InstitutionalSpinner } from "@/components/ui/Loaders";
import { createInitialProfile, completeActivationWithPassword } from "./actions";

function ActivateController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Redirect Check: send logged-in users straight to /dashboard
    useEffect(() => {
        async function runRedirectCheck() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.replace('/dashboard');
            }
        }
        runRedirectCheck();
    }, [router]);

    // State
    const [step, setStep] = useState<'email' | 'security' | 'success'>('email');
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [rosterData, setRosterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoChecked, setAutoChecked] = useState(false);
    const [error, setError] = useState<string | React.ReactNode | null>(null);

    const [password, setPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    // --- Handlers ---

    const handleEmailNext = (status: { exists: boolean, rosterStatus: 'found' | 'not_found' | 'linked' | 'error', isClaimed?: boolean }) => {
        if (status.exists || status.rosterStatus === 'linked') {
            setError(null);
            router.push(`/login?email=${encodeURIComponent(email)}`);
        } else {
            // New user or roster found - proceed straight to security password step
            setError(null);
            setStep('security');
        }
    };

    const handleFinalActivation = async () => {
        if (!password) return;
        if (!termsAccepted) {
            setError("Please accept the terms to continue.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const trimmedEmail = email.toLowerCase().trim();
            const result = await completeActivationWithPassword(
                trimmedEmail,
                password
            );

            if (!result.success) throw new Error(result.error);
            window.location.href = '/dashboard';
        } catch (err: any) {
            if (err.message && (err.message.includes('already registered') || err.message.includes('already exists') || err.message.includes('already in use'))) {
                setError(
                    <span>
                        An account already exists with this email —{' '}
                        <a href={`/login?email=${encodeURIComponent(email)}`} className="underline font-bold text-primary">
                            log in instead
                        </a>.
                    </span>
                );
            } else {
                setError(err.message || "Signup failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initialEmail = searchParams.get('email');
        if (initialEmail && step === 'email') {
            const initCheck = async () => {
                const status = await checkUserStatus(initialEmail);
                handleEmailNext(status as any);
            };
            initCheck();
        }
    }, [searchParams, step]);

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">

                {step === 'email' && (
                    <ActivateEmailStep
                        email={email}
                        setEmail={setEmail}
                        onNext={handleEmailNext}
                        onError={(msg) => setError(msg)}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        autoChecked={autoChecked}
                        error={error}
                    />
                )}

                {step === 'security' && (
                    <ActivateSecurityStep
                        password={password}
                        setPassword={setPassword}
                        termsAccepted={termsAccepted}
                        setTermsAccepted={setTermsAccepted}
                        onSubmit={handleFinalActivation}
                        isLoading={isLoading}
                        error={error}
                    />
                )}

                {step === 'success' && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-12">
                            <BrandPulse size={100} />
                        </div>
                        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tighter uppercase">Initializing Card</h2>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mb-8 opacity-40">
                            Synchronizing with Institutional Vault...
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><InstitutionalSpinner size={40} /></div>}>
            <ActivateController />
        </Suspense>
    );
}
