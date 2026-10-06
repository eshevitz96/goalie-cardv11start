'use client';

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
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-xs text-zinc-400 h-48 overflow-y-auto leading-relaxed space-y-2">
                <p className="font-bold text-white mb-2">Terms of Service & Data Consent</p>
                <p>
                    <strong className="text-zinc-200">1. Privacy & Sharing:</strong> Your data is private to you. Your coach sees film, reflections, and training only when you choose to share them. Linked parents or guardians can see their athlete&apos;s account. We use secure third-party service providers to run the app and generate training insights; they process data only to provide these services. We do not sell personal data.
                </p>
                <p>
                    <strong className="text-zinc-200">2. Automated Processing & Training Insights:</strong> To provide personalized training recommendations, workload analysis, and performance insights, your workout logs, reflections, and athletic metrics are processed using automated computational systems and secure third-party service providers. These automated suggestions do not replace qualified medical advice, physical therapy, or in-person coaching supervision.
                </p>
                <p>
                    <strong className="text-zinc-200">3. Minors & Guardian Consent:</strong> If you are under 18, a parent or guardian must complete or approve this sign-up. Parents and guardians consenting on behalf of minors acknowledge and authorize this data processing.
                </p>
                <p>
                    <strong className="text-zinc-200">4. Liability Waiver:</strong> Athletic training carries inherent physical risks. You assume all risks associated with executing any recommended exercises, drills, or training sessions.
                </p>
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
