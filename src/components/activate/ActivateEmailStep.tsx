"use client";

import { useState } from "react";
import { Loader2, Mail, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { checkUserStatus } from "@/app/actions";
import { useTheme } from "next-themes";
import { supabase } from "@/utils/supabase/client";

interface ActivateEmailStepProps {
    email: string;
    setEmail: (email: string) => void;
    onNext: (status: any) => void;
    onError: (msg: string) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    autoChecked: boolean;
}

export function ActivateEmailStep({ email, setEmail, onNext, onError, isLoading, setIsLoading, autoChecked }: ActivateEmailStepProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    const { theme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        setIsLoading(true);

        if (!email.includes("@") || email.length < 5) {
            setLocalError("Please enter a valid email address.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Check Status via Server Action
            const status = await checkUserStatus(email);

            if (status.rosterStatus === 'error') {
                setLocalError(status.error || "Connection error. Please try again.");
                return;
            }

            // 2. Pass result to parent controller
            onNext(status);
        } catch (err: any) {
            console.error("Email Step Error:", err);
            setLocalError(err.message || "Connection error. Please try again.");
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8 flex justify-center">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter flex items-center gap-1.5 md:gap-2">
                    <img 
                        src="/flower-logo.png?v=5" 
                        alt="CIC Logo" 
                        width={34} 
                        height={34} 
                        draggable={false}
                        className="object-contain pointer-events-none select-none opacity-90 transition-all duration-300"
                        style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                    />
                    Goalie Card
                </h1>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="email"
                        autoFocus
                        required
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setLocalError(null);
                        }}
                        className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                        placeholder="goalie@example.com"
                    />
                </div>
            </div>

            {localError && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} /> {localError}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
            </button>
        </form>
    );
}
