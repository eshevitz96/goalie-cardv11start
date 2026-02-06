"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

// Import atomic steps
import { AuthEmailStep } from "./steps/AuthEmailStep";
import { AuthOtpStep } from "./steps/AuthOtpStep";
import { AuthBirthdayStep } from "./steps/AuthBirthdayStep";
import { AuthTermsStep } from "./steps/AuthTermsStep";
import { AuthInfoStep } from "./steps/AuthInfoStep";
import { AuthRoutingStep } from "./steps/AuthRoutingStep";

export default function UnifiedEntry() {
    const router = useRouter();

    // State Machine
    const [step, setStep] = useState<'email' | 'otp' | 'birthday' | 'terms' | 'info' | 'routing'>('email');

    // Data
    const [email, setEmail] = useState("");
    const [formData, setFormData] = useState({
        goalieName: "",
        parentName: "",
        phone: "",
        gradYear: "",
        height: "",
        weight: "",
        team: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    // --- LOGIC HANDLERS ---

    const handleSendOtp = async (inputEmail: string) => {
        setIsLoading(true);
        setError(null);
        setEmail(inputEmail);

        try {
            if (!inputEmail.toLowerCase().includes('example') && !inputEmail.toLowerCase().includes('demo')) {
                const { error } = await supabase.auth.signInWithOtp({
                    email: inputEmail.trim(),
                    options: { shouldCreateUser: true }
                });
                if (error) console.error("OTP Error (Non-Fatal for Demo):", error);
            }
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        setIsLoading(true);
        setError(null);

        // DEMO BYPASS
        if (['000000', '123456'].includes(otp.trim())) {
            console.log("🧪 DEMO MODE ACTIVE");
            localStorage.setItem('demo_mode', 'true');
            localStorage.setItem('demo_email', email);
            await new Promise(r => setTimeout(r, 800));
            setStep('birthday');
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp,
                type: 'email',
            });

            if (error) throw error;
            if (!data.user) throw new Error("Authentication failed");

            await checkProfileAndRoute(data.user.id);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Invalid Code");
            setIsLoading(false);
        }
    };

    const checkProfileAndRoute = async (userId: string) => {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        if (profile) {
            if (!profile.birth_date) {
                setStep('birthday');
                setIsLoading(false);
                return;
            }
            await handleRouting(userId, profile);
        } else {
            setStep('birthday');
            setIsLoading(false);
        }
    };

    const handleBirthdaySubmit = async (dob: string) => {
        // Role Logic
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;

        let role = age >= 18 ? 'goalie' : 'parent';

        // ADMIN BACKDOOR
        if (email.toLowerCase().includes('admin.override') ||
            email.toLowerCase() === 'elliott.validate@goalieguard.com' ||
            email.toLowerCase() === 'thegoaliebrand@gmail.com') {
            role = 'admin';
        }

        setUserRole(role);
        const isDemo = localStorage.getItem('demo_mode') === 'true';

        if (!isDemo) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    role: role,
                    birth_date: dob
                });
            }
        }
        setStep('terms');
    };

    const handleTermsConfirm = () => {
        setError(null);
        setStep('info');
    };

    const handleInfoSubmit = async () => {
        setIsLoading(true);
        if (localStorage.getItem('demo_mode') === 'true') {
            localStorage.setItem('user_name', formData.goalieName);
            localStorage.setItem('user_team', formData.team);
            localStorage.setItem('user_role', userRole || 'goalie');

            await new Promise(r => setTimeout(r, 1000));

            if (userRole === 'admin' || email.toLowerCase() === 'thegoaliebrand@gmail.com') {
                setShowRoleSelector(true);
                setStep('routing');
                return;
            }

            if (userRole === 'goalie') router.replace('/goalie');
            else if (userRole === 'parent') router.replace('/parent');
            else router.replace('/goalie');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No session");

            const { data: roster } = await supabase.from('roster_uploads').select('*').ilike('email', user.email || '').single();

            if (roster && roster.id) {
                const gradYearInt = parseInt(formData.gradYear) || 0;
                await supabase.from('roster_uploads').update({
                    goalie_name: formData.goalieName,
                    parent_name: formData.parentName,
                    parent_phone: formData.phone,
                    grad_year: gradYearInt,
                    height: formData.height,
                    weight: formData.weight,
                    team: formData.team,
                    is_claimed: true
                }).eq('id', roster.id);
            }
            await checkProfileAndRoute(user.id);
        } catch (err: any) {
            console.error(err);
            setIsLoading(false);
        }
    };

    const handleRouting = async (userId: string, profileData?: any) => {
        setStep('routing');
        if (!profileData) {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            profileData = data;
        }

        const role = profileData?.role || 'parent';
        await new Promise(r => setTimeout(r, 800));

        if (role === 'admin' || email.toLowerCase() === 'thegoaliebrand@gmail.com') {
            setShowRoleSelector(true);
            return;
        }

        if (role === 'parent') router.replace('/parent');
        else if (role === 'goalie') router.replace('/goalie');
        else if (role === 'coach') router.replace('/coach');
        else if (role === 'admin') router.replace('/admin');
        else router.replace('/parent');
    };

    return (
        <div className="w-full max-w-md relative z-10">
            {step !== 'routing' && (
                <div className="text-center mb-10">
                    <div className="mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                                <Shield className="w-8 h-8 text-white" fill="white" strokeWidth={0} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-white mb-1">GOALIEGUARD</h1>
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em]">Performance Ecosystem</p>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === 'email' && (
                    <AuthEmailStep
                        onSendOtp={handleSendOtp}
                        isLoading={isLoading}
                        error={error}
                    />
                )}
                {step === 'otp' && (
                    <AuthOtpStep
                        email={email}
                        onVerifyOtp={handleVerifyOtp}
                        onBack={() => setStep('email')}
                        isLoading={isLoading}
                        error={error}
                    />
                )}
                {step === 'birthday' && (
                    <AuthBirthdayStep onSubmit={handleBirthdaySubmit} />
                )}
                {step === 'terms' && (
                    <AuthTermsStep onConfirm={handleTermsConfirm} error={error} />
                )}
                {step === 'info' && (
                    <AuthInfoStep
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleInfoSubmit}
                        isLoading={isLoading}
                    />
                )}
                {step === 'routing' && (
                    <AuthRoutingStep showRoleSelector={showRoleSelector} />
                )}
            </AnimatePresence>
        </div>
    );
}
