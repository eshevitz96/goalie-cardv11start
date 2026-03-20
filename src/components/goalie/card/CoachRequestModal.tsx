"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, X, AlertCircle, BarChart2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

interface CoachRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    rosterId: string;
    goalieName: string;
    goalieSport?: string;
}

export function CoachRequestModal({ isOpen, onClose, rosterId, goalieName, goalieSport }: CoachRequestModalProps) {
    const [step, setStep] = useState(0); // Step 0: Service Selection
    const [serviceType, setServiceType] = useState<'pro' | 'recruiting' | null>(null);

    // Step 1 State
    const [coaches, setCoaches] = useState<{ id: string, goalie_name: string, bio?: string, sport?: string }[]>([]);
    const [loadingCoaches, setLoadingCoaches] = useState(false);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

    // Step 2 State
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Step 3 State
    const [goalieWhy, setGoalieWhy] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch coaches
    useEffect(() => {
        if (isOpen && coaches.length === 0) {
            setLoadingCoaches(true);
            const fetchCoaches = async () => {
                // Allow both 'coach' and 'admin' roles to appear as available mentors
                const { data } = await supabase
                    .from('profiles')
                    .select('id, goalie_name, bio, sport')
                    .or('role.eq.coach,role.eq.admin');
                
                if (data) {
                    // Filter by sport if the goalie has one set
                    let filtered = data;
                    if (goalieSport) {
                        filtered = data.filter(c => 
                            !c.sport || // default to all if not set
                            c.sport.toLowerCase().includes(goalieSport.toLowerCase()) ||
                            c.sport.toLowerCase().includes('all')
                        );
                    }
                    setCoaches(filtered);
                }
                setLoadingCoaches(false);
            };
            fetchCoaches();
        }
    }, [isOpen, goalieSport]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(0);
                setServiceType(null);
                setSelectedCoachId(null);
                setAgreedToTerms(false);
                setGoalieWhy("");
                setError(null);
            }, 300);
        }
    }, [isOpen]);

    const submitRequest = async () => {
        if (!selectedCoachId || !agreedToTerms || !goalieWhy.trim()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            const { error: insertError } = await supabase
                .from('coach_requests')
                .insert({
                    goalie_id: user.id,
                    coach_id: selectedCoachId,
                    roster_id: rosterId,
                    goalie_why: goalieWhy,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            // Show success briefly or just close
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div>
                        <h2 className="text-xl font-bold">Request Expert Access</h2>
                        <div className="text-xs text-muted-foreground mt-1">Step {step} of 3</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-muted">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: "33%" }}
                        animate={{ width: `${(step / 3) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <h3 className="text-lg font-bold mb-4">Select Support Type</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => { setServiceType('pro'); setStep(1); }}
                                        className="w-full text-left p-5 rounded-2xl border-2 border-border hover:border-primary bg-card/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Check size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">Pro Goaltending Coach</div>
                                                <div className="text-xs text-muted-foreground">Technical analysis and recurring hybrid sessions.</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setServiceType('recruiting'); setStep(1); }}
                                        className="w-full text-left p-5 rounded-2xl border-2 border-border hover:border-blue-500 bg-card/50 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                <BarChart2 size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground">Recruiting Consulting</div>
                                                <div className="text-xs text-muted-foreground">College coach connections and game film analysis.</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <h3 className="text-lg font-bold mb-4">Select a Coach</h3>

                                {loadingCoaches ? (
                                    <div className="text-center p-8 text-muted-foreground text-sm animate-pulse">
                                        Loading available coaches...
                                    </div>
                                ) : coaches.length === 0 ? (
                                    <div className="text-center p-8 text-muted-foreground text-sm">
                                        No coaches found.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {coaches.map(coach => (
                                            <button
                                                key={coach.id}
                                                onClick={() => setSelectedCoachId(coach.id)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${selectedCoachId === coach.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-muted/50 hover:border-primary/50'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-foreground">{coach.goalie_name}</div>
                                                        {coach.sport && (
                                                            <span className="text-[8px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                                                {coach.sport}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                                        {coach.bio || "Pro Goaltending Coach"}
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCoachId === coach.id ? 'border-primary bg-primary' : 'border-border'
                                                    }`}>
                                                    {selectedCoachId === coach.id && <Check size={14} className="text-primary-foreground" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedCoachId}
                                    className="w-full mt-6 bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight size={16} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 mb-2">PRO TIER SUBSCRIPTION</div>
                                    <div className="text-5xl font-black tracking-tighter text-foreground mb-1">$300<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
                                </div>

                                <div className="space-y-4 bg-muted/40 border border-border rounded-xl p-5">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">What's Included</h4>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex gap-3"><Check size={16} className="text-primary shrink-0 mt-0.5" /> <span><strong>4 {serviceType === 'recruiting' ? 'Consultations' : 'Hybrid Lessons'}</strong> per month with your Pro Coach.</span></li>
                                        <li className="flex gap-3"><Check size={16} className="text-primary shrink-0 mt-0.5" /> <span><strong>Direct Feedback Modules</strong> analyzing your {serviceType === 'recruiting' ? 'game film' : 'performance'}.</span></li>
                                        <li className="flex gap-3"><Check size={16} className="text-primary shrink-0 mt-0.5" /> <span><strong>{serviceType === 'recruiting' ? 'College Connection Strategy' : 'Personalized Development Plan'}</strong> tailored to your specific Goalie's Why.</span></li>
                                    </ul>
                                </div>

                                <label className="flex items-start gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background"
                                    />
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                        I understand that if my request is approved by the coach, my subscription will be upgraded to the Pro Tier, and I will be billed <strong>$300/month</strong> until canceled.
                                    </div>
                                </label>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(serviceType === 'recruiting' ? 0 : 1)}
                                        className="w-1/3 bg-muted text-foreground font-bold py-4 rounded-xl hover:bg-muted/80 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!agreedToTerms}
                                        className="w-2/3 bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        Continue <ChevronRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-lg font-bold mb-2">The Goalie's Why</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Explain why {goalieName} wants to work with this coach. What are their goals and aspirations? This helps the coach decide if they are the right fit.
                                    </p>
                                </div>

                                <textarea
                                    value={goalieWhy}
                                    onChange={(e) => setGoalieWhy(e.target.value)}
                                    placeholder="I want to improve my..."
                                    rows={5}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                />

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="w-1/3 bg-muted text-foreground font-bold py-4 rounded-xl hover:bg-muted/80 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={submitRequest}
                                        disabled={isSubmitting || !goalieWhy.trim()}
                                        className="w-2/3 bg-primary text-primary-foreground font-bold py-4 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Request"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
