"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Activity, ChevronRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ActiveDrillTimerProps {
    drillName: string;
    duration: string;
    onExit: () => void;
    onNext?: () => void;
    isLastPhase?: boolean;
}

export function ActiveDrillTimer({ drillName, duration, onExit, onNext, isLastPhase }: ActiveDrillTimerProps) {
    // Parse duration: e.g. "15 mins" or "5 mins"
    const parseSeconds = (dur: string) => {
        const matches = dur.match(/\d+/);
        const mins = matches ? parseInt(matches[0]) : 5;
        const totalSecs = mins * 60;
        // Apply 10 minute cap (600s)
        return Math.min(totalSecs, 600);
    };

    const [timer, setTimer] = useState(parseSeconds(duration));
    const [timerActive, setTimerActive] = useState(true);
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        let interval: any;
        if (timerActive && timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timer === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timer]);

    const motivations = [
        "Find your edge.", "Breathe through the fatigue.", "Eyes on the ball.", "Precision over power.",
        "Repetition is the mother of skill.", "Trust your instincts.", "Control the crease.", "Lock in your focus.",
        "Every second counts.", "Stay tall in the frame.", "Active hands, quiet mind.", "Small adjustments, big results.",
        "Visualize the save.", "Chase the standard.", "The grind pays dividends.", "Stay in the moment.",
        "Focus on the process.", "Own your depth.", "Track it into the pocket.", "Resilience is built here.",
        "Don't guess, react.", "Solidify your stance.", "Master the metrics.", "Push through the burn.",
        "Elite goalies find a way.", "One more rep.", "Track the release point.", "Quiet the noise.",
        "You are the wall.", "Settle the nerves.", "Reaction speed activation.", "Stay low, stay ready.",
        "Attack the angle.", "Seal the posts.", "Hand-eye synchronization.", "Recover instantly."
    ];

    useEffect(() => {
        if (timerActive) {
            const interval = setInterval(() => {
                setMsgIndex(prev => (prev + 1) % motivations.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [timerActive, motivations.length]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative overflow-hidden rounded-3xl bg-background border border-emerald-500/30 p-1 shadow-2xl"
        >
            <div className="relative bg-background rounded-[24px] p-8 flex flex-col items-center justify-center text-center min-h-[380px]">
                <div className="absolute top-4 right-4">
                    <Button variant="ghost" onClick={onExit} className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase p-0 h-auto hover:bg-transparent transition-all">Exit</Button>
                </div>

                <div className="mb-6">
                    <Activity className={`w-12 h-12 text-emerald-500 mx-auto ${timerActive ? 'animate-pulse opacity-50' : 'opacity-100'}`} />
                </div>

                <h2 className="text-6xl font-black text-foreground font-mono tracking-widest mb-4">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </h2>

                <p className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] mb-8">
                    {timerActive ? "Focus Active" : "Phase Complete"}
                </p>

                <div className="h-28 flex flex-col items-center justify-center gap-4">
                    {!timerActive ? (
                        <Button
                            onClick={onNext}
                            className="px-8 py-4 bg-foreground text-background font-black rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-foreground/5 mr-0"
                        >
                            {isLastPhase ? (
                                <><CheckCircle size={18} /> Finish & Reflect</>
                            ) : (
                                <><ChevronRight size={18} /> Next Phase</>
                            )}
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2 items-center">
                            {/* Simple timer footer area - empty as requested */}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
