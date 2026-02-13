import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface AuthTermsStepProps {
    onConfirm: () => void;
    error: string | null;
}

export function AuthTermsStep({ onConfirm, error }: AuthTermsStepProps) {
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleSubmit = () => {
        if (termsAccepted) {
            onConfirm();
        }
    };

    return (
        <motion.div
            key="terms"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-xs text-zinc-400 h-48 overflow-y-auto leading-relaxed">
                <p className="font-bold text-white mb-2">Terms of Service</p>
                <p className="mb-2">By accessing GoalieGuard, you agree to our standard liability waiver and data privacy policies. We use AI to analyze performance.</p>
                <p>You agree to play nice.</p>
            </div>

            <div
                onClick={() => setTermsAccepted(!termsAccepted)}
                className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
            >
                <div className={clsx("w-6 h-6 rounded-md border flex items-center justify-center transition-all", termsAccepted ? "bg-white border-white text-black" : "border-zinc-700 bg-black")}>
                    {termsAccepted && <Check size={14} />}
                </div>
                <div className="font-bold text-sm text-white">I Accept</div>
            </div>

            {error && <div className="text-red-500 text-xs text-center">{error}</div>}

            <Button
                onClick={handleSubmit}
                className={clsx(
                    "w-full py-6 font-bold rounded-xl transition-all flex items-center justify-center gap-2 h-auto",
                    termsAccepted ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
            >
                Confirm
            </Button>
        </motion.div>
    );
}
