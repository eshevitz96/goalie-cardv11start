"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, User, Shield, CreditCard, Loader2, AlertCircle, ArrowRight, FileText } from "lucide-react";
import { clsx } from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

const STEPS = [
    { id: 1, title: "Email", icon: User },
    { id: 2, title: "Access ID", icon: Shield },
    { id: 3, title: "Review", icon: Check },
    { id: 4, title: "Terms", icon: FileText },
    { id: 5, title: "Finish", icon: ArrowRight },
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
    const [rosterData, setRosterData] = useState<any>(null); // Data from Supabase
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Editable Form Data
    const [formData, setFormData] = useState({
        parentName: "",
        goalieName: "",
        phone: "",
        gradYear: "",
        height: "",
        weight: "",
    });

    // Handle Return from Stripe or other redirects
    useEffect(() => {
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');
        const idParam = searchParams.get('id'); // Pass ID back to know who we are activating

        if (success && idParam) {
            setAccessId(idParam);
            setCurrentStep(5);
        } else if (canceled) {
            setError("Payment was canceled. Please try again.");
            setCurrentStep(4);
        }
    }, [searchParams]);

    const handleStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }
        setCurrentStep(2);
    };

    const handleStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Check Supabase for match
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('*')
                .ilike('email', email.trim())
                .eq('assigned_unique_id', accessId.trim().toUpperCase())
                .single();

            if (error || !data) {
                console.error("Lookup Error:", error);
                setError("No roster record found with this Email and ID combo. Please check your credentials.");
                setIsLoading(false);
                return;
            }

            if (data.is_claimed) {
                setError("This account is already active. Redirecting...");
                setTimeout(() => router.push('/parent'), 2000);
                setIsLoading(false);
                return;
            }

            // Success - Found Data
            setRosterData(data);
            setFormData({
                parentName: data.parent_name || "",
                goalieName: data.goalie_name || "",
                phone: data.parent_phone || "",
                gradYear: data.grad_year?.toString() || "",
                height: "",
                weight: ""
            });
            setIsLoading(false);
            setCurrentStep(3);

        } catch (err) {
            console.error(err);
            setError("Connection error. Please try again.");
            setIsLoading(false);
        }
    };

    const handleStep3 = () => {
        // Validation could go here
        setCurrentStep(4);
    };

    const handleStep4 = async () => {
        if (!termsAccepted) {
            setError("You must accept the terms to proceed.");
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            // Call Stripe Checkout
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: 'price_1Q...', // Replace with real Price ID or Env Var
                    email: email,
                    userId: rosterData.id,
                    returnUrl: `${window.location.origin}/activate?id=${accessId}`, // Return here
                }),
            });

            if (!response.ok) {
                throw new Error("Payment init failed");
            }

            const { url } = await response.json();
            if (url) {
                window.location.href = url; // Redirect to Stripe
            } else {
                throw new Error("No URL returned");
            }

        } catch (err: any) {
            console.error(err);
            // Fallback for dev/demo if no stripe keys or error:
            // Check if it's a "Missing required fields" (bad config) or network error
            if (process.env.NODE_ENV === 'development') {
                alert("Dev Mode: Skipping Stripe (Check console for error). Moving to Success.");
                setCurrentStep(5);
            } else {
                setError("Payment System Error: " + err.message);
            }
            setIsLoading(false);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);
        // Save the ID so the Dashboard knows who we are
        if (typeof window !== 'undefined') {
            localStorage.setItem('activated_id', accessId.toUpperCase());
        }

        try {
            const paymentAmount = 25000; // Cents

            // 1. Update Roster Uploads (Source of Truth)
            const { error: rosterError } = await supabase
                .from('roster_uploads')
                .update({
                    is_claimed: true,
                    payment_status: 'paid',
                    amount_paid: paymentAmount / 100 // Dollars
                })
                .eq('assigned_unique_id', accessId.toUpperCase());

            if (rosterError) throw rosterError;

            // 2. Insert into Public Profiles
            // We do this to ensure Admins can see "Users" in their dashboard view if they look at 'profiles' table
            // And to prepare for Auth Link later.
            // We use upsert on email to avoid duplicates if they re-activate or claim.
            // Note: We don't have a Auth User ID yet, so we generate a random UUID for the profile ID or let DB handle it if possible.
            // ACTUALLY: 'profiles.id' references 'auth.users.id'. We CANNOT insert into profiles without a valid Auth User ID.
            // So we skip Profile creation here. The Roster Upload IS the record.

            console.log("Activation Complete");

        } catch (e: any) {
            console.error(e);
            alert("Error finalizing activation: " + e.message);
        }

        await new Promise(r => setTimeout(r, 1000));
        router.push('/parent');
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Progress Header */}
            <div className="absolute top-8 left-0 w-full px-8 flex justify-between items-center z-20">
                <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Esc
                </Link>
                <div className="flex gap-2">
                    {STEPS.map((s) => (
                        <div key={s.id} className={clsx("h-1 rounded-full transition-all duration-500", currentStep === s.id ? "w-8 bg-white" : currentStep > s.id ? "w-2 bg-primary" : "w-2 bg-zinc-800")} />
                    ))}
                </div>
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
                        {/* Step 1: Email */}
                        {currentStep === 1 && (
                            <form onSubmit={handleStep1} className="space-y-6">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">PARENT <span className="text-primary">ACCESS</span></h1>
                                    <p className="text-zinc-500 text-sm">Enter your email to verify your roster spot.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        autoFocus
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-700 text-lg"
                                        placeholder="parent@example.com"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button type="submit" className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    Continue <ChevronRight size={18} />
                                </button>

                                <div className="text-center mt-6">
                                    <Link href="/parent" className="text-xs text-zinc-600 hover:text-white transition-colors">
                                        Already activated? Enter Dashboard
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Access ID */}
                        {currentStep === 2 && (
                            <form onSubmit={handleStep2} className="space-y-6">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">ACCESS <span className="text-primary">ID</span></h1>
                                    <p className="text-zinc-500 text-sm">Enter the Unique ID from your invite or card.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Unique ID</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        value={accessId}
                                        onChange={(e) => setAccessId(e.target.value.toUpperCase())}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-700 text-lg font-mono tracking-widest uppercase text-center"
                                        placeholder="GC-XXXX"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Verify Access <ChevronRight size={18} /></>}
                                </button>

                                <button type="button" onClick={() => setCurrentStep(1)} className="w-full text-zinc-500 text-sm py-2">Back</button>
                            </form>
                        )}

                        {/* Step 3: Review Info */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                        <Check size={32} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Record Found</h2>
                                    <p className="text-zinc-500 text-sm">Please review and confirm your details.</p>
                                </div>

                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Goalie Name</label>
                                            <input
                                                value={formData.goalieName}
                                                onChange={(e) => setFormData({ ...formData, goalieName: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Parent Name</label>
                                            <input
                                                value={formData.parentName}
                                                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Grad Year</label>
                                            <input
                                                value={formData.gradYear}
                                                onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Phone</label>
                                            <input
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                            />
                                        </div>
                                        {rosterData?.team && (
                                            <div className="col-span-2 pt-2 border-t border-zinc-800 text-center">
                                                <span className="text-xs text-zinc-500">Team: <span className="text-white font-bold">{rosterData.team}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button onClick={handleStep3} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                    Confirm Details
                                </button>
                            </div>
                        )}

                        {/* Step 4: Terms & Payment */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-white mb-2">Final Step</h3>
                                    <p className="text-zinc-500 text-sm">Terms of Service & Verification.</p>
                                </div>

                                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                                    {/* Terms Box */}
                                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 text-xs text-zinc-400 h-32 overflow-y-auto leading-relaxed">
                                        <p className="font-bold text-white mb-2">Liability Waiver & Terms</p>
                                        <p className="mb-2">I hereby authorize the staff of GoalieGuard to act for me according to their best judgment in any emergency requiring medical attention. I hereby waive and release GoalieGuard from any and all liability for any injuries or illnesses incurred while at the GoalieGuard program.</p>
                                        <p className="mb-2">I have no knowledge of any physical impairment that would be affected by the above named camper's participation in the program.</p>
                                        <p>I also understand the camp retains the right to use for publicity and advertising purposes, photographs of campers taken at camp.</p>
                                    </div>

                                    {/* Checkbox */}
                                    <div
                                        onClick={() => setTermsAccepted(!termsAccepted)}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
                                    >
                                        <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all mt-0.5", termsAccepted ? "bg-primary border-primary text-white" : "border-zinc-700 bg-zinc-900")}>
                                            {termsAccepted && <Check size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-white">I accept the Terms & Conditions</div>
                                            <div className="text-xs text-zinc-500 mt-1">By checking this box, you agree to the liability waiver and privacy policy.</div>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="text-red-500 text-sm text-center animate-pulse">{error}</div>}

                                <button
                                    onClick={handleStep4}
                                    className={clsx(
                                        "w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                        termsAccepted ? "bg-primary hover:bg-rose-600 text-white shadow-lg shadow-primary/20" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Complete Activation <Check size={18} /></>}
                                </button>
                            </div>
                        )}

                        {/* Step 5: Success */}
                        {currentStep === 5 && (
                            <div className="text-center py-10 space-y-6">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                                    <Check size={48} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white italic tracking-tight">YOU'RE IN</h2>
                                    <p className="text-zinc-400 mt-2">Goalie Card Activated Successfully.</p>
                                </div>
                                <button onClick={handleFinish} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors w-full">
                                    Open Dashboard
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
