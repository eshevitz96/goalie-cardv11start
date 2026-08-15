"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { InstitutionalSpinner } from "@/components/ui/Loaders";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendMagicLink } from "@/app/auth/actions";
import { BrandLogo } from "@/components/ui/BrandLogo";

function LoginController() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // UI State
    const [step, setStep] = useState<'email' | 'link-sent'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [email, setEmail] = useState(searchParams.get('email') || "");

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
            // Bypass auth completely in local dev if flag is set
            if (process.env.NEXT_PUBLIC_DEV_BYPASS === "true") {
                router.push("/dashboard");
                return;
            }

            // Send secure magic link for verification and sign in
            const res = await sendMagicLink(email);
            if (res.success) {
                setStep('link-sent');
            } else {
                setError(res.error || "Failed to send login email. Please try again.");
            }
        } catch (err: any) {
            setError("Unable to verify email. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Classy Top Accent line (Elite Green) */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 transition-all duration-500">
                <div className="mb-8 flex flex-col items-start px-2">
                    <BrandLogo className="mb-2" />
                </div>

                <div className="bg-card/85 backdrop-blur-2xl border border-border/80 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(15,41,66,0.05)] relative overflow-hidden">
                    
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
                                    <h2 className="text-3xl font-bold font-sans tracking-tight text-foreground">Secure Sign In</h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                                        Enter your email to receive a secure access link in your inbox.
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
                                                className="w-full bg-secondary/40 border border-border/60 rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 font-bold"
                                                placeholder="name@email.com"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-600 bg-red-500/5 border border-red-500/10 text-xs flex items-center justify-center gap-2 p-3 rounded-xl font-bold">
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-5 text-md font-bold uppercase tracking-widest rounded-2xl shadow-xl bg-primary text-white hover:scale-[1.02] transition-transform active:scale-95 group flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin text-white" size={20} />
                                        ) : (
                                            <>
                                                Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="link-sent"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                                    <CheckCircle2 size={32} className="text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground tracking-tighter mb-3">Transmission Sent</h2>
                                <p className="text-muted-foreground text-xs mb-8 leading-relaxed max-w-[280px] mx-auto uppercase font-bold tracking-tight">
                                    Security recovery protocols initiated for <span className="text-foreground">{email}</span>. Check your inbox.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError(null); }}
                                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-black uppercase tracking-widest py-4 rounded-2xl transition-all border border-border"
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
