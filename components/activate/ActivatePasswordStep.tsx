"use client";

import { useState } from "react";
import { Loader2, Lock, ArrowRight, AlertCircle, Check, Eye, EyeOff } from "lucide-react";

interface ActivatePasswordStepProps {
    password: string;
    setPassword: (password: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    error: string | null;
}

export function ActivatePasswordStep({ password, setPassword, onSubmit, isLoading, error }: ActivatePasswordStepProps) {
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

        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Lock className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter ">
                    Secure Your Account
                </h2>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-12 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                            placeholder="Create a password"
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
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                            placeholder="Confirm password"
                        />
                    </div>
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Complete Activation <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}
