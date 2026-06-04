"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { InstitutionalSpinner } from "@/components/ui/Loaders";
import { Loader2, Mail, ArrowRight, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkUserStatus } from "@/app/actions";
import { GoalieHeader } from "@/components/goalie/GoalieHeader";
import { BrandLogo } from "@/components/ui/BrandLogo";

function LoginController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // UI State
    const [step, setStep] = useState<'email' | 'continue-as' | 'password' | 'reset-sent'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [email, setEmail] = useState(searchParams.get('email') || "");
    const [password, setPassword] = useState("");
    const [userStatus, setUserStatus] = useState<any>(null);

    // If query email parameter changes, update state
    useEffect(() => {
        const urlEmail = searchParams.get('email');
        if (urlEmail) {
            setEmail(urlEmail);
        }
    }, [searchParams]);

    // Initial Session Check
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace('/dashboard');
            }
        };
        checkSession();
    }, [router]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const status = await checkUserStatus(email);
            if (status.exists) {
                setUserStatus(status);
                setStep('continue-as');
            } else if (status.rosterStatus === 'found') {
                router.push(`/activate?email=${encodeURIComponent(email)}`);
                return;
            } else {
                router.push(`/activate?email=${encodeURIComponent(email)}`);
            }
        } catch (err: any) {
            setError("Unable to verify email. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            if (data.user) {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError("Invalid password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return;
        setIsLoading(true);
        setError(null);

        try {
            const redirectUrl = new URL('/auth/callback', window.location.origin);
            redirectUrl.searchParams.set('next', '/update-password');
            redirectUrl.searchParams.set('type', 'recovery');

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl.toString(),
            });

            if (error) throw error;
            setStep('reset-sent');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    if (step === 'continue-as') {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="w-full max-w-lg relative z-10 text-left">
                    <BrandLogo className="mb-8" />
                    <div className="bg-card/20 backdrop-blur-2xl border border-border/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center">
                        <h2 className="text-2xl font-semibold mb-6">Welcome Back</h2>
                        <button
                            onClick={() => setStep('password')}
                            className="w-full py-5 text-md font-bold uppercase tracking-widest rounded-2xl shadow-xl bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800 hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 mb-4"
                        >
                            Continue as {userStatus?.profile?.goalie_name || 'Athlete'}
                        </button>
                        <button
                            onClick={() => {
                                setStep('email');
                                setUserStatus(null);
                                setEmail("");
                            }}
                            className="text-xs text-zinc-400 font-bold uppercase tracking-widest hover:text-white transition-colors mx-auto block"
                        >
                            Not you? Log in as someone else
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Minimalist Background (Private Training Style) */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-slate-500/30 to-primary/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="mb-8 flex flex-col items-start">
                    <BrandLogo className="mb-2" />
                </div>

                <div className="bg-card/20 backdrop-blur-2xl border border-border/40 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    
                    {step === 'password' && (
                        <button
                            onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                            className="absolute top-6 left-6 p-2 rounded-full bg-secondary/20 border border-border/30 hover:bg-secondary/40 text-muted-foreground transition-all z-20 group"
                        >
                            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'email' ? (
                            <motion.div
                                key="email-step"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Enter your email</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        Enter your email to sign in or create an account.
                                    </p>
                                </div>

                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-secondary/40 border border-border/60 rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                                                placeholder="name@email.com"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl animate-pulse font-bold">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-5 text-md font-bold uppercase tracking-widest rounded-2xl shadow-xl bg-white text-black hover:scale-[1.02] transition-transform active:scale-95 group flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <motion.div 
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="w-5 h-5 bg-black rounded-full" 
                                            />
                                        ) : (
                                            <>
                                                Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : step === 'password' ? (
                            <motion.div
                                key="password-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2 text-center pt-4">
                                    <h2 className="text-2xl font-semibold tracking-tight text-white">Security Key</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        Enter your password to unlock the dashboard.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-black text-lg">
                                        {email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-black truncate text-xs uppercase tracking-tight text-white">{userStatus?.profile?.goalie_name || 'Athlete'}</p>
                                        <p className="text-[10px] text-white/30 truncate">{email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[9px] text-white/40 font-black uppercase tracking-widest hover:text-white px-2 py-1 bg-white/10 rounded-full"
                                    >
                                        Reset
                                    </button>
                                </div>

                                <form onSubmit={handleLoginSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-secondary/40 border border-border/60 rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl animate-pulse font-bold">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-5 text-md font-bold uppercase tracking-widest rounded-2xl shadow-xl bg-white text-black hover:scale-[1.02] transition-transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <motion.div 
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="w-5 h-5 bg-black rounded-full" 
                                            />
                                        ) : "Access Dashboard"}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="reset-sent"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-20 h-20 bg-[#006747]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#006747]/20">
                                    <CheckCircle2 size={32} className="text-[#006747]" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tighter mb-3">Transmission Sent</h2>
                                <p className="text-white/40 text-xs mb-8 leading-relaxed max-w-[240px] mx-auto uppercase font-bold tracking-tight">
                                    Security recovery protocols initiated for <span className="text-white">{email}</span>. Check your inbox.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                                    className="w-full bg-white/[0.05] hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all border border-white/5"
                                >
                                    Log In
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><InstitutionalSpinner size={40} /></div>}>
            <LoginController />
        </Suspense>
    );
}
