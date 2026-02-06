import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Check, AlertCircle, Shield } from 'lucide-react';

interface OtpVerifyStepProps {
    email: string;
    onVerify: (otp: string) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
    isDemo: boolean;
}

export function OtpVerifyStep({ email, onVerify, onBack, isLoading, error, isDemo }: OtpVerifyStepProps) {
    const [otp, setOtp] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onVerify(otp);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <Shield size={32} className="text-blue-500" />
                </div>
                <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">VERIFY</h1>
                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                    Enter the 6-digit code sent to
                    <span className="block text-foreground font-bold mt-1">{email}</span>
                </p>
                {isDemo && (
                    <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-200 text-xs font-mono animate-pulse">
                        DEMO MODE: Use Code <strong>000000</strong>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 text-center block">Access Code</label>
                <input
                    type="text"
                    autoFocus
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-3xl font-mono tracking-[0.5em] text-center"
                    placeholder="000000"
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
                {isLoading ? <Loader2 className="animate-spin" /> : <>Verify Code <Check size={18} /></>}
            </Button>

            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="w-full text-muted-foreground">
                Back to ID
            </Button>
        </form>
    );
}
