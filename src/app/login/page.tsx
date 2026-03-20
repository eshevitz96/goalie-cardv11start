"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { motion, AnimatePresence } from "framer-motion";
import { checkUserStatus } from "@/app/actions";
import { useTheme } from "next-themes";

export default function LoginPage() {
    const router = useRouter();
    const { theme } = useTheme();

    // UI State
    const [step, setStep] = useState<'email' | 'password' | 'reset-sent'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userStatus, setUserStatus] = useState<any>(null);

    // Initial Session Check
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'admin') router.replace('/admin');
                else router.replace('/dashboard');
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
            // Check status
            const status = await checkUserStatus(email);
            // console.log("User Status:", status);

            if (status.exists) {
                // User exists -> Show Password
                setUserStatus(status);
                setStep('password');
            } else if (status.rosterStatus === 'found') {
                // Roster found but no user -> Redirect to Activate
                router.push(`/activate?email=${encodeURIComponent(email)}`);
                return;
            } else {
                // Unknown User -> For now, maybe just show password (they might try to login and fail)
                // OR we could redirect to a "Not Found" state. 
                // Let's conform to standard security practices: don't reveal too much, 
                // BUT for this specific UX request, we want to guide them.
                // If specific request is "Welcome Page -> Password OR New Account", 
                // let's show password field but maybe with a hint?
                // Actually, if they don't exist, they can't login. 
                // Let's redirect to Activate to let them try to find themselves or Contact Support.
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

            // Redirect based on role
            if (data.user) {
                const role = userStatus?.profile?.role || 'goalie'; // Fallback if status lost
                if (role === 'admin') router.push('/admin');
                else router.push('/dashboard');
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

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 flex justify-center">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground flex items-center gap-2 md:gap-3">
                        <img 
                            src="/flower-logo.png?v=5" 
                            alt="CIC Logo" 
                            width={42} 
                            height={42} 
                            draggable={false}
                            className="object-contain pointer-events-none select-none opacity-90 transition-all duration-300"
                            style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                        />
                        Goalie Card
                    </h1>
                </div>

                <AnimatePresence mode="wait">
                    <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <form onSubmit={step === 'email' ? handleEmailSubmit : handleLoginSubmit} className="space-y-6 relative z-10">
                            <AnimatePresence mode="wait">
                                {step === 'email' ? (
                                    <motion.div
                                        key="email-step"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    autoComplete="username email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-secondary border border-border rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 text-lg"
                                                    placeholder="name@example.com"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-500 bg-red-500/10 border border-red-500/20 text-sm flex items-center gap-2 p-4 rounded-xl"
                                            >
                                                <AlertCircle size={16} /> {error}
                                            </motion.div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 group"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                                <>
                                                    Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : step === 'password' ? (
                                    <motion.div
                                        key="password-step"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Hidden Email for Password Managers */}
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete="username email"
                                            value={email}
                                            readOnly
                                            className="sr-only"
                                            tabIndex={-1}
                                        />

                                        <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-2xl border border-border/50 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold truncate text-sm">{userStatus?.profile?.goalie_name || 'Welcome Back'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                                                className="text-xs text-primary font-bold hover:underline px-2"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label htmlFor="password" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                                                <button
                                                    type="button"
                                                    onClick={handleForgotPassword}
                                                    disabled={isLoading}
                                                    className="text-[10px] font-black uppercase tracking-tighter text-primary hover:text-primary/80 disabled:opacity-50"
                                                >
                                                    Forgot?
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-secondary border border-border rounded-2xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50 text-lg"
                                                    placeholder="••••••••"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-500 bg-red-500/10 border border-red-500/20 text-sm flex items-center gap-2 p-4 rounded-xl"
                                            >
                                                <AlertCircle size={16} /> {error}
                                            </motion.div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 group"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" /> : (
                                                <>
                                                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="reset-step"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center flex flex-col items-center"
                                    >
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                                            <CheckCircle2 size={40} className="text-primary" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter font-black mb-3">Check Your Inbox</h2>
                                        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                                            We've sent a secure password reset link to <br /><span className="font-bold text-foreground">{email}</span>. Click the link to securely choose a new password.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => { setStep('email'); setPassword(''); setError(null); }}
                                            className="w-full bg-secondary hover:bg-muted text-foreground font-bold py-4 rounded-2xl transition-all border border-border"
                                        >
                                            Back to Login
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </AnimatePresence>
            </div>
        </main>
    );
}
