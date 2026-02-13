import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Loader2, Check } from 'lucide-react';

interface AuthOtpStepProps {
    email: string;
    onVerifyOtp: (otp: string) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
}

export function AuthOtpStep({ email, onVerifyOtp, onBack, isLoading, error }: AuthOtpStepProps) {
    const [otp, setOtp] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onVerifyOtp(otp);
    };

    return (
        <motion.form
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="text-center">
                <p className="text-zinc-400 text-sm">Check your inbox for the code</p>
                <p className="text-white font-bold">{email}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-white transition-colors shadow-2xl">
                <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-transparent border-none text-white text-3xl font-mono tracking-[0.5em] text-center p-4 focus:ring-0 placeholder:text-zinc-800"
                />
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <Button
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 h-auto"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Access System <Check size={18} /></>}
            </Button>

            <Button variant="ghost" type="button" onClick={onBack} className="w-full text-xs text-zinc-500 hover:text-white py-2 h-auto hover:bg-transparent">
                Use different email
            </Button>
        </motion.form>
    );
}
