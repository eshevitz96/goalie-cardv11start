import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Activity, ChevronRight } from "lucide-react";

interface LiveModeViewProps {
    onExit: (() => void) | undefined;
    onComplete: (() => void) | undefined;
}

export function LiveModeView({ onExit, onComplete }: LiveModeViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative overflow-hidden rounded-3xl bg-background border border-border p-1 shadow-2xl"
        >
            {/* Red Pulse Background */}
            <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />

            <div className="relative bg-background rounded-[24px] p-8 border border-red-500/20 shadow-2xl overflow-hidden flex flex-col items-center text-center justify-center min-h-[300px]">

                {/* Live Badge */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Live In-Game</span>
                </div>

                <Activity className="w-12 h-12 text-red-500 mb-6 animate-pulse" />

                <h2 className="text-5xl md:text-6xl font-black text-foreground leading-none tracking-tighter mb-4">
                    RESET.
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground/50 leading-none tracking-tight">
                    STAY IN IT.
                </h2>

                <div className="mt-8 flex gap-4">
                    <div className="px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold text-foreground uppercase tracking-wider backdrop-blur-md">
                        Breathe
                    </div>
                    <div className="px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold text-foreground uppercase tracking-wider backdrop-blur-md">
                        Focus
                    </div>
                    <div className="px-4 py-2 rounded-full bg-secondary border border-border text-xs font-bold text-foreground uppercase tracking-wider backdrop-blur-md">
                        Next Save
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <Button variant="ghost" onClick={onExit} className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-auto">
                        Exit Live Mode
                    </Button>
                    <Button onClick={onComplete} className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 h-auto">
                        End Game & Journal <ChevronRight size={14} />
                    </Button>
                </div>

            </div>
        </motion.div>
    );
}
