"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { motion } from "framer-motion";

function UpdatePasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenHash = searchParams.get("token_hash");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Calculate password strength
    const getPasswordStrength = (pw: string) => {
        if (!pw) return { score: 0, label: "", color: "" };
        if (pw.length < 8) return { score: 1, label: "Too Short (Min 8 characters)", color: "bg-red-500 w-1/3" };
        
        let strength = 2; // Starts at Weak (>= 8 chars)
        const hasNumber = /\d/.test(pw);
        const hasUpperOrSpecial = /[A-Z]/.test(pw) || /[!@#$%^&*(),.?":{}|<>]/.test(pw);

        if (hasNumber) strength += 1;
        if (hasUpperOrSpecial) strength += 1;

        if (strength === 2) {
            return { score: 2, label: "Weak Password", color: "bg-orange-500 w-1/3" };
        } else if (strength === 3) {
            return { score: 3, label: "Medium Password", color: "bg-yellow-500 w-2/3" };
        } else {
            return { score: 4, label: "Strong Password", color: "bg-emerald-500 w-full" };
        }
    };

    const strength = getPasswordStrength(password);

    useEffect(() => {
        const handleVerification = async () => {
            if (tokenHash) {
                console.log("[Update Password] Found token_hash, verifying...");
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'recovery'
                });

                if (verifyError) {
                    console.error("[Update Password] verifyOtp error:", verifyError.message);
                    setError(verifyError.message || "Invalid or expired reset token.");
                    setCheckingSession(false);
                    return;
                }

                console.log("[Update Password] verifyOtp succeeded, session established.");
                // Verify session
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log("[Update Password] Verification Session App Metadata AMR:", JSON.stringify(session.user.app_metadata?.amr));
                }

                // ONLY after verification succeeds: clear URL search parameters to avoid re-verification on page refresh
                router.replace('/update-password');
                setCheckingSession(false);
            } else {
                // Supabase exchanges the hash token asynchronously.
                // We must wait for the PASSWORD_RECOVERY event — not call getSession() immediately.
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log(`[Update Password] onAuthStateChange event: ${event}, session present: ${!!session}`);
                    if (session?.user) {
                        console.log("[Update Password] App Metadata AMR:", JSON.stringify(session.user.app_metadata?.amr));
                    }
                    if (event === 'PASSWORD_RECOVERY') {
                        // Token exchanged — user is now in recovery session, show the form
                        setCheckingSession(false);
                    } else if (event === 'SIGNED_IN' && session) {
                        // Already signed in (e.g. came from a valid link click)
                        setCheckingSession(false);
                    } else if (!session && event !== 'INITIAL_SESSION') {
                        setError("No active reset session. Please request a new password reset link.");
                        setCheckingSession(false);
                    }
                });

                // Fallback: if no event fires within 3s (e.g. token already exchanged), check session directly
                const timeout = setTimeout(async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        if (session.user) {
                            console.log("[Update Password Fallback] App Metadata AMR:", JSON.stringify(session.user.app_metadata?.amr));
                        }
                        setCheckingSession(false);
                    } else {
                        setError("Reset link expired or already used. Please request a new one.");
                        setCheckingSession(false);
                    }
                }, 3000);

                return () => {
                    subscription.unsubscribe();
                    clearTimeout(timeout);
                };
            }
        };

        handleVerification();
    }, [tokenHash, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;
            
            // Refresh session to clear recovery AMR claim
            console.log("[Update Password] Password updated successfully. Refreshing session...");
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                console.error("[Update Password] Session refresh failed:", refreshError.message);
            } else if (refreshedSession?.user) {
                console.log("[Update Password] Refreshed App Metadata AMR:", JSON.stringify(refreshedSession.user.app_metadata?.amr));
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-purple-500/50 to-rose-600/50" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <BrandLogo />
                    </div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-foreground mb-2">
                        UPDATE <span className="text-primary">PASSWORD</span>
                    </h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {checkingSession ? (
                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-sm font-medium">Verifying your reset link...</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">This will just take a moment</p>
                        </div>
                    ) : success ? (
                        <div className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={24} />
                            </div>
                            <h2 className="font-bold text-lg">Password Updated!</h2>
                            <p className="text-sm text-muted-foreground">Your password has been changed successfully. Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl pl-12 pr-12 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30 text-lg"
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {password && (
                                    <div className="mt-2 space-y-1 px-1">
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-350 ${strength.color}`} />
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                            strength.score === 1 ? "text-red-500" :
                                            strength.score === 2 ? "text-orange-500" :
                                            strength.score === 3 ? "text-yellow-500" :
                                            "text-emerald-500"
                                        }`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-secondary border border-border rounded-xl pl-12 pr-12 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/30 text-lg"
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        Update Password
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            {error?.includes("reset session") && (
                                <button
                                    type="button"
                                    onClick={() => router.push('/login')}
                                    className="w-full bg-secondary hover:bg-muted text-foreground font-bold py-4 rounded-xl transition-all border border-border mt-4"
                                >
                                    Back to Login
                                </button>
                            )}
                        </form>
                    )}
                </motion.div>
            </div>
        </main>
    );
}

export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        }>
            <UpdatePasswordForm />
        </Suspense>
    );
}
