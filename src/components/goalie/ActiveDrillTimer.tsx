import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Activity } from "lucide-react";
import { useState, useEffect } from "react";

interface ActiveDrillTimerProps {
    drillName: string;
    duration: string;
    onExit: () => void;
}

export function ActiveDrillTimer({ drillName, duration, onExit }: ActiveDrillTimerProps) {
    const [timer, setTimer] = useState(duration.includes('15') ? 900 : 300);
    const [timerActive, setTimerActive] = useState(true);

    useEffect(() => {
        let interval: any;
        if (timerActive && timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timer === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timer]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative overflow-hidden rounded-3xl bg-background border border-emerald-500/30 p-1 shadow-2xl"
        >
            <div className="relative bg-background rounded-[24px] p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="absolute top-4 right-4">
                    <Button variant="ghost" onClick={onExit} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase p-0 h-auto hover:bg-transparent">Exit</Button>
                </div>

                <div className="mb-6">
                    <Activity className="w-12 h-12 text-emerald-500 animate-pulse mx-auto opacity-50" />
                </div>

                <h2 className="text-6xl font-black text-foreground font-mono tracking-widest mb-4">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </h2>
                <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                    {timerActive ? "Focus Active" : "Session Complete"}
                </p>

                <p className="mt-8 text-foreground/50 text-sm max-w-[200px]">
                    "{drillName}"
                </p>
            </div>
        </motion.div>
    );
}
