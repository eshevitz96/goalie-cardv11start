
"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { sendMagicLink } from "@/app/auth/actions";
import { ActivateSelectGoalieStep } from "@/components/activate/ActivateSelectGoalieStep";

function ActivateController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Redirect Check: send logged-in users straight to /dashboard ONLY if they have a linked card
    useEffect(() => {
        async function runRedirectCheck() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // If they are logged in, check if they already have a linked roster card
                const { data: rosterCheck } = await supabase
                    .from('roster_uploads')
                    .select('id')
                    .eq('linked_user_id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (rosterCheck) {
                    // Already linked - send to dashboard
                    router.replace('/dashboard');
                } else {
                    // Not linked yet! Let them stay on activate to select/link a card.
                    setIsLoading(true);
                    setEmail(user.email || "");
                    try {
                        const status = await checkUserStatus(user.email || "");
                        if (status.rosterStatus === 'multiple_found') {
                            setMatchedRosters(status.rosters || []);
                            setStep('select_goalie');
                        } else if (status.rosterStatus === 'found') {
                            // Single match found - link it directly
                            await completeActivationWithPassword(
                                user.email || "",
                                "", // no password needed
                                status.rosterId
                            );
                            window.location.href = '/dashboard';
                        } else {
                            // No card found, send to dashboard anyway
                            router.replace('/dashboard');
                        }
                    } catch (e) {
                        console.error("Failed to check status for logged-in user:", e);
                        router.replace('/dashboard');
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        }
        runRedirectCheck();
    }, [router]);

    // State
    const [step, setStep] = useState<'email' | 'select_goalie' | 'security' | 'success'>('email');
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [rosterData, setRosterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoChecked, setAutoChecked] = useState(false);
    const [error, setError] = useState<string | React.ReactNode | null>(null);

    const [password, setPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [matchedRosters, setMatchedRosters] = useState<any[]>([]);
    const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);

    // --- Handlers ---

    const handleEmailNext = (status: any) => {
        if (status.exists || status.rosterStatus === 'linked') {
            setError(null);
            router.push(`/login?email=${encodeURIComponent(email)}`);
        } else if (status.rosterStatus === 'multiple_found') {
            setError(null);
            setMatchedRosters(status.rosters || []);
            setStep('select_goalie');
        } else {
            // New user or single roster found - proceed straight to security password step
            setError(null);
            if (status.rosterId) {
                setSelectedRosterId(status.rosterId);
            } else {
                setSelectedRosterId(null);
            }
            setStep('security');
        }
    };

    const handleFinalActivation = async () => {
        if (!termsAccepted) {
            setError("Please accept the terms to continue.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const trimmedEmail = email.toLowerCase().trim();
            const result = await sendMagicLink(trimmedEmail);

            if (!result.success) throw new Error(result.error);
            setStep('success');
        } catch (err: any) {
            setError(err.message || "Activation failed. Please try again.");
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

                {step === 'select_goalie' && (
                    <ActivateSelectGoalieStep
                        rosters={matchedRosters}
                        onSelect={async (rosterId) => {
                            setSelectedRosterId(rosterId);
                            // If they are already authenticated, we link it now and go to dashboard
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                setIsLoading(true);
                                try {
                                    await completeActivationWithPassword(
                                        email,
                                        "", // no password needed
                                        rosterId
                                    );
                                    window.location.href = '/dashboard';
                                } catch (e: any) {
                                    setError(e.message || "Failed to link card. Please try again.");
                                } finally {
                                    setIsLoading(false);
                                }
                            } else {
                                setStep('security');
                            }
                        }}
                        onBack={() => setStep('email')}
                        isLoading={isLoading}
                    />
                )}

                {step === 'security' && (
                    <ActivateSecurityStep
                        termsAccepted={termsAccepted}
                        setTermsAccepted={setTermsAccepted}
                        onSubmit={handleFinalActivation}
                        isLoading={isLoading}
                        error={error}
                    />
                )}

                {step === 'success' && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(15,41,66,0.05)] relative overflow-hidden">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <CheckCircle2 size={32} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tighter">Transmission Sent</h2>
                        <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto uppercase font-bold tracking-tight mb-8">
                            A secure activation link has been sent to <span className="text-foreground">{email}</span>. Check your inbox to claim your card.
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
