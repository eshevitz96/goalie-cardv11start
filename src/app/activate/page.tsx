"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, ChevronRight, Check, User, Shield, CreditCard, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { RosterEntry } from "@/context/AppContext";

const STEPS = [
    { id: 1, title: "Scan Card", icon: QrCode },
    { id: 2, title: "Select Coach", icon: User },
    { id: 3, title: "Player Info", icon: Shield },
    { id: 4, title: "Payment", icon: CreditCard },
    { id: 5, title: "Activate", icon: Check },
];

const AVAILABLE_COACHES = [
    { id: 1, name: "Coach Mike", org: "Baltimore Goalies", role: "Head Coach" },
    { id: 2, name: "Coach Sarah", org: "Elite Stoppers", role: "Senior Instructor" },
    { id: 3, name: "Coach Dave", org: "Next Level GK", role: "Director" },
];

export default function ActivatePage() {
    const { submitActivationRequest, checkRoster } = useApp();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
    const [rosterMatch, setRosterMatch] = useState<RosterEntry | null>(null);
    const [formData, setFormData] = useState({
        parentName: "",
        goalieName: "",
        email: "",
        phone: "",
        height: "",
        weight: "",
        birthYear: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ROSTER_DATA: RosterEntry[] = []; // Placeholder to fix lint; logic uses context checkRoster

    const handleNext = async () => {
        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
        }
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const coach = AVAILABLE_COACHES.find(c => c.id === selectedCoach);

        submitActivationRequest({
            parentName: formData.parentName,
            goalieName: formData.goalieName,
            coachId: coach ? coach.name : "Unknown Coach"
        });

        setIsSubmitting(false);
        // Move to success step
        setCurrentStep(5);
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-rose-600" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Progress Header */}
            <div className="absolute top-8 left-0 w-full px-8 flex justify-between items-center z-20">
                <Link href="/" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider">
                    Cancel
                </Link>
                <div className="flex gap-2">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className={clsx("h-1.5 rounded-full transition-all duration-500", currentStep === s.id ? "w-8 bg-white" : currentStep > s.id ? "w-2 bg-primary" : "w-2 bg-zinc-800")} />
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
                        {/* Step 1: Scan Card */}
                        {currentStep === 1 && (
                            <div className="space-y-8 text-center">
                                <h1 className="text-3xl font-black italic tracking-tighter">SCAN<span className="text-primary">CARD</span></h1>
                                <div className="relative mx-auto w-64 h-64 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-3xl flex items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setScannedCode("GC-2024-X8J2")}>
                                    {scannedCode ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-in fade-in zoom-in">
                                            <Check size={64} className="text-emerald-500" />
                                        </div>
                                    ) : (
                                        <>
                                            <QrCode size={64} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                        </>
                                    )}
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm">Tap the box to simulate scanning your physical card.</p>
                                </div>
                                {scannedCode && (
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="w-full py-4 bg-primary hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        Card Verified - Continue <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 2: Select Coach */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Select Your Coach</h2>
                                    <p className="text-zinc-500 text-sm">Who are you training with?</p>
                                </div>
                                <div className="space-y-3">
                                    {AVAILABLE_COACHES.map((coach) => (
                                        <button
                                            key={coach.id}
                                            onClick={() => setSelectedCoach(coach.id)}
                                            className={clsx(
                                                "w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group",
                                                selectedCoach === coach.id
                                                    ? "bg-primary/10 border-primary"
                                                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="relative z-10 flex justify-between items-center">
                                                <div>
                                                    <div className={clsx("font-bold text-lg", selectedCoach === coach.id ? "text-primary" : "text-white")}>{coach.name}</div>
                                                    <div className="text-xs text-zinc-500">{coach.role} • {coach.org}</div>
                                                </div>
                                                {selectedCoach === coach.id && (
                                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    disabled={!selectedCoach}
                                    className="w-full py-4 bg-primary disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:shadow-none flex items-center justify-center gap-2 mt-4"
                                >
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* Step 3: Player Info */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Player Profile</h2>
                                    <p className="text-zinc-500 text-sm">Create your digital roster spot.</p>
                                </div>
                                <div className="space-y-4">
                                    {/* Email First for Lookup */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Parent Email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => {
                                                    const em = e.target.value;
                                                    setFormData({ ...formData, email: em });
                                                    // Simple lookup check
                                                    if (em.includes('@') && em.length > 5) { // Basic validation for lookup
                                                        const match = checkRoster(em);
                                                        if (match) {
                                                            setRosterMatch(match);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                parentName: match.parentName,
                                                                goalieName: match.goalieName,
                                                                // Pre-fill others if we had them or keep existing
                                                            }));
                                                        } else {
                                                            setRosterMatch(null);
                                                            // Clear fields if email doesn't match a roster spot
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                parentName: "",
                                                                goalieName: ""
                                                            }));
                                                        }
                                                    } else {
                                                        setRosterMatch(null);
                                                    }
                                                }}
                                                className={clsx(
                                                    "w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white focus:outline-none placeholder:text-zinc-700 transition-colors",
                                                    rosterMatch ? "border-emerald-500/50 focus:border-emerald-500" : "border-zinc-800 focus:border-primary"
                                                )}
                                                placeholder="sarah@example.com"
                                            />
                                            {rosterMatch && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                                    <Check size={18} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Auto-Populated or Manual Fields */}
                                    <AnimatePresence>
                                        {rosterMatch && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 overflow-hidden"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                        <User size={20} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-sm">Welcome back, {rosterMatch.goalieName}!</div>
                                                        <div className="text-xs text-zinc-400 mt-1">
                                                            We found your roster spot.
                                                            <div className="flex gap-2 mt-2">
                                                                <span className="bg-black/50 px-2 py-1 rounded text-[10px] text-zinc-300 border border-zinc-700 font-mono">ID: {rosterMatch.gcId}</span>
                                                                <span className="bg-black/50 px-2 py-1 rounded text-[10px] text-zinc-300 border border-zinc-700 font-mono">Grad: {rosterMatch.gradYear}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Parent Name</label>
                                            <input
                                                type="text"
                                                value={formData.parentName}
                                                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Goalie Name</label>
                                            <input
                                                type="text"
                                                value={formData.goalieName}
                                                readOnly={!!rosterMatch}
                                                onChange={(e) => setFormData({ ...formData, goalieName: e.target.value })}
                                                className={clsx(
                                                    "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700",
                                                    rosterMatch && "opacity-50 cursor-not-allowed"
                                                )}
                                                placeholder="Leo Smith"
                                            />
                                        </div>

                                        {/* Birth Year - ALWAYS Required & Editable */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Birth Year <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                // Don't bind to rosterMatch.gradYear because we need actual Birth Year
                                                value={formData.birthYear || ""}
                                                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700"
                                                placeholder="2010"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>

                                        {/* Extra Optional */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Height <span className="text-zinc-700 normal-case">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={formData.height}
                                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                                placeholder="e.g. 5'8"
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Weight <span className="text-zinc-700 normal-case">(Optional)</span></label>
                                            <input
                                                type="text"
                                                value={formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                placeholder="lbs"
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    disabled={!formData.parentName || !formData.goalieName || !formData.email}
                                    className="w-full py-4 bg-primary disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* Step 4: Payment */}
                        {currentStep === 4 && (
                            <div className="space-y-6 text-center">
                                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                    <CreditCard size={48} className="text-zinc-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Add Payment Method</h3>
                                    <p className="text-zinc-400 text-sm mb-6">Securely link your card for session payments.</p>
                                    <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2">
                                        <CreditCard size={16} /> Link via Stripe
                                    </button>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 bg-primary hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finish Activation <Check size={18} /></>}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full text-zinc-500 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        )}

                        {/* Step 5: Success / Activate */}
                        {currentStep === 5 && (
                            <div className="text-center py-10">
                                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                                        <Check size={48} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white italic">REQUEST SENT</h2>
                                    <p className="text-zinc-400 max-w-xs mx-auto mb-8 text-lg">
                                        Your activation request has been sent to <span className="text-white font-bold">{AVAILABLE_COACHES.find(c => c.id === selectedCoach)?.name || "your coach"}</span>.
                                    </p>

                                    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 mb-8 max-w-xs mx-auto">
                                        <div className="text-xs uppercase text-zinc-500 font-bold tracking-widest mb-1">Status</div>
                                        <div className="text-lg font-bold text-white flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                            Pending Approval
                                        </div>
                                    </div>

                                    <Link href="/" className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-colors">
                                        Return to Dashboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
