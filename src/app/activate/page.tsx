"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

// Components
import { ActivateEmailStep } from "@/components/activate/ActivateEmailStep";
import { ActivateLookupResult } from "@/components/activate/ActivateLookupResult";
import { ActivateIdentityStep } from "@/components/activate/ActivateIdentityStep";
import { ActivateCreateStep } from "@/components/activate/ActivateCreateStep";
import { ActivateReviewStep } from "@/components/activate/ActivateReviewStep";
import { ActivateBaselineStep } from "@/components/activate/ActivateBaselineStep";
import { ActivateTermsStep } from "@/components/activate/ActivateTermsStep";

function ActivateController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [step, setStep] = useState<'email' | 'lookup_result' | 'identity' | 'create' | 'review' | 'baseline' | 'terms' | 'success'>('email');
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [rosterData, setRosterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        goalieName: "", parentName: "", parentEmail: "", phone: "",
        gradYear: "", height: "", weight: "", team: "", birthday: "" // YYYY-MM-DD
    });

    const [baselineAnswers, setBaselineAnswers] = useState([
        { id: 1, question: "How confident do you feel in your game right now?", answer: "", mood: "neutral" },
        { id: 2, question: "What is your biggest goal for this season?", answer: "", mood: "neutral" },
        { id: 3, question: "What is your biggest frustration currently?", answer: "", mood: "neutral" },
    ]);

    const [termsAccepted, setTermsAccepted] = useState(false);

    // --- Handlers ---

    const handleEmailNext = (status: { exists: boolean, rosterStatus: 'found' | 'not_found' | 'linked' | 'error', isClaimed?: boolean }) => {
        if (status.exists || status.rosterStatus === 'linked') {
            // Already has account -> Redirect to Login
            router.push('/login?email=' + email);
        } else if (status.rosterStatus === 'found') {
            // Found Roster -> Verify Identity
            // We need to fetch the roster data first to verify DOB
            fetchRosterAndProceed();
        } else {
            // Not Found -> Go straight to create form
            setStep('create');
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
            setIsLoading(false);
            setStep('identity');
        } else {
            // Should not happen if check passed, but handle gracefully
            setIsLoading(false);
            setStep('lookup_result');
        }
    };

    const handleIdentityVerified = () => {
        // Pre-fill form
        setFormData(prev => ({
            ...prev,
            goalieName: rosterData?.goalie_name || "",
            parentName: rosterData?.parent_name || "",
            // parentEmail: rosterData?.raw_data?.parent_email || "", // Don't auto-fill parent email for privacy/correctness? Maybe fine.
            phone: rosterData?.parent_phone || "",
            gradYear: rosterData?.grad_year || "",
            team: rosterData?.team || "",
        }));
        setStep('review');
    };

    const handleCreateSuccess = (newData: any) => {
        setRosterData(newData);
        setStep('review');
    };

    const handleReviewSubmit = async () => {
        setIsLoading(true);
        // Save updates to Roster if exists (or temp state)
        if (rosterData?.id) {
            await supabase.from('roster_uploads').update({
                goalie_name: formData.goalieName,
                parent_name: formData.parentName,
                parent_phone: formData.phone,
                grad_year: parseInt(formData.gradYear) || 0,
                team: formData.team
            }).eq('id', rosterData.id);
        }
        setIsLoading(false);
        setStep('baseline');
    };

    const handleBaselineSubmit = async () => {
        // We'll save these at the end or now? 
        // Logic in original was save to 'reflections' but user might not exist yet if no auth.
        // Actually original flow assumed we are setting up... wait.
        // The original flow had 'activateUserCard' creating the user? No, 'activateUserCard' just toggled a flag and invited?
        // Let's defer saving robustly until we have an Auth ID in the final step or use the new 'actions.ts'.
        // For now, move to Terms.
        setStep('terms');
    };

    const handleFinalActivation = async () => {
        if (!termsAccepted) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Activate Card (Server Action)
            const { activateUserCard } = await import('./actions');
            const result = await activateUserCard(rosterData.id, '0000', { ...rosterData, ...formData }, baselineAnswers);

            if (!result.success) throw new Error(result.error);

            // 2. Provision Supabase Auth user + profile + link roster
            const { provisionSelfServiceUser } = await import('./actions');
            const provision = await provisionSelfServiceUser(
                email,
                rosterData.id,
                formData.goalieName || rosterData?.goalie_name
            );

            if (!provision.success) {
                console.warn('Provisioning warning:', provision.error);
                // Non-blocking: roster is saved, user can still be provisioned later
            }

            // 3. Send magic link so the goalie can log in
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
            });

            if (otpError) {
                console.warn('OTP send warning:', otpError.message);
            }

            // 4. Show success screen
            setStep('success');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Render Logic

    // Initial State Check
    if (step === 'email' && searchParams.get('email')) {
        // If loaded with email param, auto-trigger check?
        // Better to let user see/confirm.
    }

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
                        onError={setError}
                    />
                )}

                {step === 'lookup_result' && (
                    <ActivateLookupResult
                        email={email}
                        onRetry={() => setStep('email')}
                        onCreateNew={() => setStep('create')}
                    />
                )}

                {step === 'identity' && (
                    <ActivateIdentityStep
                        birthday={formData.birthday}
                        setBirthday={(d) => setFormData({ ...formData, birthday: d })}
                        onNext={handleIdentityVerified}
                        onBack={() => setStep('email')}
                        storedDob={rosterData?.raw_data?.dob}
                    />
                )}

                {step === 'create' && (
                    <ActivateCreateStep
                        email={email}
                        onSuccess={handleCreateSuccess}
                        onBack={() => setStep('email')}
                    />
                )}

                {step === 'review' && (
                    <ActivateReviewStep
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleReviewSubmit}
                        isLoading={isLoading}
                        email={email}
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

                {step === 'terms' && (
                    <ActivateTermsStep
                        termsAccepted={termsAccepted}
                        setTermsAccepted={setTermsAccepted}
                        onSubmit={handleFinalActivation}
                        error={error}
                        isLoading={isLoading}
                    />
                )}

                {step === 'success' && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-foreground mb-3">Check Your Email</h2>
                        <p className="text-muted-foreground text-sm mb-2">
                            We sent a magic link to
                        </p>
                        <p className="text-foreground font-bold text-lg mb-6">{email}</p>
                        <p className="text-muted-foreground text-sm mb-8">
                            Click the link in your email to sign in and view your Goalie Card.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="text-sm text-primary hover:underline"
                        >
                            Or sign in manually →
                        </button>
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
