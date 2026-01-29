"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, User, Shield, Briefcase, FileText, ArrowRight, Loader2, AlertCircle, Users, Calendar, Medal, DollarSign } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";

const STEPS = [
    { id: 1, title: "Email", icon: User },
    { id: 2, title: "Identity", icon: Shield },
    { id: 3, title: "Training", icon: Briefcase },
    { id: 4, title: "Terms", icon: FileText },
    { id: 5, title: "Finish", icon: ArrowRight },
];

function CoachActivateContent() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Email
    const [email, setEmail] = useState("");

    // Step 2: Identity (Profile & Auth)
    const [identity, setIdentity] = useState({
        fullName: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    // Step 3: Training & Engagement
    const [trainingTypes, setTrainingTypes] = useState<string[]>([]);
    const [engagementModel, setEngagementModel] = useState({
        privateType: 'package', // 'package' | 'subscription'
        packageCount: "4",
        packageCost: "500",
        subCount: "3",
        subCost: "400",
        philosophy: ""
    });

    // Step 4: Terms
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.includes("@")) {
            setError("Please enter a valid email.");
            return;
        }
        setCurrentStep(2);
    };

    const handleStep2 = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!identity.fullName || !identity.phone || !identity.password) {
            setError("All fields are required.");
            return;
        }
        if (identity.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (identity.password !== identity.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setCurrentStep(3);
    };

    const toggleTrainingType = (type: string) => {
        setTrainingTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleStep3 = (e: React.FormEvent) => {
        e.preventDefault();
        if (trainingTypes.length === 0) {
            setError("Please select at least one training type.");
            return;
        }
        if (trainingTypes.includes('private') && !engagementModel.philosophy) {
            setError("Please describe your development philosophy.");
            return;
        }
        setError(null);
        setCurrentStep(4);
    };

    const handleActivation = async () => {
        if (!termsAccepted) {
            setError("You must accept the terms to proceed.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            // Construct Pricing Config Object
            const pricingConfig = {
                private: trainingTypes.includes('private') ? {
                    type: engagementModel.privateType,
                    details: engagementModel.privateType === 'package' ? {
                        lessons_per_session: parseInt(engagementModel.packageCount),
                        cost: parseInt(engagementModel.packageCost)
                    } : {
                        sessions_per_month: parseInt(engagementModel.subCount),
                        cost: parseInt(engagementModel.subCost)
                    }
                } : null
            };

            // Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: identity.password,
                options: {
                    data: {
                        role: 'coach',
                        full_name: identity.fullName,
                        phone: identity.phone,
                        training_types: trainingTypes,
                        pricing_config: pricingConfig,
                        development_philosophy: engagementModel.philosophy
                    }
                }
            });

            if (authError) throw authError;

            // Normally we would process payment here via Stripe (similar to parent portal)
            // For now, checks 'role' trigger in Supabase or we assume success.

            // Proceed to Success
            setCurrentStep(5);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Activation Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambient (Blue/Cyan for Coach) */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-indigo-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="absolute top-8 left-0 w-full px-8 flex justify-between items-center z-20">
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    Esc
                </Link>
                <div className="flex gap-2">
                    {STEPS.map((s) => (
                        <div key={s.id} className={clsx("h-1 rounded-full transition-all duration-500", currentStep === s.id ? "w-8 bg-foreground" : currentStep > s.id ? "w-2 bg-blue-500" : "w-2 bg-muted")} />
                    ))}
                </div>
            </div>

            <div className="w-full max-w-lg relative z-10 mt-12">
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
                                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">COACH <span className="text-blue-500">ACCESS</span></h1>
                                    <p className="text-muted-foreground text-sm">Enter your email to start your coaching profile.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        autoFocus
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-blue-500 transition-colors placeholder:text-muted-foreground/50 text-lg"
                                        placeholder="coach@example.com"
                                    />
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <button type="submit" className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                    Continue <ChevronRight size={18} />
                                </button>
                            </form>
                        )}

                        {/* Step 2: Identity */}
                        {currentStep === 2 && (
                            <form onSubmit={handleStep2} className="space-y-6">
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">IDENTITY <span className="text-blue-500">SETUP</span></h1>
                                    <p className="text-muted-foreground text-sm">Tell us who you are.</p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                        <input
                                            required
                                            value={identity.fullName}
                                            onChange={(e) => setIdentity({ ...identity, fullName: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-blue-500 outline-none"
                                            placeholder="Coach Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                                        <input
                                            required
                                            value={identity.phone}
                                            onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-blue-500 outline-none"
                                            placeholder="(555) 555-5555"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={identity.password}
                                                onChange={(e) => setIdentity({ ...identity, password: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-blue-500 outline-none"
                                                placeholder="••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confirm</label>
                                            <input
                                                type="password"
                                                required
                                                value={identity.confirmPassword}
                                                onChange={(e) => setIdentity({ ...identity, confirmPassword: e.target.value })}
                                                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-blue-500 outline-none"
                                                placeholder="••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setCurrentStep(1)} className="flex-1 py-4 text-muted-foreground hover:text-foreground">Back</button>
                                    <button type="submit" className="flex-[2] bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                        Next Step <ChevronRight size={18} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Training Config */}
                        {currentStep === 3 && (
                            <form onSubmit={handleStep3} className="space-y-6">
                                <div className="text-center mb-4">
                                    <h1 className="text-2xl font-black italic tracking-tighter text-foreground mb-1">TRAINING <span className="text-blue-500">MODEL</span></h1>
                                    <p className="text-muted-foreground text-xs">Customize how you engage with goalies.</p>
                                </div>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                    {/* Training Types */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Training Types</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Group', 'Events', 'Private'].map(type => (
                                                <div
                                                    key={type}
                                                    onClick={() => toggleTrainingType(type.toLowerCase())}
                                                    className={clsx(
                                                        "p-3 rounded-xl border cursor-pointer text-center transition-all",
                                                        trainingTypes.includes(type.toLowerCase())
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-500 font-bold"
                                                            : "bg-secondary border-border text-muted-foreground hover:border-blue-500/50"
                                                    )}
                                                >
                                                    {type === 'Events' ? 'Events (>10)' : type}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Private Engagement Customization */}
                                    {trainingTypes.includes('private') && (
                                        <div className="bg-card border border-border rounded-2xl p-4 space-y-4 animate-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground pb-2 border-b border-border">
                                                <Medal size={16} className="text-blue-500" />
                                                Private Engagement Model
                                            </div>

                                            {/* Model Selector */}
                                            <div className="grid grid-cols-2 gap-2 bg-secondary p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setEngagementModel({ ...engagementModel, privateType: 'package' })}
                                                    className={clsx("py-2 text-xs font-bold rounded-lg transition-all", engagementModel.privateType === 'package' ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                                                >
                                                    Package Based
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEngagementModel({ ...engagementModel, privateType: 'subscription' })}
                                                    className={clsx("py-2 text-xs font-bold rounded-lg transition-all", engagementModel.privateType === 'subscription' ? "bg-background shadow text-foreground" : "text-muted-foreground")}
                                                >
                                                    Subscription
                                                </button>
                                            </div>

                                            {/* Inputs based on Model */}
                                            {engagementModel.privateType === 'package' ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Lessons / Session</label>
                                                        <div className="relative">
                                                            <input type="number" value={engagementModel.packageCount} onChange={(e) => setEngagementModel({ ...engagementModel, packageCount: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 pl-3 text-sm" />
                                                            <span className="absolute right-3 top-2 text-xs text-muted-foreground">credits</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Total Cost</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2 text-xs text-muted-foreground">$</span>
                                                            <input type="number" value={engagementModel.packageCost} onChange={(e) => setEngagementModel({ ...engagementModel, packageCost: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 pl-6 text-sm" />
                                                        </div>
                                                    </div>
                                                    <p className="col-span-2 text-[10px] text-muted-foreground italic">
                                                        "I have established my {engagementModel.packageCount} lessons = 1 session for goalies."
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Lessons / Month</label>
                                                        <input type="number" value={engagementModel.subCount} onChange={(e) => setEngagementModel({ ...engagementModel, subCount: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Monthly Cost</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2 text-xs text-muted-foreground">$</span>
                                                            <input type="number" value={engagementModel.subCost} onChange={(e) => setEngagementModel({ ...engagementModel, subCost: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 pl-6 text-sm" />
                                                        </div>
                                                    </div>
                                                    <p className="col-span-2 text-[10px] text-muted-foreground italic">
                                                        "Subscription for {engagementModel.subCount} lessons per month at set cost."
                                                    </p>
                                                </div>
                                            )}

                                            {/* Philosophy */}
                                            <div className="pt-2">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Philosophy & Tracking</label>
                                                <textarea
                                                    value={engagementModel.philosophy}
                                                    onChange={(e) => setEngagementModel({ ...engagementModel, philosophy: e.target.value })}
                                                    className="w-full h-24 bg-secondary border border-border rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none"
                                                    placeholder="Explain how you track development and why this model works for the goalie..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setCurrentStep(2)} className="flex-1 py-4 text-muted-foreground hover:text-foreground">Back</button>
                                    <button type="submit" className="flex-[2] bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                        Summary <ChevronRight size={18} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: Terms & Payment */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="text-center mb-4">
                                    <h3 className="text-xl font-bold text-foreground mb-2">Final Step</h3>
                                    <p className="text-muted-foreground text-sm">Terms & Activation.</p>
                                </div>

                                <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                                    {/* Summary View */}
                                    <div className="bg-secondary/50 rounded-xl p-4 border border-border/50 space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Account</span>
                                            <span className="font-bold">{identity.fullName}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Training</span>
                                            <span className="font-bold capitalize">{trainingTypes.join(", ")}</span>
                                        </div>
                                        {trainingTypes.includes('private') && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Model</span>
                                                <span className="font-bold capitalize text-blue-400">{engagementModel.privateType}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Activation Fee Card (Similar to Parent) */}
                                    <div className="p-4 rounded-xl border border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Coach Activation</div>
                                            <div className="text-xl font-bold text-foreground">$100<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
                                        </div>
                                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                            <DollarSign size={20} />
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div
                                        onClick={() => setTermsAccepted(!termsAccepted)}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-secondary border border-border cursor-pointer hover:border-blue-500/50 transition-colors"
                                    >
                                        <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all mt-0.5", termsAccepted ? "bg-blue-500 border-blue-500 text-white" : "border-muted-foreground/30 bg-card")}>
                                            {termsAccepted && <Check size={14} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-foreground">I accept the Terms & Conditions</div>
                                            <div className="text-xs text-muted-foreground mt-1">By organizing training on GoalieCard, you agree to our coach guidelines and payment processing terms.</div>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="text-red-500 text-sm text-center animate-pulse">{error}</div>}

                                <button
                                    onClick={handleActivation}
                                    className={clsx(
                                        "w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                        termsAccepted ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <>Activate Coach Profile <Check size={18} /></>}
                                </button>
                            </div>
                        )}

                        {/* Step 5: Success */}
                        {currentStep === 5 && (
                            <div className="text-center py-10 space-y-6">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-500">
                                    <Check size={48} className="text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-foreground italic tracking-tight">WELCOME COACH</h2>
                                    <p className="text-muted-foreground mt-2">Your profile is live. Parents can now find you.</p>
                                </div>
                                <button onClick={() => router.push('/coach')} className="px-8 py-3 bg-foreground text-background font-bold rounded-full hover:bg-foreground/90 transition-colors w-full">
                                    Enter Coach Dashboard
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}

export default function CoachActivatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
            <CoachActivateContent />
        </Suspense>
    );
}
