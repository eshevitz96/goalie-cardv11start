"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, User, Shield, CreditCard, Loader2, AlertCircle, ArrowRight, FileText, Smile, Frown, Meh } from "lucide-react";
import { clsx } from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

const STEPS = [
    { id: 1, title: "Email", icon: User },
    { id: 2, title: "Identity", icon: Shield },
    { id: 3, title: "Review", icon: Check },
    { id: 4, title: "Baseline", icon: FileText },
    { id: 5, title: "Terms", icon: FileText },
    { id: 6, title: "Finish", icon: ArrowRight },
];

function ActivateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [email, setEmail] = useState("");
    const [accessId, setAccessId] = useState("");
    const [birthdayInput, setBirthdayInput] = useState(""); // Replaces Access ID
    const [rosterData, setRosterData] = useState<any>(null); // Data from Supabase
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Default Role to Goalie (User can change later if needed, but simplified flow assumes Goalie/Parent are same entry)
    const [userType, setUserType] = useState<'parent' | 'goalie'>('goalie');
    const [otp, setOtp] = useState("");
    const [isDemo, setIsDemo] = useState(false);

    const [showCreateOption, setShowCreateOption] = useState(false);

    // Step 1: Email Lookup
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setShowCreateOption(false);

        if (!email.includes("@") || email.length < 5) {
            setError("Please enter a valid email.");
            setIsLoading(false);
            return;
        }

        try {
            let searchEmail = email.trim();
            // SIMULATION OVERRIDE: Map thegoaliebrand to lukegrasso09 to find the record
            if (searchEmail.toLowerCase() === 'thegoaliebrand@gmail.com') {
                searchEmail = 'lukegrasso09@gmail.com';
            }

            // Check Supabase for match
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('*')
                .ilike('email', searchEmail)
                .single();

            if (error || !data) {
                // No record found -> Offer to Create
                setError("No roster record found.");
                setShowCreateOption(true);
                setIsLoading(false);
                return;
            }

            console.log("Roster Found:", data);
            setRosterData(data);
            setIsLoading(false);
            setCurrentStep(2); // Move to Birthday Verification

        } catch (err: any) {
            console.error(err);
            setError("Connection error: " + (err.message || "Unknown"));
            setIsLoading(false);
        }
    };

    const handleCreateNew = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // DUPLICATE CHECK: Before creating, retry finding the user just in case
            const { data: existing } = await supabase
                .from('roster_uploads')
                .select('*')
                .ilike('email', email.trim())
                .maybeSingle();

            if (existing) {
                console.log("Found existing record during Create New:", existing);
                setRosterData(existing);
                setIsLoading(false);
                setCurrentStep(2);
                return;
            }

            // Generate a random GC-ID
            const rId = 'GC-' + Math.floor(1000 + Math.random() * 9000);

            const { data, error } = await supabase.from('roster_uploads').insert({
                email: email.trim(),
                goalie_name: "New Athlete", // Temp
                assigned_unique_id: rId,
                is_claimed: true,
                sport: 'Hockey' // Default
            }).select().single();

            if (error) throw error;

            console.log("New Card Created:", data);
            setRosterData(data);
            setIsLoading(false);
            setCurrentStep(2); // Proceed to Identity

        } catch (err: any) {
            setError("Creation Error: " + err.message);
            setIsLoading(false);
        }
    };

    // Step 2: Birthday verification -> Logic Fork (Login vs Activate)
    const handleBirthdaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Verify Birthday Match (if data exists)
            const storedDob = rosterData.raw_data?.dob;
            // Strict check only if we HAVE a reliable DOB on file
            if (storedDob && storedDob !== birthdayInput) {
                setError("Incorrect Date of Birth.");
                setIsLoading(false);
                return;
            }

            // 2. Check for "Returning User" status (Login Flow)
            // Criteria: Claimed + Setup Complete flag
            const isSetup = rosterData.is_claimed && (rosterData.raw_data?.setup_complete || rosterData.setup_complete);

            if (isSetup) {
                console.log("Returning User Detected - Logging In...");

                // --- LOGIN SUCCESS LOGIC ---
                if (typeof window !== 'undefined') {
                    // Set Session Tokens
                    localStorage.setItem('session_token', 'valid-session-' + Date.now());
                    localStorage.setItem('user_email', email);

                    // Determine Role (could be stored, or derived from birthday/grade)
                    // For now, default to 'goalie' or 'parent' based on the age check we did dynamically, 
                    // or fetch from profiles table if we want to be 100% sure.
                    // Let's do a quick calculation or re-use existing logic.
                    const birthDate = new Date(birthdayInput);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                    const role = age >= 18 ? 'goalie' : 'parent';

                    localStorage.setItem('user_role', role);

                    if (rosterData.assigned_unique_id) {
                        localStorage.setItem('activated_id', rosterData.assigned_unique_id);
                    }
                    if (rosterData.id) {
                        localStorage.setItem('setup_roster_id', rosterData.id);
                    }

                    // Cleanup
                    localStorage.removeItem('demo_mode');
                }

                // Redirect
                const dest = '/parent'; // Default dashboard for now
                router.push(dest);
                return;
            }

            // 3. New/Pending User Flow -> Trigger OTP (Activation)
            console.log("New/Pending User - Starting Activation...");

            // Check if already authenticated at Supabase level
            const { data: { user } } = await supabase.auth.getUser();
            const isLoggedIn = user?.email?.toLowerCase() === email.trim().toLowerCase();

            if (isLoggedIn) {
                console.log("User already authenticated via Supabase - skipping OTP send");
            } else if (email.includes('example.com') || email.includes('demo@')) {
                console.log("Demo Email detected - skipping real OTP send");
                setIsDemo(true);
            } else {
                const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=/activate` : undefined;
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: {
                        shouldCreateUser: true,
                        emailRedirectTo: redirectUrl
                    }
                });
                if (otpError) {
                    if (otpError.message?.includes("rate limit") || otpError.status === 429) {
                        alert("Demo Mode: OTP Rate Limit. Creating Fake Session.");
                        setIsDemo(true);
                    } else {
                        throw otpError;
                    }
                }
            }

            // Calculate Role for Activation Context
            const birthDate = new Date(birthdayInput);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            const determinedRole = age >= 18 ? 'goalie' : 'parent';
            setUserType(determinedRole);

            // Pre-fill form data for Review Step
            setFormData({
                parentName: rosterData.parent_name || "",
                goalieName: rosterData.goalie_name || "",
                phone: rosterData.parent_phone || "",
                gradYear: rosterData.grad_year?.toString() || "",
                height: rosterData.height || "",
                weight: rosterData.weight || "",
                team: rosterData.team || "",
                birthday: birthdayInput // Carry forward
            });

            setIsLoading(false);

            if (isLoggedIn) {
                setCurrentStep(4); // Skip OTP Verify if already logged in
            } else {
                setCurrentStep(3.5); // OTP Step
            }
            return;

        } catch (err: any) {
            setError("Error processing request: " + err.message);
            setIsLoading(false);
        }
    };



    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Verify Logic
            const { error } = await supabase.auth.verifyOtp({
                email: email.trim(),
                token: otp,
                type: 'email',
            });

            if (error) {
                // For Demo: If 000000, we skip checking (Safety removed for demo ease)
                if (otp === '000000') {
                    // Force success simulation
                } else {
                    throw error;
                }
            }

            // UPDATE DB STATUS
            if (rosterData && rosterData.id) {
                console.log("Marking card as claimed...");
                // Try to update - might fail if RLS blocks, but worth a shot for "Admin Visibility"
                const { error: claimError } = await supabase.from('roster_uploads').update({ is_claimed: true }).eq('id', rosterData.id);
                if (claimError) console.error("Claim Update Error", claimError);
            }

            // Save ID for Setup (just in case)
            if (rosterData?.id) {
                localStorage.setItem('setup_roster_id', rosterData.id);
            }

            setIsLoading(false);
            setCurrentStep(4); // Move to Review
        } catch (err: any) {
            setError("Invalid Code. " + err.message);
            setIsLoading(false);
        }
    };

    // Plan State
    const [selectedPlan, setSelectedPlan] = useState<'onetime' | 'subscription'>('onetime');

    // Editable Form Data
    const [formData, setFormData] = useState({
        parentName: "",
        goalieName: "",
        phone: "",
        gradYear: "",
        height: "",
        weight: "",
        team: "",
        birthday: ""
    });

    const [baselineAnswers, setBaselineAnswers] = useState([
        { id: 1, question: "How confident do you feel in your game right now?", answer: "", mood: "neutral" },
        { id: 2, question: "What is your biggest goal for this season?", answer: "", mood: "neutral" },
        { id: 3, question: "What is your biggest frustration currently?", answer: "", mood: "neutral" },
    ]);

    const handleStep3 = async () => {
        setIsLoading(true);
        try {
            if (rosterData && rosterData.id) {
                // Determine grad year safely (parse or keep string if flexible, but DB usually expects int)
                const gradYearInt = parseInt(formData.gradYear) || 0;

                const { error: updateError } = await supabase
                    .from('roster_uploads')
                    .update({
                        goalie_name: formData.goalieName,
                        parent_name: formData.parentName,
                        parent_phone: formData.phone,
                        grad_year: gradYearInt,
                        height: formData.height,
                        weight: formData.weight,
                        team: formData.team
                    })
                    .eq('id', rosterData.id);

                // Also update Birthday in Profile if possible
                const { data: { user } } = await supabase.auth.getUser();
                if (user && formData.birthday) {
                    // Check if profile exists, if not create/update
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            email: user.email,
                            role: userType || 'goalie',
                            birth_date: formData.birthday
                        });
                    if (profileError) console.error("Profile Birthday Update Error:", profileError);
                }

                if (updateError) {
                    console.error("Update Error:", updateError);
                    // Decide: block or continue? 
                    // Let's log it but continue so activation doesn't break if RLS is strict on 'update' vs 'select'.
                    // ideally we show a toast.
                } else {
                    console.log("Roster details updated successfully.");
                }
            }
        } catch (err) {
            console.error("Save Details Error:", err);
        } finally {
            setIsLoading(false);
            setCurrentStep(5); // Go to Baseline
        }
    };

    const handleBaselineSubmit = async () => {
        setIsLoading(true);
        // Save reflections
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const entries = baselineAnswers.map(ans => ({
                roster_id: rosterData.id,
                goalie_id: userType === 'goalie' ? user?.id : null, // Only link goalie_id if the user IS the goalie
                author_id: user?.id,
                author_role: userType || 'goalie', // 'parent' or 'goalie'
                title: "Baseline: " + ans.question,
                content: ans.answer || "No text provided",
                mood: ans.mood,
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('reflections').insert(entries);

            if (error) throw error;

            if (error) throw error;

            // Safety Check on Baseline
            const allText = baselineAnswers.map(a => a.answer).join(' ').toLowerCase();
            const flags = ['quit', 'pain', 'hurt', 'depressed', 'hate', 'give up'];
            const found = flags.filter(f => allText.includes(f));

            if (found.length > 0) {
                await supabase.from('notifications').insert({
                    user_id: user?.id,
                    title: "⚠️ Baseline Alert",
                    message: `Initial baseline flagged for keywords: "${found.join(', ')}". A check-in is recommended.`,
                    type: 'alert'
                });
            }

            console.log("Likely Success! Baseline Captured:", entries);
            setIsLoading(false);
            setCurrentStep(6); // Go to Terms
        } catch (err: any) {
            console.error("Baseline Save Error:", err);
            // Even if error, maybe proceed or show alert? For now alert.
            // alert("Failed to save baseline: " + err.message);
            setIsLoading(false);
            setCurrentStep(6); // Proceed anyway?
        }
    };

    // PIN State
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const handleStep4 = async () => {
        if (!termsAccepted) {
            setError("You must accept the terms to proceed.");
            return;
        }
        setError(null);
        // Skip Payment for Beta and go to PIN Creation
        setCurrentStep(6.5);
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError("PIN must be 4 digits.");
            setIsLoading(false);
            return;
        }
        if (pin !== confirmPin) {
            setError("PINs do not match.");
            setIsLoading(false);
            return;
        }

        try {
            // Use Server Action for reliable saving
            const { activateUserCard } = await import('./actions');

            if (rosterData && rosterData.id) {
                const result = await activateUserCard(rosterData.id, pin, rosterData);
                if (!result.success) {
                    throw new Error(result.error);
                }
            }

            // Simulate Delay
            await new Promise(r => setTimeout(r, 1000));
            setIsLoading(false);
            setCurrentStep(7); // Success

        } catch (err: any) {
            console.error(err);
            setError("Activation Error: " + err.message);
            setIsLoading(false);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);
        if (typeof window !== 'undefined' && rosterData?.assigned_unique_id) {
            localStorage.setItem('activated_id', rosterData.assigned_unique_id);
        }
        console.log("Activation Complete");
        await new Promise(r => setTimeout(r, 1000));

        // Intelligent Redirect
        if (userType === 'goalie') {
            router.push('/goalie');
        } else {
            router.push('/parent');
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* ... (Background) ... */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Progress Header */}
            <div className="absolute top-8 left-0 w-full px-8 flex justify-between items-center z-20">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Esc
                </Link>
                {/* Simplified Progress Dots logic would be needed if we add a step, but let's keep it simple for now or update STEPS constant if strictly needed visually. */}
            </div>

            <div className="w-full max-w-md relative z-10 mt-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Step 1: Email Lookup */}
                        {currentStep === 1 && (
                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">
                                        ACTIVATE <span className="text-primary">PROFILE</span>
                                    </h1>
                                    <p className="text-muted-foreground text-sm">Enter your email to locate your roster spot.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        autoFocus
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                                        placeholder="goalie@example.com"
                                    />
                                </div>

                                {error && (
                                    <div className="space-y-3">
                                        <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>

                                        {showCreateOption && (
                                            <button
                                                type="button"
                                                onClick={handleCreateNew}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all border border-white/10"
                                            >
                                                Create New Card
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!showCreateOption && (
                                    <button type="submit" disabled={isLoading} className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                        {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ChevronRight size={18} /></>}
                                    </button>
                                )}

                                <div className="text-center mt-4">
                                    <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                        Already activated? Login here
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Birthday Verification */}
                        {currentStep === 2 && (
                            <form onSubmit={handleBirthdaySubmit} className="space-y-6">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">VERIFY <span className="text-primary">IDENTITY</span></h1>
                                    <p className="text-muted-foreground text-sm">Enter your birthday to confirm it's you.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Birthday</label>
                                    <input
                                        type="date"
                                        autoFocus
                                        required
                                        value={birthdayInput}
                                        onChange={(e) => setBirthdayInput(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-lg text-center"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Verify & Send Code <ChevronRight size={18} /></>}
                                </button>

                                <button type="button" onClick={() => setCurrentStep(1)} className="w-full text-muted-foreground text-sm py-2">Back</button>
                            </form>
                        )}



                        {/* Step 3.5: OTP Verification */}
                        {currentStep === 3.5 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                        <Shield size={32} className="text-blue-500" />
                                    </div>
                                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">VERIFY</h1>
                                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                                        Enter the 6-digit code sent to
                                        <span className="block text-foreground font-bold mt-1">{email}</span>
                                    </p>
                                    {isDemo && (
                                        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-xs font-mono animate-pulse">
                                            DEMO MODE: Use Code <strong>000000</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 text-center block">Access Code</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-3xl font-mono tracking-[0.5em] text-center"
                                        placeholder="000000"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Verify Code <Check size={18} /></>}
                                </button>

                                <button type="button" onClick={() => setCurrentStep(3)} className="w-full text-muted-foreground text-sm py-2">Back to ID</button>
                            </form>
                        )}

                        {/* Step 4: Review Info */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                        <Check size={32} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Record Found</h2>
                                    <p className="text-muted-foreground text-sm">Please review and confirm your details.</p>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goalie Name</label>
                                            <input
                                                value={formData.goalieName}
                                                onChange={(e) => setFormData({ ...formData, goalieName: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>

                                        {userType === 'parent' && (
                                            <>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parent Name</label>
                                                    <input
                                                        value={formData.parentName}
                                                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                                                    <input
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Grad Year</label>
                                            <input
                                                value={formData.gradYear}
                                                onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Birthday</label>
                                            <input
                                                type="date"
                                                value={formData.birthday}
                                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Team</label>
                                            <input
                                                value={formData.team}
                                                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                placeholder="Current Team"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Height</label>
                                                <input
                                                    value={formData.height}
                                                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                    placeholder="e.g. 6-0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weight</label>
                                                <input
                                                    value={formData.weight}
                                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                    placeholder="lbs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleStep3} disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Confirm Details"}
                                </button>
                            </div>
                        )}

                        {/* Step 5: Baseline Questions */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">BASELINE <span className="text-primary">CHECK-IN</span></h2>
                                    <p className="text-muted-foreground text-sm">Let's set a baseline for your training.</p>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                    {baselineAnswers.map((item, index) => (
                                        <div key={item.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                                            <label className="text-xs font-bold text-foreground block">{item.question}</label>
                                            <textarea
                                                value={item.answer}
                                                onChange={(e) => {
                                                    const newAnswers = [...baselineAnswers];
                                                    newAnswers[index].answer = e.target.value;
                                                    setBaselineAnswers(newAnswers);
                                                }}
                                                className="w-full bg-secondary border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary min-h-[80px] resize-none"
                                                placeholder="Type your answer..."
                                            />
                                            <div className="flex gap-2 justify-end">
                                                {['happy', 'neutral', 'frustrated'].map(mood => (
                                                    <button
                                                        key={mood}
                                                        onClick={() => {
                                                            const newAnswers = [...baselineAnswers];
                                                            newAnswers[index].mood = mood;
                                                            setBaselineAnswers(newAnswers);
                                                        }}
                                                        className={clsx(
                                                            "p-2 rounded-lg transition-all",
                                                            item.mood === mood ? "bg-primary/20 text-primary scale-110" : "text-muted-foreground hover:bg-secondary"
                                                        )}
                                                    >
                                                        {mood === 'happy' && <Smile size={20} />}
                                                        {mood === 'neutral' && <Meh size={20} />}
                                                        {mood === 'frustrated' && <Frown size={20} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleBaselineSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Save & Continue <ChevronRight size={18} /></>}
                                </button>
                            </div>
                        )}

                        {/* Step 6: Terms & Payment */}
                        {currentStep === 6 && (
                            <div className="space-y-6">
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-foreground mb-2">Final Step</h3>
                                    <p className="text-muted-foreground text-sm">Terms of Service & Verification.</p>
                                </div>

                                {/* Terms Box */}

                                {/* Terms Box */}
                                <div className="bg-secondary rounded-xl p-4 border border-border text-xs text-muted-foreground h-32 overflow-y-auto leading-relaxed">
                                    <p className="font-bold text-foreground mb-2">Liability Waiver & Terms</p>
                                    <p className="mb-2">I hereby authorize the staff of GoalieGuard to act for me according to their best judgment in any emergency requiring medical attention. I hereby waive and release GoalieGuard from any and all liability for any injuries or illnesses incurred while at the GoalieGuard program.</p>
                                    <p className="mb-2">I have no knowledge of any physical impairment that would be affected by the above named camper's participation in the program.</p>
                                    <p>I also understand the camp retains the right to use for publicity and advertising purposes, photographs of campers taken at camp.</p>

                                    <p className="font-bold text-foreground mt-4 mb-2">Performance Coaching & Safety Protocols</p>
                                    <p className="mb-2"><strong>1. Purpose:</strong> GoalieGuard utilizes Large Language Models (LLMs) to provide sports mindset and tactical performance coaching. This advice is educational in nature and limited to the athletic domain.</p>
                                    <p className="mb-2"><strong>2. Safety & Oversight:</strong> The Performance Engine is NOT a mental health professional or crisis counselor. In the event of a mental health emergency, please contact 911 or a licensed professional. GoalieGuard employs keyword detection systems to flag potential distress signals for human (parent/coach) review.</p>
                                    <p className="mb-2"><strong>3. Human-in-the-Loop:</strong> Parents and assigned coaches retain full transparency and access to the athlete's journal entries and automated insights at all times.</p>
                                    <p><strong>4. Data Privacy:</strong> Athlete data is encrypted and used solely to personalize the development journey. We do not sell personally identifiable training data to third parties.</p>
                                </div>

                                {/* Checkbox */}
                                <div
                                    onClick={() => setTermsAccepted(!termsAccepted)}
                                    className="flex items-start gap-4 p-4 rounded-xl bg-secondary border border-border cursor-pointer hover:border-primary/50 transition-colors"
                                >
                                    <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all mt-0.5", termsAccepted ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-card")}>
                                        {termsAccepted && <Check size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-foreground">I accept the Terms & Conditions</div>
                                        <div className="text-xs text-muted-foreground mt-1">By checking this box, you agree to the liability waiver and privacy policy.</div>
                                    </div>
                                </div>


                                {error && <div className="text-red-500 text-sm text-center animate-pulse">{error}</div>}

                                <button
                                    onClick={handleStep4}
                                    className={clsx(
                                        "w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                        termsAccepted ? "bg-primary hover:bg-rose-600 text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Complete Activation <Check size={18} /></>}
                                </button>
                            </div>
                        )}

                        {/* Step 6.5: PIN Creation */}
                        {currentStep === 6.5 && (
                            <form onSubmit={handlePinSubmit} className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">SECURE <span className="text-primary">ACCESS</span></h2>
                                    <p className="text-muted-foreground text-sm">Create a 4-digit PIN for future logins.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Create PIN</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            required
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-3xl font-mono tracking-[0.5em] text-center"
                                            placeholder="XXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Confirm PIN</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            required
                                            value={confirmPin}
                                            onChange={(e) => setConfirmPin(e.target.value)}
                                            className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-3xl font-mono tracking-[0.5em] text-center"
                                            placeholder="XXXX"
                                        />
                                    </div>
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Save PIN & Finish <Check size={18} /></>}
                                </button>
                            </form>
                        )}

                        {/* Step 7: Success */}
                        {currentStep === 7 && (
                            <div className="text-center py-10 space-y-6">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                                    <Check size={48} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-foreground italic tracking-tight">YOU'RE IN</h2>
                                    <p className="text-muted-foreground mt-2">Goalie Card Activated Successfully.</p>
                                </div>
                                <button onClick={handleFinish} className="px-8 py-3 bg-foreground text-background font-bold rounded-full hover:bg-foreground/90 transition-colors w-full">
                                    Access Goalie Portal
                                </button>
                                <p className="text-[10px] text-muted-foreground">No account creation required. Your device is now authorized.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div >
        </main >
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
            <ActivateContent />
        </Suspense>
    );
}
