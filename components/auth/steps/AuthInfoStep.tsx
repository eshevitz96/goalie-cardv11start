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
                <h2 className="text-xl font-bold text-foreground">Final Details</h2>
                <p className="text-muted-foreground text-xs">Verify your roster info</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Goalie Name</label>
                    <input
                        value={formData.goalieName}
                        onChange={e => setFormData({ ...formData, goalieName: e.target.value })}
                        placeholder="Goalie Name"
                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Parent Name</label>
                    <input
                        value={formData.parentName}
                        onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                        placeholder="Parent Name"
                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Current Team</label>
                    <input
                        value={formData.team}
                        onChange={e => setFormData({ ...formData, team: e.target.value })}
                        placeholder="Current Team"
                        className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
            </div>

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
