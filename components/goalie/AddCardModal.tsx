"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const SPORTS = [
    { id: "Hockey", label: "Hockey", emoji: "🥅" },
    { id: "Lacrosse", label: "Lacrosse", emoji: "🥍" },
    { id: "Soccer", label: "Soccer", emoji: "⚽" },
];

interface AddCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    userEmail: string;
    userName?: string;
}

export function AddCardModal({ isOpen, onClose, onCreated, userEmail, userName }: AddCardModalProps) {
    const [step, setStep] = useState<'sport' | 'details' | 'success'>('sport');
    const [sport, setSport] = useState<string | null>(null);
    const [team, setTeam] = useState("");
    const [gradYear, setGradYear] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        // Reset on close
        setSport(null); setTeam(""); setGradYear(""); setStep('sport'); setError(null);
        onClose();
    };

    const handleCreate = async () => {
        if (!sport) return;
        setIsLoading(true);
        setError(null);
        try {
            const { createAdditionalCard } = await import("@/app/goalie/actions");
            const result = await createAdditionalCard({ sport, team, gradYear: gradYear ? parseInt(gradYear) : null, email: userEmail, name: userName });
            if (!result.success) throw new Error(result.error);
            setStep('success');
            setTimeout(() => {
                handleClose();
                onCreated();
            }, 1800);
        } catch (err: any) {
            setError(err.message || "Failed to create card.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter text-foreground">Add a card</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {step === 'sport' ? 'Choose your sport' : 'Enter your details'}
                            </p>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Step: Sport */}
                    {step === 'sport' && (
                        <div className="space-y-3">
                            {SPORTS.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSport(s.id); setStep('details'); }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                >
                                    <span className="text-2xl">{s.emoji}</span>
                                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step: Details */}
                    {step === 'details' && sport && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                                <span className="text-lg">{SPORTS.find(s => s.id === sport)?.emoji}</span>
                                <span className="text-sm font-black text-primary">{sport}</span>
                                <button onClick={() => setStep('sport')} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline">Change</button>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Team</label>
                                <input
                                    value={team}
                                    onChange={(e) => setTeam(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                                    placeholder="e.g. Ladue Rams"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Grad Year</label>
                                <input
                                    value={gradYear}
                                    onChange={(e) => setGradYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                                    placeholder="e.g. 2026"
                                    maxLength={4}
                                />
                            </div>

                            {error && <p className="text-xs text-destructive font-bold">{error}</p>}

                            <Button
                                onClick={handleCreate}
                                disabled={isLoading || !team}
                                className="w-full py-3 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Create Card'}
                            </Button>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="text-emerald-500" size={28} />
                            </div>
                            <h3 className="font-black text-lg text-foreground tracking-tight">{sport} card created!</h3>
                            <p className="text-sm text-muted-foreground">Your new card is ready.</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
