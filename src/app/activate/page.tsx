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

function ActivateController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [step, setStep] = useState<'email' | 'verify_review' | 'baseline' | 'security' | 'success'>('email');
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [rosterData, setRosterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        goalieName: "", parentName: "", parentEmail: "", phone: "",
        gradYear: "", height: "", weight: "", team: "", birthday: "", // YYYY-MM-DD
        sport: "Hockey"
    });

    const [baselineAnswers, setBaselineAnswers] = useState([
        { id: 1, question: "How confident do you feel in your game right now?", answer: "", mood: "neutral" },
        { id: 2, question: "What is your biggest goal for this season?", answer: "", mood: "neutral" },
        { id: 3, question: "What is your biggest frustration currently?", answer: "", mood: "neutral" },
    ]);

    const [password, setPassword] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    // --- Handlers ---

    const handleEmailNext = (status: { exists: boolean, rosterStatus: 'found' | 'not_found' | 'linked' | 'error', isClaimed?: boolean }) => {
        if (status.exists || status.rosterStatus === 'linked') {
            router.push('/login?email=' + email);
        } else if (status.rosterStatus === 'found') {
            fetchRosterAndProceed();
        } else {
            // New user - start with fresh form
            setStep('verify_review');
        }
    };

    const fetchRosterAndProceed = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('roster_uploads')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

        if (data) {
            setRosterData(data);
            setFormData(prev => ({
                ...prev,
                goalieName: data.goalie_name || "",
                parentName: data.parent_name || "",
                phone: data.parent_phone || "",
                gradYear: data.grad_year?.toString() || "",
                team: data.team || "",
            }));
            setStep('verify_review');
        } else {
            setStep('verify_review');
        }
        setIsLoading(false);
    };

    const handleProfileWizardSubmit = async (profile: ProfilePayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const height = profile.heightFt && profile.heightIn
                ? `${profile.heightFt}'${profile.heightIn}"`
                : profile.heightFt ? `${profile.heightFt}'0"` : '';

            const updates = {
                goalie_name: profile.goalieName,
                parent_name: profile.parentName,
                parent_phone: profile.guardianPhone,
                guardian_email: profile.guardianEmail,
                guardian_phone: profile.guardianPhone,
                athlete_email: profile.athleteEmail,
                athlete_phone: profile.athletePhone,
                grad_year: parseInt(profile.gradYear) || null,
                height,
                weight: profile.weight,
                catch_hand: profile.catchHand,
                birthday: profile.birthday,
            };

            // Update form state for downstream use
            setFormData(prev => ({
                ...prev,
                goalieName: profile.goalieName,
                parentName: profile.parentName,
                phone: profile.guardianPhone,
                gradYear: profile.gradYear,
                height,
                weight: profile.weight,
                birthday: profile.birthday,
            }));

            if (rosterData?.id) {
                await supabase.from('roster_uploads').update(updates).eq('id', rosterData.id);
            } else {
                const { createInitialProfile } = await import('./actions');
                const result = await createInitialProfile(email);
                if (result.success) setRosterData(result.data);
            }

            setStep('baseline');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBaselineSubmit = () => setStep('security');

    const handleFinalActivation = async () => {
        if (!password) return;
        if (!termsAccepted) {
            setError("Please accept the terms to continue.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const { completeActivationWithPassword } = await import('./actions');
            const result = await completeActivationWithPassword(
                email,
                password,
                rosterData.id,
                rosterData,
                formData,
                baselineAnswers
            );

            if (!result.success) throw new Error(result.error);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message);
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

    const stepInfo = {
        email: { index: 1, title: "Identity" },
        verify_review: { index: 2, title: "Profile" },
        baseline: { index: 3, title: "Baseline" },
        security: { index: 4, title: "Security" },
        success: { index: 4, title: "Ready" }
    };

    const currentStep = stepInfo[step];

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Progress Indicator */}
                {step !== 'success' && (
                    <div className="mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                            <span>Step {currentStep.index} of 4</span>
                            <span className="text-primary">{currentStep.title}</span>
                        </div>
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep.index / 4) * 100}%` }}
                                className="h-full bg-primary"
                            />
                        </div>
                    </div>
                )}

                {step === 'email' && (
                    <ActivateEmailStep
                        email={email}
                        setEmail={setEmail}
                        onNext={handleEmailNext}
                        onError={setError}
                    />
                )}

                {step === 'verify_review' && (
                    <ActivateProfileWizard
                        email={email}
                        rosterData={rosterData}
                        onSubmit={handleProfileWizardSubmit}
                        onCancel={() => setStep('email')}
                        isLoading={isLoading}
                        error={error}
                    />
                )}

                {step === 'baseline' && (
                    <ActivateBaselineStep
                        answers={baselineAnswers}
                        setAnswers={setBaselineAnswers}
                        onSubmit={handleBaselineSubmit}
                        isLoading={isLoading}
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
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-3">All Set!</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            You are now being redirected to your dashboard...
                        </p>
                        <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                    </div>
                )}
            </div>
        </main>
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <ActivateController />
        </Suspense>
    );
}
