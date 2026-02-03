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
                const role = localStorage.getItem('user_role');
                const dest = role === 'parent' ? '/parent' : '/goalie';
                router.push(dest);
                return;
            }

            // 3. New/Pending User Flow -> SIMPLIFIED (No OTP)
            console.log("New/Pending User - Skipping OTP (Beta Flow)...");

            // Calculate Default Role (can be changed in UI)
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
                parentEmail: rosterData.raw_data?.parent_email || "",
                goalieName: rosterData.goalie_name || "",
                phone: rosterData.parent_phone || "",
                gradYear: rosterData.grad_year?.toString() || "",
                height: rosterData.height || "",
                weight: rosterData.weight || "",
                team: rosterData.team || "",
                birthday: birthdayInput // Carry forward
            });

            setIsLoading(false);
            setCurrentStep(4); // Direct to Review
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
        parentEmail: "",
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
                        team: formData.team,
                        // Determine if we need to update raw_data
                        raw_data: {
                            ...rosterData.raw_data,
                            parent_email: formData.parentEmail // Save Guardian Email
                        }
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
            // Redirect to Setup for Physical Profile & Terms
            if (typeof window !== 'undefined') {
                if (rosterData?.id) {
                    localStorage.setItem('setup_roster_id', rosterData.id);
                    localStorage.setItem('user_role', userType || 'goalie');
                }
            }
            router.push('/setup');
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

    // PIN State REMOVED


    // Simplified Activation (No PIN UI)
    const handleFinalActivation = async () => {
        if (!termsAccepted) {
            setError("You must accept the terms to proceed.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            // Use Server Action with DEFAULT PIN '0000'
            const { activateUserCard } = await import('./actions');

            if (rosterData && rosterData.id) {
                const result = await activateUserCard(rosterData.id, '0000', rosterData);
                if (!result.success) {
                    throw new Error(result.error);
                }
            }

            // Simulate Delay
            await new Promise(r => setTimeout(r, 1000));
            // Set session token locally since we skipped real OTP
            if (typeof window !== 'undefined') {
                localStorage.setItem('session_token', 'activ-' + Date.now());
                localStorage.setItem('user_email', email);
                localStorage.setItem('user_role', userType);
            }

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
                                                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-3 rounded-xl transition-all border border-white/10"
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
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goalie Email (Login)</label>
                                            <input
                                                type="email"
                                                value={email} // Using primary email state
                                                disabled // Locked for now as it is the ID
                                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-muted-foreground text-sm focus:border-emerald-500 outline-none cursor-not-allowed"
                                            />
                                        </div>

                                        {/* Guardian Email - Activates Parent Portal */}
                                        <div className="col-span-2 border-t border-border pt-4 mt-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                Guardian Email <span className="text-emerald-500 text-[9px] border border-emerald-500/30 px-1 rounded">Activates Parent Portal</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.parentEmail}
                                                onChange={(e) => {
                                                    const newEmail = e.target.value;
                                                    setFormData({ ...formData, parentEmail: newEmail });
                                                    // Auto-switch role context based on presence of parent email
                                                    if (newEmail && newEmail.includes('@')) {
                                                        setUserType('parent');
                                                    } else {
                                                        setUserType('goalie');
                                                    }
                                                }}
                                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                placeholder="Enter parent email to enable Parent Portal..."
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Leave blank if managing your own account.
                                            </p>
                                        </div>

                                        {/* Optional Parent Name if Email provided */}
                                        {formData.parentEmail.length > 3 && (
                                            <div className="col-span-2 animate-in slide-in-from-top-2 fade-in">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parent Name</label>
                                                <input
                                                    value={formData.parentName}
                                                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-emerald-500 outline-none"
                                                    placeholder="Parent Name"
                                                />
                                            </div>
                                        )}

                                        <div className="col-span-2 border-t border-border pt-2 mt-2"></div>

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

                                    </div>
                                </div>

                                <button onClick={handleStep3} disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                    {isLoading ? <Loader2 className="animate-spin" /> : "Confirm Details"}
                                </button>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
            <ActivateContent />
        </Suspense>
    );
}
