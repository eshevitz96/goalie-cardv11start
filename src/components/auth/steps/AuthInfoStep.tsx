import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface AuthInfoStepProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: () => Promise<void>;
    isLoading: boolean;
}

export function AuthInfoStep({ formData, setFormData, onSubmit, isLoading }: AuthInfoStepProps) {
    return (
        <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
        >
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Final Details</h2>
                <p className="text-zinc-400 text-xs">Verify your roster info</p>
            </div>

            <input value={formData.goalieName} onChange={e => setFormData({ ...formData, goalieName: e.target.value })} placeholder="Goalie Name" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />
            <input value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} placeholder="Parent Name" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />
            <input value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })} placeholder="Current Team" className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-white placeholder-zinc-500" />

            <Button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 h-auto"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : "Enter Ecosystem"}
            </Button>
        </motion.div>
    );
}
