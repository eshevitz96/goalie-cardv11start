import React from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowRight } from 'lucide-react';

interface TermsStepProps {
    accepted: boolean;
    setAccepted: (val: boolean) => void;
    onActivate: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function TermsStep({ accepted, setAccepted, onActivate, isLoading, error }: TermsStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">FINAL <span className="text-primary">STEP</span></h1>
                <p className="text-muted-foreground text-sm">Please accept the terms to activate your card.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 h-64 overflow-y-auto text-xs text-muted-foreground space-y-4">
                <p><strong className="text-foreground">Terms of Service</strong></p>
                <p>By determining to activate your Goalie Card, you agree to the standard terms of service regarding data usage, athlete safety, and platform conduct.</p>
                <p>1. Data Privacy: We value your data...</p>
                <p>2. Conduct: Sportsmanship is required...</p>
                {/* Minimal placeholder for now */}
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                <input
                    type="checkbox"
                    id="terms"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    I agree to the Terms of Service & Privacy Policy
                </label>
            </div>

            {error && (
                <div className="text-red-500 text-sm p-3 bg-red-500/10 rounded-lg">
                    {error}
                </div>
            )}

            <Button
                onClick={onActivate}
                disabled={!accepted || isLoading}
                className="w-full bg-primary text-black font-bold text-lg h-14 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>ACTIVATE CARD <ArrowRight /></>}
            </Button>
        </div>
    );
}
