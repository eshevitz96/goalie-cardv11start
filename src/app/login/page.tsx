"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight, AlertCircle, Lock } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { motion } from "framer-motion";
import { checkUserStatus } from "@/app/actions";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Basic Validation
            if (!email || !password) {
                throw new Error("Please enter both email and password.");
            }

            // 2. Perform Login
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                // If login fails, check if the user even exists or needs activation
                const status = await checkUserStatus(email);
                if (!status.exists && status.rosterStatus === 'found') {
                    // Redirect to activation if they are on the roster but not yet a user
                    router.push(`/activate?email=${encodeURIComponent(email)}`);
                    return;
                }
                throw authError;
            }

            // 3. Check Role and Redirect
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile?.role === 'admin') router.push('/admin');
                else router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setIsLoading(true);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            });
            if (resetError) throw resetError;
            setError("check_email:Password reset link sent to your email.");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
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
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <GoalieGuardLogo size={36} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">
                        GOALIE <span className="text-primary">CARD</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Sign in with your email and password.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {error && (
                        <div className={`${error.startsWith('check_email:') ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'} text-sm flex items-center gap-2 p-3 rounded-lg border`}>
                            <AlertCircle size={14} /> {error.startsWith('check_email:') ? error.replace('check_email:', '') : error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="goalie@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-black uppercase tracking-tighter text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-4">
                            <p className="text-xs text-muted-foreground font-medium">New to Goalie Card?</p>
                            <button
                                type="button"
                                onClick={() => router.push('/activate')}
                                className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 rounded-xl border border-border transition-all flex items-center justify-center gap-2"
                            >
                                Activate Your Card
                                <ArrowRight size={16} className="text-primary" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
