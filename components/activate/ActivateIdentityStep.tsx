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
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">
                    Verify Identity
                </h1>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date of Birth</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="date"
                        autoFocus
                        required
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl pl-12 pr-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-lg"
                    />
                </div>
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
