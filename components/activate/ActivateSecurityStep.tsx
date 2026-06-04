"use client";

import { useState } from "react";
import { Loader2, Lock, ArrowRight, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface ActivateSecurityStepProps {
    password: string;
    setPassword: (password: string) => void;
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string | React.ReactNode | null;
}

export function ActivateSecurityStep({
    password,
    setPassword,
    termsAccepted,
    setTermsAccepted,
    onSubmit,
    isLoading,
    error
}: ActivateSecurityStepProps) {
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password.length < 8) {
            setLocalError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }

        if (!termsAccepted) {
            setLocalError("Please accept the terms to continue.");
            return;
        }

        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6 flex flex-col items-start gap-4">
                <BrandLogo />
                <h2 className="text-xl font-bold text-foreground/80 tracking-tight">
                    Secure Your Account
                </h2>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Create Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setLocalError(null);
                            }}
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-12 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                            placeholder="Password (min 8 chars)"
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
                                <div className={clsx("h-full transition-all duration-350", strength.color)} />
                            </div>
                            <p className={clsx("text-[10px] font-bold uppercase tracking-wider", {
                                "text-red-500": strength.score === 1,
                                "text-orange-500": strength.score === 2,
                                "text-yellow-500": strength.score === 3,
                                "text-emerald-500": strength.score === 4,
                            })}>
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
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setLocalError(null);
                            }}
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                            placeholder="Confirm password"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-secondary/30 rounded-xl p-4 border border-border text-[10px] text-muted-foreground h-40 overflow-y-auto leading-relaxed scrollbar-hide">
                    <p className="font-bold text-foreground mb-2 text-xs">Terms of Service & Privacy</p>
                    <div className="space-y-2">
                        <p>By activating your Goalie Card, you enter into a binding agreement with Goalie Card ("the Company"). You acknowledge that Goalie Card is a performance monitoring and athletic development platform.</p>

                        <p className="font-bold text-foreground/80">1. Data Usage & AI Analysis</p>
                        <p>We utilize advanced technical models and AI to analyze your training data, reflections, and performance metrics. This data is used to provide personalized feedback and insights. You grant Goalie Card a non-exclusive license to use this data for service improvement and aggregated research.</p>

                        <p className="font-bold text-foreground/80">2. Privacy & Sharing</p>
                        <p>Your data is strictly shared with assigned coaches, guardians, and organizations you are affiliated with. We do not sell your personal data to third parties. For users under 18, guardian consent is mandatory and verified through parent email linkage.</p>

                        <p className="font-bold text-foreground/80">3. Liability Waiver</p>
                        <p>Athletic training involves inherent risks. Goalie Card is a tool for development and does not replace qualified medical advice or supervised physical training. You assume all risks associated with the implementation of AI-generated suggestions.</p>

                        <p className="font-bold text-foreground/80">4. Community Guidelines</p>
                        <p>You agree to provide honest reflections and maintain professional conduct when interacting with the AI Coach and human staff. Misuse of the platform may lead to account suspension.</p>
                    </div>
                </div>

                <div
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
                >
                    <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-all", termsAccepted ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-background")}>
                        {termsAccepted && <Check size={12} />}
                    </div>
                    <div className="font-bold text-xs text-foreground">I Accept the Terms & Conditions</div>
                </div>
            </div>

            {(error || localError) && (
                <div className="text-red-500 text-sm flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> 
                    <div>{error || localError}</div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || password.length < 8}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Activate Account <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}
