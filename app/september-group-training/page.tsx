"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Loader2, 
    ArrowRight, 
    AlertCircle, 
    ShieldCheck, 
    User, 
    Mail, 
    Phone, 
    Users,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { 
    validateAccessCode, 
    createGroupSubmission, 
    updateWaiverStatus, 
    createEmbeddedCheckoutSession,
    createConnectedCard,
    getAvailableDates 
} from "./actions";
import { GROUP_TRAINING_CONFIG } from "@/constants/groupTraining";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type FlowStep = 'access-code' | 'info' | 'card-prompt' | 'waiver' | 'plan-selection' | 'date-selection' | 'payment-confirm';

export default function SeptemberGroupTrainingPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <Loader2 className="animate-spin text-slate-900 opacity-50" size={40} />
            </main>
        }>
            <SeptemberGroupTrainingContent />
        </Suspense>
    );
}

function SeptemberGroupTrainingContent() {
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
    const [selectedPlan, setSelectedPlan] = useState<'session1' | 'session2' | 'session3'>('session1');
    
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
    const [isTestMode, setIsTestMode] = useState(GROUP_TRAINING_CONFIG.stripe.isTestMode);

    // Date State
    const [availableDates, setAvailableDates] = useState<{date: string, spotsLeft: number}[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [fetchingDates, setFetchingDates] = useState(false);

    useEffect(() => {
        if (step === 'plan-selection') {
            setFetchingDates(true);
            getAvailableDates().then(dates => {
                setAvailableDates(dates);
                setFetchingDates(false);
            });
        }
    }, [step]);

    useEffect(() => {
        const id = searchParams.get('submission_id');
        if (id) {
            setSubmissionId(id);
        }
    }, [searchParams]);

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
            const res = await createGroupSubmission({
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
            const res = await updateWaiverStatus(submissionId!, true, signature);
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

    const handlePlanSelection = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedPlan === 'session3') {
            const hasFull = availableDates.some(d => d.spotsLeft <= 0);
            if (hasFull) {
                setError("The 3 Sessions package is no longer available because one or more dates are completely full.");
                return;
            }
            // Auto-select all dates and skip to checkout
            setIsLoading(true);
            setError(null);
            const allDates = availableDates.map(d => d.date);
            setSelectedDates(allDates);
            try {
                const res = await createEmbeddedCheckoutSession(submissionId!, selectedPlan, isTestMode, allDates);
                if (res.error) {
                    setError(res.error);
                    return;
                }
                if (res.clientSecret) {
                    setClientSecret(res.clientSecret);
                    setStep('payment-confirm');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Go to Date Selection Step
            setStep('date-selection');
        }
    };

    const handleDateSelectionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredCount = selectedPlan === 'session1' ? 1 : selectedPlan === 'session2' ? 2 : 3;
        if (selectedDates.length !== requiredCount) {
            setError(`Please select exactly ${requiredCount} date${requiredCount > 1 ? 's' : ''}.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await createEmbeddedCheckoutSession(submissionId!, selectedPlan, isTestMode, selectedDates);
            if (res.error) {
                setError(res.error);
                return;
            }
            if (res.clientSecret) {
                setClientSecret(res.clientSecret);
                setStep('payment-confirm');
                setClientSecret(res.clientSecret);
                setStep('payment-confirm');
            } else {
                setError("Failed to initialize checkout.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Minimalist Light Background */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-900" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="text-center mb-8 flex flex-col items-center">
                    <BrandLogo
                        size={40}
                        textClassName="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-slate-900"
                    />
                    <div className="flex items-center gap-2 text-slate-500 text-sm uppercase tracking-[0.2em] font-bold mt-2">
                        September Group Training
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
                    {/* Universal Back Button */}
                    {!isLoading && !clientSecret && (
                        <button
                            onClick={() => {
                                if (step === 'access-code') window.location.href = '/dashboard';
                                else if (step === 'info') setStep('access-code');
                                else if (step === 'card-prompt') setStep('info');
                                else if (step === 'waiver') setStep('card-prompt');
                                else if (step === 'plan-selection') setStep('waiver');
                                else if (step === 'date-selection') setStep('plan-selection');
                                else if (step === 'payment-confirm') {
                                    if (selectedPlan === 'session3') setStep('plan-selection');
                                    else setStep('date-selection');
                                }
                            }}
                            className="absolute top-6 left-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all z-20 group flex items-center justify-center"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    
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
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Enter Access Code</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                                        Please enter the code provided to access September Group Training.
                                    </p>
                                </div>

                                <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-bold focus:outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-400 text-center tracking-[0.2em] text-xl uppercase"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-600 bg-red-50 text-xs font-bold flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-lg rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold group"
                                        loading={isLoading}
                                    >
                                        Validate <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 2: INFO */}
                        {step === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Athlete Registry</h2>
                                </div>

                                <form onSubmit={handleInfoSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Athlete Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={athleteName}
                                                onChange={(e) => setAthleteName(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                                                placeholder="First Last"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Parent Name (Optional)</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                value={parentName}
                                                onChange={(e) => setParentName(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                                                placeholder="First Last"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                                                placeholder="name@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                                                placeholder="(555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="md:col-span-2 text-red-600 bg-red-50 text-xs font-bold flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="md:col-span-2 py-6 rounded-xl mt-4 bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        loading={isLoading}
                                    >
                                        Continue <ArrowRight size={18} className="ml-2" />
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
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-slate-200">
                                    <ShieldCheck size={40} className="text-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Connect Goalie Card</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                                        We couldn't find an existing Goalie Card for {email}. Connect your profile now to sync your training data and stats.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={() => handleCardPromptSubmit(true)}
                                        className="w-full py-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        loading={isLoading}
                                    >
                                        Connect Card <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                    <button 
                                        onClick={() => handleCardPromptSubmit(false)}
                                        disabled={isLoading}
                                        className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
                                    >
                                        Skip for now
                                    </button>
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold text-left flex items-start gap-3">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}
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
                                <div className="space-y-2 mb-8 text-center">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Waiver & Terms</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                                        Please review and acknowledge the training agreements.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {([
                                        { id: 'main', label: 'Group Liability Release' },
                                        { id: 'payment', label: 'Payment & Refund Policy' },
                                        { id: 'code', label: 'Athlete Code of Conduct' },
                                        { id: 'liability', label: 'Extended Waiver of Liability' }
                                    ] as const).map((w) => (
                                        <div key={w.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-xl transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={waiverChecks[w.id]}
                                                    onChange={(e) => setWaiverChecks({ ...waiverChecks, [w.id]: e.target.checked })}
                                                    className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                                />
                                                <span className="text-sm font-bold text-slate-700">{w.label}</span>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setViewingWaiver(w.id)}
                                                className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md"
                                            >
                                                View <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleWaiverSubmit} className="space-y-6 pt-4 border-t-2 border-slate-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Digital Signature (Type Full Name)</label>
                                        <input
                                            type="text"
                                            required
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:border-slate-900 transition-all"
                                            placeholder="Type your name to sign"
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-red-600 bg-red-50 text-xs font-bold flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        loading={isLoading}
                                    >
                                        Accept & Continue <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </form>

                                {/* Waiver Modal */}
                                <AnimatePresence>
                                    {viewingWaiver && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                                            onClick={() => setViewingWaiver(null)}
                                        >
                                            <motion.div 
                                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                                className="w-full max-w-lg bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-2xl relative max-h-[85vh] flex flex-col"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-slate-900 font-sans">
                                                        {viewingWaiver === 'main' ? 'GROUP LIABILITY RELEASE' :
                                                         viewingWaiver === 'payment' ? 'PAYMENT & REFUND POLICY' :
                                                         viewingWaiver === 'code' ? 'ATHLETE CODE OF CONDUCT' :
                                                         'EXTENDED WAIVER'}
                                                    </h3>
                                                    <button onClick={() => setViewingWaiver(null)} className="text-slate-400 hover:text-slate-900">
                                                        <Loader2 className="w-5 h-5 hidden" />
                                                        <span className="text-2xl leading-none">&times;</span>
                                                    </button>
                                                </div>
                                                <div className="overflow-y-auto pr-4 text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {viewingWaiver === 'main' ? GROUP_TRAINING_CONFIG.trainingTerms.mainWaiver :
                                                     viewingWaiver === 'payment' ? GROUP_TRAINING_CONFIG.trainingTerms.paymentPolicy :
                                                     viewingWaiver === 'code' ? GROUP_TRAINING_CONFIG.trainingTerms.codeOfConduct :
                                                     GROUP_TRAINING_CONFIG.trainingTerms.liabilityWaiver}
                                                </div>
                                                <Button 
                                                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-bold"
                                                    onClick={() => setViewingWaiver(null)}
                                                >
                                                    Close
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* STEP 5: PLAN SELECTION */}
                        {step === 'plan-selection' && (
                            <motion.div
                                key="plan-selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Select Sessions</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                                        Choose the number of September Group Training sessions at Lambert.
                                    </p>
                                </div>

                                <form onSubmit={handlePlanSelection} className="space-y-6">
                                    <div className="space-y-3">
                                        {[
                                            { id: 'session1', label: '1 Session', price: 150 },
                                            { id: 'session2', label: '2 Sessions', price: 300 },
                                            { id: 'session3', label: '3 Sessions', price: 450 }
                                        ].map((plan) => {
                                            const isActive = selectedPlan === plan.id;
                                            const isThreeSessionsFull = plan.id === 'session3' && availableDates.some(d => d.spotsLeft <= 0);
                                            const isDisabled = isThreeSessionsFull && plan.id === 'session3';
                                            
                                            return (
                                                <div
                                                    key={plan.id}
                                                    onClick={() => !isDisabled && setSelectedPlan(plan.id as any)}
                                                    className={`cursor-pointer border-2 rounded-xl p-5 flex items-center justify-between transition-all ${
                                                        isDisabled
                                                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                                                            : isActive 
                                                                ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' 
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-lg font-sans">{plan.label}</h3>
                                                        <p className="text-xs text-slate-500 font-medium">{isDisabled ? 'Unavailable - A date is full' : 'Group Training at Lambert'}</p>
                                                    </div>
                                                    <div className="text-xl font-bold text-slate-900">
                                                        ${plan.price}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {error && (
                                        <div className="text-red-600 bg-red-50 text-xs font-bold flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-lg rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        loading={isLoading}
                                    >
                                        Proceed to Checkout <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 5.5: DATE SELECTION */}
                        {step === 'date-selection' && (
                            <motion.div
                                key="date-selection"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Select Dates</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                                        Please select {selectedPlan === 'session1' ? '1 date' : '2 dates'} for your sessions.
                                    </p>
                                </div>

                                <form onSubmit={handleDateSelectionSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        {availableDates.map((d) => {
                                            const isSelected = selectedDates.includes(d.date);
                                            const isFull = d.spotsLeft <= 0;
                                            
                                            return (
                                                <div
                                                    key={d.date}
                                                    onClick={() => {
                                                        if (isFull) return;
                                                        if (isSelected) {
                                                            setSelectedDates(prev => prev.filter(x => x !== d.date));
                                                        } else {
                                                            const max = selectedPlan === 'session1' ? 1 : 2;
                                                            if (selectedDates.length < max) {
                                                                setSelectedDates(prev => [...prev, d.date]);
                                                            } else {
                                                                // replace the first one
                                                                setSelectedDates(prev => [...prev.slice(1), d.date]);
                                                            }
                                                        }
                                                    }}
                                                    className={`cursor-pointer border-2 rounded-xl p-5 flex items-center justify-between transition-all ${
                                                        isFull 
                                                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed' 
                                                            : isSelected 
                                                                ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10' 
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-lg font-sans">{d.date}</h3>
                                                        <p className="text-xs text-slate-500 font-medium">Lambert • Group Training</p>
                                                    </div>
                                                    <div className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {isFull ? 'FULL' : `${d.spotsLeft} spot${d.spotsLeft === 1 ? '' : 's'} left`}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {error && (
                                        <div className="text-red-600 bg-red-50 text-xs font-bold flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full py-6 text-lg rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        loading={isLoading}
                                    >
                                        Proceed to Checkout <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {/* STEP 6: PAYMENT */}
                        {step === 'payment-confirm' && clientSecret && (
                            <motion.div
                                key="payment-confirm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Checkout</h2>
                                    <p className="text-slate-500 text-sm mt-1">Complete your registration securely via Stripe.</p>
                                </div>
                                <div className="w-full min-h-[500px] bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden p-2">
                                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                        <EmbeddedCheckout />
                                    </EmbeddedCheckoutProvider>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center justify-center">
                &copy; {new Date().getFullYear()}&nbsp;&nbsp;<BrandLogo size={10} flowerSize="10px" iconClassName="opacity-40" text="Common Intellectual Creators" textClassName="text-[10px] font-bold uppercase tracking-widest text-slate-400" />
            </div>
        </main>
    );
}
