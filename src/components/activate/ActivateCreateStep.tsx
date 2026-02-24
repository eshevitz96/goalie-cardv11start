"use client";

import { useState } from "react";
import { Loader2, UserPlus, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { createInitialProfile } from "@/app/activate/actions";

interface ActivateCreateStepProps {
    email: string;
    onSuccess: (rosterData: any) => void;
    onBack: () => void;
}

export function ActivateCreateStep({ email, onSuccess, onBack }: ActivateCreateStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await createInitialProfile(email);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Success
            onSuccess(result.data);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <UserPlus size={32} className="text-primary" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">Create Profile</h1>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    You are about to create a new Goalie Card for <br /><span className="font-bold text-foreground">{email}</span>
                </p>
            </div>

            {error && (
                <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="space-y-3">
                <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Confirm & Create <ArrowRight size={18} /></>}
                </button>

                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
                >
                    <ArrowLeft size={14} /> Cancel
                </button>
            </div>
        </div>
    );
}
