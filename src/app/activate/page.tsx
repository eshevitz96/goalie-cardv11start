"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, User, Shield, CreditCard, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

const STEPS = [
    { id: 1, title: "Email", icon: User },
    { id: 2, title: "Access ID", icon: Shield },
    { id: 3, title: "Review", icon: Check },
    { id: 4, title: "Payment", icon: CreditCard },
    { id: 5, title: "Finish", icon: ArrowRight },
];

export default function ActivatePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [email, setEmail] = useState("");
    const [accessId, setAccessId] = useState("");
    const [rosterData, setRosterData] = useState<any>(null); // Data from Supabase

    // Editable Form Data
    const [formData, setFormData] = useState({
        parentName: "",
        goalieName: "",
        phone: "",
        gradYear: "",
        height: "",
        weight: "",
    });

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
        // Payment Logic (Mocked)
        setIsLoading(true);
        // Simulate Stripe
        await new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
        setCurrentStep(5);
    };

    const handleFinish = async () => {
        setIsLoading(true);
        // Here we would create the Profile and Mark as Claimed
        // For now, redirect to Dashboard
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
                                        placeholder="GC-XXXX-XXXX"
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

                        {/* Step 4: Payment */}
                        {currentStep === 4 && (
                            <div className="space-y-6 text-center">
                                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                    <CreditCard size={48} className="text-zinc-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Link Payment Method</h3>
                                    <p className="text-zinc-400 text-sm mb-6">Securely link a card for automated lesson payments.</p>
                                    <button className="w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                        <CreditCard size={16} /> Add Card via Stripe
                                    </button>
                                </div>
                                <button
                                    onClick={handleStep4}
                                    className="w-full py-4 bg-primary hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
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
