"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Loader2, 
    ArrowRight, 
    AlertCircle, 
    ShieldCheck, 
    Lock, 
    User, 
    Mail, 
    Phone, 
    Users,
    ChevronDown,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
    validateAccessCode, 
    createPrivateSubmission, 
    updateWaiverStatus, 
    createPrivateCheckoutSession,
    createConnectedCard 
} from "./actions";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";

type FlowStep = 'access-code' | 'info' | 'card-prompt' | 'waiver' | 'payment-confirm';

export default function PrivateTrainingAccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // UI State
    const [step, setStep] = useState<FlowStep>('access-code');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Data State
    const [accessCode, setAccessCode] = useState("");
    const [athleteName, setAthleteName] = useState("");
    const [parentName, setParentName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [hasExistingCard, setHasExistingCard] = useState(false);
    
    // Waiver State
    const [waiverConfirmed, setWaiverConfirmed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    
    // Mode State
    const [isTestMode, setIsTestMode] = useState(PRIVATE_ACCESS_CONFIG.stripe.isTestMode);

    // Initial check for submission ID from URL (e.g. if they cancel or refresh halfway)
    useEffect(() => {
        const id = searchParams.get('submission_id');
        if (id) {
            setSubmissionId(id);
            // We could fetch details and set step here, but for now just let them restart or go to waiver if the ID is valid.
        }
    }, [searchParams]);

    // Handlers
    const handleAccessCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const { isValid } = await validateAccessCode(accessCode);
            if (isValid) {
                setStep('info');
            } else {
                setError("Invalid access code. Please check your invitation.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const { submissionId: id, hasExistingCard: exists } = await createPrivateSubmission({
                athleteName,
                parentName,
                email,
                phone,
                accessCode
            });
            setSubmissionId(id);
            setHasExistingCard(exists);
            
            if (!exists) {
                setStep('card-prompt');
            } else {
                setStep('waiver');
            }
        } catch (err: any) {
            setError(err.message || "Failed to save information.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardPromptSubmit = async (confirmed: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!submissionId) throw new Error("Missing submissionId");
            if (confirmed) {
                await createConnectedCard(submissionId);
            }
            setStep('waiver');
        } catch (err: any) {
            setError(err.message || "Failed to handle card registry.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWaiverSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!waiverConfirmed || !termsAgreed) {
            setError("Please confirm waiver and agree to terms.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            if (!submissionId) throw new Error("Missing submission ID.");
            await updateWaiverStatus(submissionId, true);
            setStep('payment-confirm');
        } catch (err: any) {
            setError(err.message || "Failed to update waiver status.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaymentSubmit = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            if (!submissionId) throw new Error("Missing submission ID.");
            const { url } = await createPrivateCheckoutSession(submissionId, isTestMode);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("Failed to create payment session.");
            }
        } catch (err: any) {
            setError(err.message || "Payment initiation failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Minimalist Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-slate-500/30 to-primary/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="text-center mb-8 flex flex-col items-center">
                    <BrandLogo
                        size={40}
                        textClassName="text-3xl md:text-4xl font-medium tracking-tight mb-2"
                    />
                    <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold">
                        <Lock size={12} className="opacity-50" />
                        Private Training Access
                    </div>
                </div>

                <div className="bg-card/20 backdrop-blur-2xl border border-border/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        
                        {/* STEP 1: ACCESS CODE */}
                        {step === 'access-code' && (
                            <motion.div
                                key="access-code"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight">Invite-Only Access</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        This portal is reserved for specific athletes. Please enter your invitation code to proceed.
                                    </p>
                                </div>

                                <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value)}
                                                className="w-full bg-secondary/40 border border-border/60 rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 text-center tracking-[0.3em] font-mono text-xl uppercase"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl animate-pulse">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-7 text-lg rounded-2xl shadow-xl shadow-primary/10 group"
                                        loading={isLoading}
                                    >
                                        Validate Access <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 2: ATHLETE INFO */}
                        {step === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight">Athlete Registry</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Please provide the contact details for the athlete or parent.
                                    </p>
                                </div>

                                <form onSubmit={handleInfoSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 ml-1">Athlete Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={athleteName}
                                                onChange={(e) => setAthleteName(e.target.value)}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="Jake Dewey"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 ml-1">Parent Name (Optional)</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                                            <input
                                                type="text"
                                                value={parentName}
                                                onChange={(e) => setParentName(e.target.value)}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="Parker Dewey"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 ml-1">Contact Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="name@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                                placeholder="(555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="md:col-span-2 text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="md:col-span-2 py-6 rounded-xl mt-4"
                                        loading={isLoading}
                                    >
                                        Continue to Waiver <ArrowRight size={18} />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 3: CARD PROMPT */}
                        {step === 'card-prompt' && (
                            <motion.div
                                key="card-prompt"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8 text-center"
                            >
                                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/10">
                                    <ShieldCheck size={40} className="text-primary opacity-60" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight">Initialize Goalie Card</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                        We couldn't find an existing Goalie Card for {email}. Initialize your profile now to sync your training data and stats.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={() => handleCardPromptSubmit(true)}
                                        className="w-full py-6 rounded-2xl shadow-xl shadow-primary/10"
                                        loading={isLoading}
                                    >
                                        Create Connected Card <ArrowRight size={18} />
                                    </Button>
                                    <button 
                                        onClick={() => handleCardPromptSubmit(false)}
                                        disabled={isLoading}
                                        className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors py-2"
                                    >
                                        Skip for now
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: WAIVER */}
                        {step === 'waiver' && (
                            <motion.div
                                key="waiver"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight">Waiver & Terms</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        Please review and confirm the required training waivers.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-secondary/40 border border-border/40 rounded-2xl p-6 text-xs text-muted-foreground leading-relaxed h-48 overflow-y-auto custom-scrollbar">
                                        <h4 className="font-black text-foreground mb-3 text-[10px] uppercase tracking-widest">Training Terms & Conditions</h4>
                                        <p className="mb-4">
                                            {PRIVATE_ACCESS_CONFIG.trainingTerms.availability}
                                        </p>
                                        <p className="mb-4">
                                            {PRIVATE_ACCESS_CONFIG.trainingTerms.limitations}
                                        </p>
                                        <p className="mb-4">
                                            {PRIVATE_ACCESS_CONFIG.trainingTerms.productType}
                                        </p>
                                        <p>
                                            {PRIVATE_ACCESS_CONFIG.trainingTerms.refundPolicy}
                                        </p>
                                        <div className="mt-6 pt-6 border-t border-border/40">
                                            <p className="font-bold text-foreground mb-2">Waiver Handoff</p>
                                            <p>If you haven't completed the physical waiver on LeagueApps, please do so before checking the box below. In-person training cannot commence without a signed liability release.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleWaiverSubmit} className="space-y-4">
                                        <label className="flex items-start gap-3 p-4 bg-secondary/20 hover:bg-secondary/30 border border-border/30 rounded-2xl cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={waiverConfirmed}
                                                onChange={(e) => setWaiverConfirmed(e.target.checked)}
                                                className="mt-1 w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary"
                                            />
                                            <span className="text-xs text-muted-foreground leading-tight">
                                                I confirm the required waiver has been completed on LeagueApps.
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-3 p-4 bg-secondary/20 hover:bg-secondary/30 border border-border/30 rounded-2xl cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={termsAgreed}
                                                onChange={(e) => setTermsAgreed(e.target.checked)}
                                                className="mt-1 w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary"
                                            />
                                            <span className="text-xs text-muted-foreground leading-tight">
                                                I agree to the training terms, availability schedule, and refund policy as stated above.
                                            </span>
                                        </label>

                                        {error && (
                                            <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl">
                                                <AlertCircle size={14} /> {error}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full py-6 rounded-2xl mt-4"
                                            loading={isLoading}
                                            disabled={!waiverConfirmed || !termsAgreed}
                                        >
                                            Review Payment <ArrowRight size={18} />
                                        </Button>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: PAYMENT CONFIRM */}
                        {step === 'payment-confirm' && (
                            <motion.div
                                key="payment-confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-8 text-center"
                            >
                                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2 border border-primary/10">
                                    <CheckCircle2 size={40} className="text-primary opacity-80" />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight">Secure Final Access</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        You are about to secure private training access for <strong>{athleteName}</strong>.
                                    </p>
                                </div>

                                <div className="bg-secondary/30 border border-border/40 rounded-3xl p-6 space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Product</span>
                                        <span className="text-sm font-bold">Private Training</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2 border-t border-border/30 pt-4">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Amount</span>
                                        <span className="text-2xl font-black">{isTestMode ? '$1.00' : '$1,600.00'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={handlePaymentSubmit}
                                        className="w-full py-7 text-lg rounded-2xl shadow-xl shadow-primary/10 group"
                                        loading={isLoading}
                                    >
                                        {isTestMode ? 'Run Test Payment' : 'Secure Access'} <Lock size={16} className="ml-2 opacity-50" />
                                    </Button>
                                    
                                    <button 
                                        onClick={() => setIsTestMode(!isTestMode)}
                                        className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 hover:text-primary/50 transition-colors"
                                    >
                                        Mode: {isTestMode ? 'INTERNAL TEST' : 'PRODUCTION LIVE'}
                                    </button>
                                </div>

                                {error && (
                                    <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl animate-pulse">
                                        <AlertCircle size={14} /> {error}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30">
                    The Goalie Brand © 2026 • Private Enrollment
                </p>
            </div>
        </main>
    );
}
