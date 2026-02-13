import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { X, Zap, Check } from "lucide-react";

interface PerformanceRecommendation {
    focus: string;
    reason: string;
    drill: {
        name: string; duration: string;
        type: 'physical' | 'mental' | 'video'
    };
    videoWait: number; // minutes
}

interface DrillDetailModalProps {
    rec: PerformanceRecommendation;
    onClose: () => void;
    onComplete: () => void;
}

export function DrillDetailModal({ rec, onClose, onComplete }: DrillDetailModalProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{rec.drill.name}</h3>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 mb-6">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Protocol Steps</h4>
                    <ul className="space-y-2">
                        {(rec.drill as any).steps?.map((step: string, i: number) => (
                            <li key={i} className="flex gap-2 text-sm text-foreground">
                                <span className="text-primary font-bold">{i + 1}.</span>
                                <span>{step}</span>
                            </li>
                        )) || (
                                <li className="text-sm text-muted-foreground italic">Follow coach instructions for this drill.</li>
                            )}
                    </ul>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button onClick={onComplete}>
                        <Check size={16} className="mr-2" /> Mark Complete & Log
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
