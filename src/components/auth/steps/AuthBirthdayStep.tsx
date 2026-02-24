'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

interface AuthBirthdayStepProps {
    onSubmit: (dob: string) => Promise<void>;
}

export function AuthBirthdayStep({ onSubmit }: AuthBirthdayStepProps) {
    const [dob, setDob] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(dob);
    };

    return (
        <motion.form
            key="birthday"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Identify Yourself</h2>
                <p className="text-zinc-400 text-xs">Different ages have different portals.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date of Birth</label>
                <div className="relative">
                    <input
                        type="date"
                        required
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-lg"
                    />
                </div>
            </div>

            <Button
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 h-auto"
            >
                Continue <ArrowRight size={18} />
            </Button>
        </motion.form>
    );
}
