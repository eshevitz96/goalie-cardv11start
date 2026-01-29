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
                localStorage.setItem('user_role', 'goalie'); // Default, will refine
            }

            // Determine Redirect Destination
            let destination = '/parent';
            if (userRecord.raw_data?.setup_complete) {
                // Eventually logic for Goalie vs Parent
                destination = '/parent'; // Safety default
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
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-sm space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
                                <User size={40} className="text-white/80" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                            <p className="text-white/40 text-sm">Enter your email to continue.</p>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-lg placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-all focus:bg-white/10"
                                placeholder="name@example.com"
                                autoFocus
                                required
                            />
                            {error && <div className="text-red-400 text-xs text-center">{error}</div>}
                            <button
                                disabled={isLoading}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
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
                            <div className="w-20 h-20 bg-white/5 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl">
                                <Lock size={40} className="text-white/80" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Enter PIN</h1>
                            <p className="text-white/40 text-sm">Hello, <span className="text-white">{email}</span></p>
                        </div>

                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-white/20 p-4 text-center text-5xl font-mono tracking-[0.5em] focus:outline-none focus:border-white transition-all placeholder:text-white/10"
                                placeholder="••••"
                                autoFocus
                                required
                            />

                            {error && <div className="text-red-400 text-xs text-center bg-red-900/20 p-2 rounded-lg">{error}</div>}

                            <button
                                disabled={isLoading}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
                            </button>

                            <button type="button" onClick={() => setStep(1)} className="w-full text-white/30 text-xs hover:text-white transition-colors">
                                Use a different email
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
