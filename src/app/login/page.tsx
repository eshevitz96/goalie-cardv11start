"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, Lock, ArrowRight, User } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!email.includes("@")) {
            setError("Invalid Email");
            setIsLoading(false);
            return;
        }

        // Simulate network
        setTimeout(() => {
            setIsLoading(false);
            setStep(2);
        }, 500);
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // AUTHENTICATE via Custom PIN logic (Beta)
            // 1. Find user by Email
            const { data: userRecord, error: fetchError } = await supabase
                .from('roster_uploads')
                .select('*')
                .ilike('email', email.trim())
                .single();

            if (fetchError || !userRecord) {
                setError("Account not found. Please activate first.");
                setIsLoading(false);
                return;
            }

            // 2. Check PIN
            // We stored it in raw_data.access_pin during activation
            const storedPin = userRecord.raw_data?.access_pin;

            if (!storedPin) {
                setError("No PIN set. Please re-activate your account to set one.");
                setIsLoading(false);
                return;
            }

            if (storedPin !== pin) {
                setError("Incorrect PIN.");
                setIsLoading(false);
                return;
            }

            // 3. Success
            if (typeof window !== 'undefined') {
                localStorage.setItem('session_token', 'valid-beta-session');
                localStorage.setItem('user_email', email);
                localStorage.setItem('user_role', 'goalie'); // Default

                // CRITICAL: Set IDs for data fetching & setup
                if (userRecord.assigned_unique_id) {
                    localStorage.setItem('activated_id', userRecord.assigned_unique_id);
                }
                if (userRecord.id) {
                    localStorage.setItem('setup_roster_id', userRecord.id);
                }

                // Cleanup potentially conflicting modes
                localStorage.removeItem('demo_mode');
            }

            // Determine Redirect Destination
            let destination = '/setup'; // Default to setup (Questions)

            if (userRecord.raw_data?.setup_complete) {
                destination = '/parent';
            }

            // Force Redirect
            if (typeof window !== 'undefined') {
                window.location.href = destination;
            } else {
                router.push(destination);
            }

        } catch (err: any) {
            console.error(err);
            setError("Login Error: " + err.message);
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects matching Activate */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-sm space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">
                                ACCESS <span className="text-primary">PROFILE</span>
                            </h1>
                            <p className="text-muted-foreground text-sm">Enter your email to access your card.</p>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-lg placeholder:text-muted-foreground/50"
                                    placeholder="goalie@example.com"
                                    autoFocus
                                    required
                                />
                            </div>
                            {error && <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</div>}
                            <button
                                disabled={isLoading}
                                className="w-full bg-foreground text-background font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full max-w-sm space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-secondary/30 dark:bg-white/5 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm border border-border/50 dark:border-white/10 shadow-2xl">
                                <Lock size={40} className="text-muted-foreground dark:text-white/80" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">Enter PIN</h1>
                            <p className="text-muted-foreground text-sm">Hello, <span className="text-foreground dark:text-white font-medium">{email}</span></p>
                        </div>

                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-border dark:border-white/20 p-4 text-center text-5xl font-mono tracking-[0.5em] focus:outline-none focus:border-primary dark:focus:border-white transition-all placeholder:text-muted-foreground/20 dark:placeholder:text-white/10 text-foreground"
                                placeholder="••••"
                                autoFocus
                                required
                            />

                            {error && <div className="text-red-500 dark:text-red-400 text-xs text-center bg-red-100 dark:bg-red-900/20 p-2 rounded-lg">{error}</div>}

                            <button
                                disabled={isLoading}
                                className="w-full bg-foreground text-background dark:bg-white dark:text-black font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
                            </button>

                            <button type="button" onClick={() => setStep(1)} className="w-full text-muted-foreground text-xs hover:text-foreground dark:hover:text-white transition-colors">
                                Use a different email
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
