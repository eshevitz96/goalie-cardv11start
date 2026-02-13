"use client";

import { useState } from "react";
import { Loader2, PlusCircle, Search, HelpCircle } from "lucide-react";

interface ActivateLookupResultProps {
    email: string;
    onRetry: () => void;
    onCreateNew: () => void;
}

export function ActivateLookupResult({ email, onRetry, onCreateNew }: ActivateLookupResultProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = () => {
        setIsLoading(true);
        // Simulate setup
        setTimeout(() => {
            onCreateNew();
        }, 800);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                    <HelpCircle size={32} className="text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">No Card Found</h1>
                <p className="text-muted-foreground text-sm">
                    We couldn't find a roster spot for <br /> <span className="font-bold text-foreground">{email}</span>.
                </p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><PlusCircle size={18} /> Create New Card</>}
                </button>

                <button
                    onClick={onRetry}
                    className="w-full bg-card border border-border hover:bg-secondary/50 text-foreground font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Search size={18} /> Search Different Email
                </button>
            </div>

            <p className="text-xs text-center text-muted-foreground px-8">
                If you believe this is an error, please check the email address or contact your coach.
            </p>
        </div>
    );
}
