"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

interface CreditManagerProps {
    rosterId: string;
    goalieName: string;
    currentCredits: number;
    onCreditsAdded?: () => void;
}

const QUICK_AMOUNTS = [4, 8, 12];

export function CreditManager({ rosterId, goalieName, currentCredits, onCreditsAdded }: CreditManagerProps) {
    const toast = useToast();
    const [amount, setAmount] = useState<number>(4);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddCredits = async () => {
        setIsLoading(true);
        try {
            const { addCredits } = await import("@/app/actions/credits");
            const result = await addCredits({
                rosterId,
                amount,
                description: description || `${amount} lesson credits added`,
            });

            if (!result.success) {
                toast.error("Failed: " + result.error);
            } else {
                toast.success(`✅ Added ${amount} credits to ${goalieName}`);
                setDescription("");
                onCreditsAdded?.();
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-4"
        >
            <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Add Credits — {goalieName}</span>
            </div>

            {/* Current balance */}
            <div className="flex items-baseline gap-1.5 px-1">
                <span className="text-3xl font-black text-foreground tracking-tighter">{currentCredits}</span>
                <span className="text-xs text-muted-foreground font-bold">credits remaining</span>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
                {QUICK_AMOUNTS.map((q) => (
                    <button
                        key={q}
                        onClick={() => setAmount(q)}
                        className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${amount === q
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        +{q}
                    </button>
                ))}
            </div>

            {/* Custom amount */}
            <input
                type="number"
                value={amount}
                min={1}
                max={100}
                onChange={(e) => setAmount(parseInt(e.target.value) || 1)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Custom amount"
            />

            {/* Optional description */}
            <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                placeholder={`e.g. March 2026 payment`}
            />

            <Button
                onClick={handleAddCredits}
                disabled={isLoading || amount < 1}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl py-2.5 flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add {amount} Credits
            </Button>
        </motion.div>
    );
}
