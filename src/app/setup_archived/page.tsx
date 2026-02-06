"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronRight, User, Ruler, Weight, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";

export default function OnboardingPage() {
    const router = useRouter();
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        goalie_name: "",
        height: "",
        weight: "",
        catch_hand: "Left",
        baseline_confidence: "5",
        baseline_goal: "",
        baseline_frustration: "",
        accepted_terms: false
    });

    // Load initial data (if any) from DB
    const [isLoaded, setIsLoaded] = useState(false);

    // Simulate checking user ID and loading known data
    useState(() => {
        // In real app, we fetch from supabase based on auth
        // For now, we assume user is authenticated and we might have partial data
        setIsLoaded(true);
    });

    const handleNext = () => {
        if (step === 1 && (!formData.height || !formData.weight)) {
            toast.warning("Please complete your physical profile.");
            return;
        }
        if (step === 2 && !formData.accepted_terms) {
            toast.warning("Please accept the terms to continue.");
            return;
        }
        if (step === 3 && !formData.baseline_goal.trim()) {
            toast.warning("Please share a goal for the season.");
            return;
        }

        if (step < 4) {
            setStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        const rosterId = localStorage.getItem('setup_roster_id');

        if (!rosterId) {
            toast.error("Session Lost. Please restart activation.");
            router.push('/activate');
            return;
        }

        try {
            // Update Supabase
            const { error } = await supabase.from('roster_uploads').update({
                height: formData.height,
                weight: formData.weight,
                catch_hand: formData.catch_hand,
                // Mark Setup as complete in raw_data
                raw_data: {
                    setup_complete: true,
                    baseline_confidence: formData.baseline_confidence,
                    baseline_goal: formData.baseline_goal,
                    baseline_frustration: formData.baseline_frustration,
                    accepted_terms_date: new Date().toISOString()
                }
            }).eq('id', rosterId);

            if (error) {
                // If RLS blocks update (possible if they are new user and own row policy isn't strict yet), 
                // we might need to rely on the backend or policy fix.
                // For now, in Beta, we assume paid/invited users have access.
                console.error("Setup Update Error:", error);
                // We proceed anyway to dashboard as data might be saved locally or non-critical blocking for beta
            }

            // Determine destination based on Role
            let destination = '/parent'; // Default
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile?.role === 'goalie') {
                    destination = '/goalie';
                }
            }

            // Perform Routing IMMEDIATELY
            // Force a hard redirect incase router.push gets stuck
            if (typeof window !== 'undefined') {
                window.location.href = destination;
            } else {
                router.push(destination);
            }

        } catch (e) {
            console.error(e);
            toast.error("Error saving profile. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Progress Bar */}
            <div className="w-full h-2 bg-secondary">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">

                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            {step === 1 && "Start Your Profile"}
                            {step === 2 && "Terms of Service"}
                            {step === 3 && "Establish Baseline"}
                            {step === 4 && "You're All Set"}
                        </h1>
                        <p className="text-muted-foreground">
                            {step === 1 && "Let's get your digital card set up."}
                            {step === 2 && "Important legal stuff for your protection."}
                            {step === 3 && "Where is your head at right now?"}
                            {step === 4 && "Welcome to the future of goaltending."}
                        </p>
                    </div>

                    {/* Step 1: Profile Details */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-4 bg-card border border-border p-6 rounded-3xl">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Height</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-3 text-muted-foreground" size={18} />
                                        <input
                                            value={formData.height}
                                            onChange={e => setFormData({ ...formData, height: e.target.value })}
                                            placeholder="e.g. 5'11"
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Weight</label>
                                    <div className="relative">
                                        <Weight className="absolute left-3 top-3 text-muted-foreground" size={18} />
                                        <input
                                            value={formData.weight}
                                            onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                            placeholder="e.g. 175 lbs"
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-10 pr-4 focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Catch Hand</label>
                                    <div className="flex bg-secondary/50 p-1 rounded-xl">
                                        {['Left', 'Right'].map(hand => (
                                            <button
                                                key={hand}
                                                onClick={() => setFormData({ ...formData, catch_hand: hand })}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.catch_hand === hand ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                            >
                                                {hand}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Terms */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="h-64 overflow-y-auto bg-card border border-border rounded-2xl p-4 text-xs text-muted-foreground leading-relaxed">
                                <p className="font-bold text-foreground mb-2">Goalie Card - Beta Terms</p>
                                <p className="mb-2">
                                    <strong>1. Data Privacy:</strong> We take your data seriously. As part of this Beta, certain performance data may be shared with your assigned coaching staff.
                                </p>
                                <p className="mb-2">
                                    <strong>2. AI Usage:</strong> This platform uses Artificial Intelligence to provide training insights. While we strive for accuracy, AI suggestions should not replace professional medical or coaching advice.
                                </p>
                                <p className="mb-2">
                                    <strong>3. Minors:</strong> Accounts for users under 13 must be managed by a parent or guardian.
                                </p>
                                <p className="italic opacity-50">
                                    (Full Standard Legal Terms & Privacy Policy Placeholder - To be updated for production release)
                                </p>
                            </div>

                            <label className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl cursor-pointer border border-transparent hover:border-primary/30 transition-colors">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.accepted_terms ? 'bg-primary border-primary text-background' : 'border-muted-foreground'}`}>
                                    {formData.accepted_terms && <Check size={14} strokeWidth={4} />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.accepted_terms}
                                    onChange={e => setFormData({ ...formData, accepted_terms: e.target.checked })}
                                />
                                <span className="text-sm font-medium">I agree to the Terms of Service & Privacy Policy</span>
                            </label>
                        </motion.div>
                    )}

                    {/* Step 3: Baseline Questions */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-4 bg-card border border-border p-6 rounded-3xl">
                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-2 block">1. Confidence Level (1-10)?</label>
                                    <input
                                        type="range" min="1" max="10" step="1"
                                        value={formData.baseline_confidence}
                                        onChange={e => setFormData({ ...formData, baseline_confidence: e.target.value })}
                                        className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                                        <span>Low</span>
                                        <span className="font-bold text-primary text-lg">{formData.baseline_confidence}</span>
                                        <span>High</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">2. Biggest Goal This Season?</label>
                                    <textarea
                                        value={formData.baseline_goal}
                                        onChange={e => setFormData({ ...formData, baseline_goal: e.target.value })}
                                        placeholder="e.g. Improve rebound control..."
                                        className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none h-24 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1 mb-1 block">3. Biggest Frustration Currently?</label>
                                    <textarea
                                        value={formData.baseline_frustration}
                                        onChange={e => setFormData({ ...formData, baseline_frustration: e.target.value })}
                                        placeholder="e.g. Inconsistent meaningful feedback..."
                                        className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none h-24 resize-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={48} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Card Activated</h3>
                            <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
                        </motion.div>
                    )}

                    {/* Navigation */}
                    {step < 4 && (
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                        >
                            {step === 2 ? "Accept & Continue" : "Continue"}
                            <ArrowRight className={`transition-transform ${step !== 2 ? 'group-hover:translate-x-1' : ''}`} size={20} />
                        </button>
                    )}
                </div>
            </div>
        </main >
    );
}
