"use client";

import { useState, useEffect, Suspense } from "react";
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
    CheckCircle2,
    X,
    FileText,
    Receipt,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
    validateAccessCode, 
    createPrivateSubmission, 
    updateWaiverStatus, 
    createEmbeddedCheckoutSession,
    createConnectedCard 
} from "./actions";
import { PRIVATE_ACCESS_CONFIG } from "@/constants/privateAccess";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type FlowStep = 'access-code' | 'info' | 'card-prompt' | 'waiver' | 'plan-selection' | 'payment-confirm';

export default function PrivateTrainingAccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-primary opacity-50" size={40} />
            </main>
        }>
            <PrivateTrainingAccessContent />
        </Suspense>
    );
}

function PrivateTrainingAccessContent() {
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
    const [selectedPlan, setSelectedPlan] = useState<'standard' | 'season' | 'monthly'>('standard');
    
    // Waiver State
    const [waiverChecks, setWaiverChecks] = useState({
        main: false,
        payment: false,
        code: false,
        liability: false
    });
    const [viewingWaiver, setViewingWaiver] = useState<string | null>(null);
    const [signature, setSignature] = useState("");
    const [signatureDate, setSignatureDate] = useState(new Date().toLocaleDateString());
    
    // Payment State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    
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
            const res = await createPrivateSubmission({
                athleteName,
                parentName,
                email,
                phone,
                accessCode
            });
            
            if ('error' in res && res.error) {
                setError(res.error);
                return;
            }
            
            const { submissionId: id, hasExistingCard: exists } = res as any;
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
                const res = await createConnectedCard(submissionId);
                if ('error' in res && res.error) {
                    setError(res.error);
                    return;
                }
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
        const allChecked = Object.values(waiverChecks).every(v => v);
        if (!allChecked || !signature) {
            setError("Please accept all waivers and provide your digital signature.");
            return;
        }
        
        setError(null);
        setIsLoading(true);
        
        try {
            // Update submission status in DB
            const res = await updateWaiverStatus(submissionId!, true);
            if (res.error) {
                setError(res.error);
                setIsLoading(false);
                return;
            }

            setStep('plan-selection');
            setIsLoading(false);
        } catch (err: any) {
            setError(err.message);
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
                                    <h2 className="text-2xl font-semibold tracking-tight">Connect Goalie Card</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                        We couldn't find an existing Goalie Card for {email}. Connect your profile now to sync your training data and stats.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={() => handleCardPromptSubmit(true)}
                                        className="w-full py-6 rounded-2xl shadow-xl shadow-primary/10"
                                        loading={isLoading}
                                    >
                                        Connect Card <ArrowRight size={18} />
                                    </Button>
                                    <button 
                                        onClick={() => handleCardPromptSubmit(false)}
                                        disabled={isLoading}
                                        className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors py-2"
                                    >
                                        Skip for now
                                    </button>
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-left flex items-start gap-3">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 3: WAIVER */}
                        {step === 'waiver' && (
                            <motion.div
                                key="waiver"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 mb-8 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight">Waiver & Terms</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        Please review and acknowledge each of the four training segments.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {([
                                        { id: 'main', label: 'Main Liability Release' },
                                        { id: 'payment', label: 'Payment & Refund Policy' },
                                        { id: 'code', label: 'Athlete Code of Conduct' },
                                        { id: 'liability', label: 'Extended Waiver of Liability' }
                                    ] as const).map((w) => (
                                        <div key={w.id} className="flex items-center justify-between p-4 bg-secondary/10 hover:bg-secondary/20 border border-border/20 rounded-2xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={waiverChecks[w.id]}
                                                    onChange={(e) => setWaiverChecks({ ...waiverChecks, [w.id]: e.target.checked })}
                                                    className="w-5 h-5 rounded border-border bg-transparent text-primary focus:ring-primary"
                                                />
                                                <span className="text-xs font-bold text-muted-foreground">{w.label}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setViewingWaiver(w.id)}
                                                className="text-[9px] uppercase tracking-widest font-black text-primary/60 hover:text-primary transition-colors flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full"
                                            >
                                                View <ChevronRight size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Waiver Modal */}
                                <AnimatePresence>
                                    {viewingWaiver && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl"
                                            onClick={() => setViewingWaiver(null)}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                                className="w-full max-w-lg bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative max-h-[85vh] flex flex-col"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xs uppercase tracking-[0.3em] font-black text-primary">
                                                        {viewingWaiver.toUpperCase()}
                                                    </h3>
                                                    <button 
                                                        onClick={() => setViewingWaiver(null)} 
                                                        className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-left">
                                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-serif italic opacity-80">
                                                        {(PRIVATE_ACCESS_CONFIG.trainingTerms as any)[viewingWaiver + (viewingWaiver === 'payment' ? 'Policy' : 'Waiver')]}
                                                    </p>
                                                </div>
                                                <Button 
                                                    onClick={() => {
                                                        setWaiverChecks({ ...waiverChecks, [viewingWaiver as keyof typeof waiverChecks]: true });
                                                        setViewingWaiver(null);
                                                    }}
                                                    className="mt-8 w-full py-6 rounded-2xl shadow-lg shadow-primary/10"
                                                >
                                                    Acknowledge & Accept
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleWaiverSubmit} className="space-y-4 pt-6 border-t border-border/20">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Digital Signature (Full Name)</label>
                                                <span className="text-[10px] text-primary/50 font-bold uppercase tracking-widest">Required</span>
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={signature}
                                                onChange={(e) => setSignature(e.target.value)}
                                                className="w-full bg-secondary/30 border border-border/50 rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-serif italic text-lg tracking-tight"
                                                placeholder="Type full name..."
                                            />
                                        </div>
                                        <div className="space-y-1.5 opacity-50">
                                            <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 ml-1">Signing Date</label>
                                            <div className="px-5 py-4 bg-secondary/20 border border-border/40 rounded-xl text-xs font-mono font-bold">
                                                {signatureDate}
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-4 rounded-xl animate-pulse font-bold uppercase tracking-widest">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-7 rounded-2xl mt-4 text-md shadow-xl shadow-primary/10 group"
                                        loading={isLoading}
                                        disabled={!Object.values(waiverChecks).every(v => v) || !signature}
                                    >
                                        Choose Plan <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 4: PLAN SELECTION */}
                        {step === 'plan-selection' && (
                            <motion.div
                                key="plan-selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 mb-8 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight">Select your Commitment</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        Choose the training block that fits your schedule.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button 
                                        onClick={() => setSelectedPlan('monthly')}
                                        className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${selectedPlan === 'monthly' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-secondary/10 border-border/40 hover:bg-secondary/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-lg">Legacy Member</h4>
                                                    <span className="text-[8px] bg-primary text-black px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Most Popular</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Monthly automated access. Set it and forget it.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-primary">$400.00</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black">Per Month</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setSelectedPlan('standard')}
                                        className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${selectedPlan === 'standard' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-secondary/10 border-border/40 hover:bg-secondary/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg">Standard Block</h4>
                                                <p className="text-xs text-muted-foreground">16 Lessons upfront. Traditional commitment.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-primary">$1,600.00</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black">One-Time</p>
                                            </div>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setSelectedPlan('season')}
                                        className={`w-full text-left p-5 rounded-3xl border transition-all relative overflow-hidden group ${selectedPlan === 'season' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-secondary/10 border-border/40 hover:bg-secondary/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg">Season Commitment</h4>
                                                <p className="text-xs text-muted-foreground">24 Sessions / 6 Months. Lock in your spots.</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-primary">$2,400.00</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-black">One-Time</p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                <Button
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await createEmbeddedCheckoutSession(submissionId!, selectedPlan, isTestMode);
                                        if (res.error) {
                                            setError(res.error);
                                            setIsLoading(false);
                                        } else {
                                            setClientSecret(res.clientSecret!);
                                            setStep('payment-confirm');
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="w-full py-7 rounded-2xl mt-4 text-md shadow-xl shadow-primary/10 group"
                                    loading={isLoading}
                                >
                                    Review & Secure <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button 
                                    onClick={() => setStep('waiver')}
                                    className="w-full text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors py-2"
                                >
                                    Back to Waiver
                                </button>
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

                                <div className="bg-secondary/30 border border-border/40 rounded-3xl p-6 space-y-4 mb-2">
                                    <div className="flex justify-between items-center px-2">
                                        <div className="text-left">
                                            <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Training Fee</span>
                                            <p className="text-[8px] text-primary/60 font-black uppercase tracking-[0.2em]">
                                                {selectedPlan === 'monthly' ? 'Every Month' : 
                                                 selectedPlan === 'season' ? 'Every 6 Months' : 'Every 4 Months'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold">
                                            {selectedPlan === 'monthly' ? '$400.00' : 
                                             selectedPlan === 'season' ? '$2,400.00' : '$1,600.00'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-2 pt-1">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Processing Fee</span>
                                        <span className="text-sm font-bold text-muted-foreground/80">
                                            {selectedPlan === 'monthly' ? '$12.25' : 
                                             selectedPlan === 'season' ? '$72.10' : '$48.10'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-2 border-t border-border/30 pt-4 mt-2">
                                        <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Final Total</span>
                                        <span className="text-2xl font-black text-primary">
                                            {selectedPlan === 'monthly' ? '$412.25' : 
                                             selectedPlan === 'season' ? '$2,472.10' : '$1,648.10'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-4">RECURRING {selectedPlan === 'monthly' ? 'MONTHLY' : selectedPlan === 'season' ? '6-MONTH' : '4-MONTH'} PAYMENT</p>
                                <p className="text-[9px] text-muted-foreground italic mb-6">Fee covers Stripe processing and secure platform handling.</p>
                                
                                {clientSecret && (
                                    <div className="mt-8 bg-white/5 rounded-3xl p-4 min-h-[400px]">
                                        <EmbeddedCheckoutProvider
                                            stripe={stripePromise}
                                            options={{ clientSecret }}
                                        >
                                            <EmbeddedCheckout />
                                        </EmbeddedCheckoutProvider>
                                    </div>
                                )}

                                {!clientSecret && !isLoading && (
                                    <Button 
                                        onClick={(e) => handleWaiverSubmit(e as any)}
                                        className="w-full py-6 rounded-2xl"
                                    >
                                        Re-initialize Checkout
                                    </Button>
                                )}
                                
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => {
                                            setStep('plan-selection');
                                            setClientSecret(null);
                                        }}
                                        className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 hover:text-primary transition-colors py-4 flex items-center justify-center gap-2 group"
                                    >
                                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Change Plan
                                    </button>
                                    
                                    <button 
                                        onClick={() => {
                                            setIsTestMode(!isTestMode);
                                            setClientSecret(null); 
                                        }}
                                        className="text-[8px] uppercase tracking-[0.3em] font-black text-muted-foreground/20 hover:text-primary/40 transition-colors py-2"
                                    >
                                        Mode: {isTestMode ? 'TEST' : 'LIVE'}
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
