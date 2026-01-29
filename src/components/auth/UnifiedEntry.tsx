"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Loader2, Check, User, Calendar, FileText } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { clsx } from "clsx";

export default function UnifiedEntry() {
    const router = useRouter();

    // STEPS: 
    // 1. Email (Login/Signup)
    // 2. OTP (Verify)
    // 3. Identification (Birthday - if not known)
    // 4. Terms (If not accepted)
    // 5. Goalie Info (If incomplete)
    // 6. Routing (Dashboard)
    const [step, setStep] = useState<'email' | 'otp' | 'birthday' | 'terms' | 'info' | 'routing'>('email');

    // Data
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [dob, setDob] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
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

    // ------------------------------------------------------------------
    // STEP 1: SEND OTP
    // ------------------------------------------------------------------
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // For Demo/Test, we don't strictly need to send if we know we are bypassing,
            // but let's try sending to be realistic unless it's a known dummy domain.
            if (!email.toLowerCase().includes('example') && !email.toLowerCase().includes('demo')) {
                const { error } = await supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: { shouldCreateUser: true }
                });
                if (error) console.error("OTP Error (Non-Fatal for Demo):", error);
            }

            // Always proceed to OTP step in UI
            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // STEP 2: VERIFY OTP
    // ------------------------------------------------------------------
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // DEMO / TEST BYPASS
        if (['000000', '123456'].includes(otp.trim())) {
            console.log("🧪 DEMO MODE ACTIVE");
            localStorage.setItem('demo_mode', 'true');
            localStorage.setItem('demo_email', email);

            // Fake a short delay
            await new Promise(r => setTimeout(r, 800));

            // Check if we need to identify -> Force Identity for Demo Flow
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

            // Check Profile Status
            await checkProfileAndRoute(data.user.id);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Invalid Code");
            setIsLoading(false);
        }
    };

    const checkProfileAndRoute = async (userId: string) => {
        // Fetch Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            // Profile Exists.
            if (!profile.birth_date) {
                setStep('birthday');
                setIsLoading(false);
                return;
            }
            await handleRouting(userId, profile);
        } else {
            // No Profile -> New User Flow
            setStep('birthday');
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // STEP 3: BIRTHDAY (IDENTITY)
    // ------------------------------------------------------------------
    const handleBirthdaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate Role Logic
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) {
            age--;
        }

        let role = age >= 18 ? 'goalie' : 'parent';

        // ADMIN BACKDOOR
        if (email.toLowerCase().includes('admin.override') ||
            email.toLowerCase() === 'elliott.validate@goalieguard.com' ||
            email.toLowerCase() === 'thegoaliebrand@gmail.com') {
            console.log("⚡️ ADMIN OVERRIDE ACTIVATED");
            role = 'admin';
        }

        console.log(`Age: ${age}, Role Assigned: ${role}`);
        setUserRole(role);

        // Demo Mode Check
        const isDemo = localStorage.getItem('demo_mode') === 'true';

        if (!isDemo) {
            // 1. Create/Upsert Profile with this DOB/Role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    role: role,
                    birth_date: dob
                });
                if (error) console.error("Profile Upsert Error", error);
            }
        }

        // If New User -> Terms
        setStep('terms');
    };

    // ------------------------------------------------------------------
    // STEP 4: TERMS
    // ------------------------------------------------------------------
    const handleTermsSubmit = () => {
        if (!termsAccepted) {
            setError("Please accept the terms.");
            return;
        }
        setError(null);
        setStep('info');
    };

    // ------------------------------------------------------------------
    // STEP 5: GOALIE INFO (ONBOARDING)
    // ------------------------------------------------------------------
    const handleInfoSubmit = async () => {
        setIsLoading(true);

        // Demo Mode Bypass
        if (localStorage.getItem('demo_mode') === 'true') {

            // PERSIST DATA
            localStorage.setItem('user_name', formData.goalieName);
            localStorage.setItem('user_team', formData.team);
            localStorage.setItem('user_role', userRole || 'goalie');

            await new Promise(r => setTimeout(r, 1000));

            // ADMIN INTERCEPTION (Demo Mode)
            if (userRole === 'admin' || email.toLowerCase() === 'thegoaliebrand@gmail.com') {
                setShowRoleSelector(true);
                setStep('routing');
                return;
            }

            // Route to Goalie Portal for testing
            if (userRole === 'goalie') router.replace('/goalie');
            else if (userRole === 'parent') router.replace('/parent');
            else router.replace('/goalie'); // Default fallthrough
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No session");

            const { data: roster } = await supabase
                .from('roster_uploads')
                .select('*')
                .ilike('email', user.email || '')
                .single();

            if (roster && roster.id) {
                // Valid Roster Spot Found - Update it
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
            // proceed anyway?
            setIsLoading(false);
        }
    };


    // ------------------------------------------------------------------
    // ROUTING
    // ------------------------------------------------------------------
    const handleRouting = async (userId: string, profileData?: any) => {
        setStep('routing');

        if (!profileData) {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            profileData = data;
        }

        const role = profileData?.role || 'parent';

        // Artificial Delay for "Loading Portal" feel
        await new Promise(r => setTimeout(r, 800));

        // SUPER USER / ADMIN INTERCEPTION
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


    // ------------------------------------------------------------------
    // RENDER: UNIFIED ENTRY UI
    // ------------------------------------------------------------------
    return (
        <div className="w-full max-w-md relative z-10">
            {/* Header */}
            {step !== 'routing' && (
                <div className="text-center mb-10">
                    <div className="mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                                <Shield className="w-8 h-8 text-white" fill="white" strokeWidth={0} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-white mb-1">
                            GOALIEGUARD
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.3em]">
                            Performance Ecosystem
                        </p>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">

                {/* 1. EMAIL */}
                {step === 'email' && (
                    <motion.form
                        key="email"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleSendOtp}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl p-1 shadow-2xl overflow-hidden">
                            <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-4 pt-3 pb-0">Email Address</label>
                            <input
                                type="email"
                                required
                                autoFocus
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Type your email here..."
                                className="w-full bg-white text-black text-lg px-4 pb-3 pt-1 rounded-xl focus:outline-none placeholder:text-zinc-300 font-bold"
                            />
                        </div>

                        {error && <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

                        <button
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Send Verification <ArrowRight size={18} /></>}
                        </button>

                        <p className="text-center text-[10px] text-zinc-600 mt-6 max-w-xs mx-auto leading-relaxed">
                            We'll send a secure link to verify your identity and age requirements.
                        </p>
                    </motion.form>
                )}

                {/* 2. OTP */}
                {step === 'otp' && (
                    <motion.form
                        key="otp"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onSubmit={handleVerifyOtp}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <p className="text-zinc-400 text-sm">Check your inbox for the code</p>
                            <p className="text-white font-bold">{email}</p>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-white transition-colors shadow-2xl">
                            <input
                                type="text"
                                required
                                autoFocus
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full bg-transparent border-none text-white text-3xl font-mono tracking-[0.5em] text-center p-4 focus:ring-0 placeholder:text-zinc-800"
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                        <button
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <>Access System <Check size={18} /></>}
                        </button>

                        <button type="button" onClick={() => setStep('email')} className="w-full text-xs text-zinc-500 hover:text-white py-2">
                            Use different email
                        </button>
                    </motion.form>
                )}

                {/* 3. BIRTHDAY */}
                {step === 'birthday' && (
                    <motion.form
                        key="birthday"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleBirthdaySubmit}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white mb-2">Identify Yourself</h2>
                            <p className="text-zinc-400 text-xs">Different ages have different portals.</p>
                        </div>

                        <div className="bg-white rounded-2xl p-1 shadow-2xl">
                            <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-4 pt-3 pb-0">Date of Birth</label>
                            <input
                                type="date"
                                required
                                value={dob}
                                onChange={e => setDob(e.target.value)}
                                className="w-full bg-white text-black text-lg p-4 rounded-xl focus:outline-none placeholder:text-zinc-300 font-bold text-center"
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            Continue <ArrowRight size={18} />
                        </button>
                    </motion.form>
                )}

                {/* 4. TERMS */}
                {step === 'terms' && (
                    <motion.div
                        key="terms"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-xs text-zinc-400 h-48 overflow-y-auto leading-relaxed">
                            <p className="font-bold text-white mb-2">Terms of Service</p>
                            <p className="mb-2">By accessing GoalieGuard, you agree to our standard liability waiver and data privacy policies. We use AI to analyze performance.</p>
                            <p>You agree to play nice.</p>
                        </div>

                        <div
                            onClick={() => setTermsAccepted(!termsAccepted)}
                            className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
                        >
                            <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all", termsAccepted ? "bg-white border-white text-black" : "border-zinc-700 bg-black")}>
                                {termsAccepted && <Check size={14} />}
                            </div>
                            <div className="font-bold text-sm text-white">I Accept</div>
                        </div>

                        {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                        <button
                            onClick={handleTermsSubmit}
                            className={clsx(
                                "w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                termsAccepted ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            )}
                        >
                            Confirm
                        </button>
                    </motion.div>
                )}

                {/* 5. INFO */}
                {step === 'info' && (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-white">Final Details</h2>
                            <p className="text-zinc-400 text-xs">Verify your roster info</p>
                        </div>

                        <input value={formData.goalieName} onChange={e => setFormData({ ...formData, goalieName: e.target.value })} placeholder="Goalie Name" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />
                        <input value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} placeholder="Parent Name" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />
                        <input value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })} placeholder="Current Team" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />

                        <button
                            onClick={handleInfoSubmit}
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Enter Ecosystem"}
                        </button>
                    </motion.div>
                )}

                {/* 6. ROUTING */}
                {step === 'routing' && (
                    <motion.div
                        key="routing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-6 w-full"
                    >
                        {showRoleSelector ? (
                            <div className="w-full space-y-4">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Command Center</h2>
                                    <p className="text-zinc-500 text-xs font-mono">Select your workspace</p>
                                </div>

                                <button onClick={() => router.replace('/admin')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-white hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden">
                                    <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Shield className="text-white" size={32} />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Master Control</p>
                                    <h3 className="text-lg font-bold text-white">Admin Console</h3>
                                </button>

                                <button onClick={() => router.replace('/coach')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-primary hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden">
                                    <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <User className="text-primary" size={32} />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Coach OS</p>
                                    <h3 className="text-lg font-bold text-white">Coaching Portal</h3>
                                </button>

                                <button onClick={() => router.replace('/goalie')} className="w-full p-6 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:bg-black rounded-2xl group transition-all text-left relative overflow-hidden">
                                    <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <FileText className="text-emerald-500" size={32} />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Player Card</p>
                                    <h3 className="text-lg font-bold text-white">Goalie Dashboard</h3>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                                <h2 className="text-xl font-bold text-white animate-pulse">Establishing Connection...</h2>
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
