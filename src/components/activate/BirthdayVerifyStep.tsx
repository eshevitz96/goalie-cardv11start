import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, ChevronRight, AlertCircle } from 'lucide-react';

interface BirthdayVerifyStepProps {
    onVerify: (birthday: string) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
}

export function BirthdayVerifyStep({ onVerify, onBack, isLoading, error }: BirthdayVerifyStepProps) {
    const [birthday, setBirthday] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onVerify(birthday);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">VERIFY <span className="text-primary">IDENTITY</span></h1>
                <p className="text-muted-foreground text-sm">Enter your birthday to confirm it's you.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Birthday</label>
                <input
                    type="date"
                    autoFocus
                    required
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-lg text-center"
                />
            </div>

            {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg"><AlertCircle size={14} /> {error}</div>}

            <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Verify & Send Code <ChevronRight size={18} /></>}
            </Button>

            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="w-full text-muted-foreground">
                Back
            </Button>
        </form>
    );
}
