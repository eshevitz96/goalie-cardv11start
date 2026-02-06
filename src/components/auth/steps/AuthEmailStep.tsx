import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowRight } from 'lucide-react';

interface AuthEmailStepProps {
    onSendOtp: (email: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function AuthEmailStep({ onSendOtp, isLoading, error }: AuthEmailStepProps) {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSendOtp(email);
    };

    return (
        <motion.form
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <div className="bg-white rounded-2xl p-1 shadow-2xl overflow-hidden">
                <label className="block text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest px-4 pt-3 pb-0">Email Address</label>
                <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Type your email here..."
                    className="w-full bg-white text-black text-lg px-4 pb-3 pt-1 rounded-xl focus:outline-none placeholder:text-zinc-300 font-bold"
                />
            </div>

            {error && <div className="text-red-500 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

            <Button
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 h-auto"
            >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Send Verification <ArrowRight size={18} /></>}
            </Button>

            <p className="text-center text-[10px] text-zinc-600 mt-6 max-w-xs mx-auto leading-relaxed">
                We'll send a secure link to verify your identity and age requirements.
            </p>
        </motion.form>
    );
}
