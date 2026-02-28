"use client";

import { useState } from "react";
import { Loader2, Lock, ArrowRight, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

interface ActivateSecurityStepProps {
    password: string;
    setPassword: (password: string) => void;
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string | null;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters.");
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
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Lock className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                    SECURE YOUR ACCOUNT
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                    Final step to activate your Goalie Card.
                </p>
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
                            placeholder="Password (min 6 chars)"
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
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
                <div className="bg-secondary/30 rounded-xl p-3 border border-border text-[10px] text-muted-foreground h-24 overflow-y-auto leading-relaxed">
                    <p className="font-bold text-foreground mb-1">Terms of Service</p>
                    <p className="mb-1">By activating, you agree to our standard liability waiver and data privacy policies. We use AI to analyze performance and provide feedback.</p>
                    <p>Data is shared with your assigned coaches and guardians for athletic development purposes.</p>
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
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} /> {error || localError}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Activate Account <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}
