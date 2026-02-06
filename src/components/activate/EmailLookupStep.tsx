import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmailLookupStepProps {
    onEmailSubmit: (email: string) => Promise<void>;
    onCreateNew: (email: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    showCreateOption: boolean;
}

export function EmailLookupStep({ onEmailSubmit, onCreateNew, isLoading, error, showCreateOption }: EmailLookupStepProps) {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onEmailSubmit(email);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">
                    ACTIVATE <span className="text-primary">PROFILE</span>
                </h1>
                <p className="text-muted-foreground text-sm">Enter your email to locate your roster spot.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-lg"
                    placeholder="goalie@example.com"
                />
            </div>

            {error && (
                <div className="space-y-3">
                    <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>

                    {showCreateOption && (
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            onClick={() => onCreateNew(email)}
                            className="w-full bg-foreground hover:bg-foreground/90 text-background border border-white/10"
                        >
                            Create New Card
                        </Button>
                    )}
                </div>
            )}

            {!showCreateOption && (
                <Button type="submit" variant="primary" size="lg" disabled={isLoading} className="w-full bg-foreground hover:bg-foreground/90 text-background">
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ChevronRight size={18} /></>}
                </Button>
            )}

            <div className="text-center mt-4">
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Already activated? Login here
                </Link>
            </div>
        </form>
    );
}
