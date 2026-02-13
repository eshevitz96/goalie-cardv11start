"use client";

import { useState } from "react";
import { Loader2, Calendar, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";

interface ActivateIdentityStepProps {
    birthday: string;
    setBirthday: (dob: string) => void;
    onNext: () => void;
    onBack: () => void;
    storedDob?: string; // If we have it on file to verify against
}

export function ActivateIdentityStep({ birthday, setBirthday, onNext, onBack, storedDob }: ActivateIdentityStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Verify Logic
            if (storedDob) {
                // Strict check: Date string comparison (YYYY-MM-DD)
                // Normalize dates if needed, but standard HTML input returns YYYY-MM-DD
                if (birthday !== storedDob) {
                    throw new Error("Date of Birth does not match our records.");
                }
            }

            // Simulate slight delay for effect
            await new Promise(r => setTimeout(r, 600));
            onNext();

        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">
                    VERIFY <span className="text-primary">IDENTITY</span>
                </h1>
                <p className="text-muted-foreground text-sm">Enter your birthday to confirm it's you.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">Date of Birth</label>
                <input
                    type="date"
                    autoFocus
                    required
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg p-4 text-center text-xl font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {error && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="space-y-3">
                <button
                    type="submit"
                    disabled={isLoading || !birthday}
                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Verify & Find Card <ArrowRight size={18} /></>}
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
                >
                    <ArrowLeft size={14} /> Back
                </button>
            </div>
        </form>
    );
}
