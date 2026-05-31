
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

    // Redirect Check: send completed users to /dashboard, new users to /onboarding
    useEffect(() => {
        async function runRedirectCheck() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('onboarding_completed')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();
                
                if (profile?.onboarding_completed) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/onboarding');
                }
            } else {
                router.replace('/onboarding');
            }
        }
        runRedirectCheck();
    }, [router]);

    // State
    const [step, setStep] = useState<'email' | 'verify_review' | 'baseline' | 'security' | 'success'>('email');
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [rosterData, setRosterData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoChecked, setAutoChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        goalieName: "", parentName: "", parentEmail: "", phone: "",
        gradYear: "", height: "", weight: "", team: "", birthday: "", // YYYY-MM-DD
        sport: "Hockey",
        yearsOfExperience: "",
        teamHistory: [] as string[]
    });

    const [baselineAnswers, setBaselineAnswers] = useState([
        { id: 1, question: "Performance State", answer: "Derived from mood", mood: "neutral" },
        { id: 2, question: "Physical State", answer: "Derived from mood", mood: "neutral" },
        { id: 3, question: "Season Focus", answer: "Derived from mood", mood: "neutral" }
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
            .order('created_at', { ascending: false })
            .limit(1)
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

            const currentTeam = profile.team || "";

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
                sport: profile.sport,
                catch_hand: profile.catchHand,
                birthday: profile.birthday,
                team: currentTeam,
                team_history: [] // Supabase handles JSON/JSONB automagically
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
                yearsOfExperience: "",
                teamHistory: []
            }));

            console.log("[ProfileWizard] Submitting updates...", updates);

            if (rosterData?.id) {
                const { error: updateErr } = await supabase.from('roster_uploads').update(updates).eq('id', rosterData.id);
                if (updateErr) throw updateErr;
            } else {
                console.log("[ProfileWizard] No roster record, creating initial profile for:", email);
                const result = await createInitialProfile(email);
                if (!result.success) throw new Error(result.error || "Failed to create profile record.");
                setRosterData(result.data);
                console.log("[ProfileWizard] Initial profile created:", result.data.id);
            }

            console.log("[ProfileWizard] Success, moving to baseline.");
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
            const trimmedEmail = email.toLowerCase().trim();
            const result = await completeActivationWithPassword(
                trimmedEmail,
                password,
                rosterData?.id,
                rosterData,
                formData,
                baselineAnswers,
                searchParams.get('team_invite')
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


                {step === 'email' && (
                    <ActivateEmailStep
                        email={email}
                        setEmail={setEmail}
                        onNext={handleEmailNext}
                        onError={setError}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        autoChecked={autoChecked}
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
