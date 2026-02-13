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

            <div className="bg-white rounded-2xl p-1 shadow-2xl">
                <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-4 pt-3 pb-0">Date of Birth</label>
                <input
                    type="date"
                    required
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full bg-white text-black text-lg p-4 rounded-xl focus:outline-none placeholder:text-zinc-300 font-bold text-center"
                />
            </div>

            <Button
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 h-auto"
            >
                Continue <ArrowRight size={18} />
            </Button>
        </motion.form>
    );
}
