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
    currentStep?: number;
    totalSteps?: number;
}

const Pause = (props: any) => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
);

const Play = (props: any) => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
);

const SkipForward = (props: any) => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
);

export function ActiveDrillTimer({ drillName, duration, onExit, onNext, isLastPhase, currentStep = 1, totalSteps = 3 }: ActiveDrillTimerProps) {
    // Parse duration: e.g. "15 mins" or "5 mins"
    const parseSeconds = (dur: string) => {
        const matches = dur.match(/\d+/);
        const mins = matches ? parseInt(matches[0]) : 5;
        const totalSecs = mins * 60;
        // Apply 10 minute cap (600s)
        return Math.min(totalSecs, 600);
    };

    const totalSeconds = parseSeconds(duration);
    const [timer, setTimer] = useState(0); // Elapsed time
    const [timerActive, setTimerActive] = useState(true);

    useEffect(() => {
        let interval: any;
        if (timerActive && timer < totalSeconds) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else if (timer >= totalSeconds) {
            setTimerActive(false);
            // AUTO-ADVANCE: Trigger next phase immediately on completion
            if (onNext) onNext();
        }
        return () => clearInterval(interval);
    }, [timerActive, timer, totalSeconds, onNext]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-[110] bg-background text-foreground flex flex-col items-center justify-center p-8 sm:p-24 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-hidden"
        >
            {/* HUD Metadata Display (Top Right) */}
            <div className="absolute top-[calc(env(safe-area-inset-top)+2rem)] right-8 md:top-20 md:right-20 text-right space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[.4em] text-muted-foreground/40 block">Phase Protocol</span>
                <div className="flex items-center justify-end gap-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>{drillName}</span>
                    <div className="w-[1px] h-3 bg-border" />
                    <span className="text-foreground">{currentStep} / {totalSteps}</span>
                </div>
            </div>

            {/* Header / Content Area - Phase Specific Visual (NO TEXT) */}
            <div className="flex-1 flex items-center justify-center w-full">
                <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
                    {drillName.toLowerCase().includes('box') ? (
                        <svg className="w-64 h-64 md:w-80 md:h-80 -rotate-90 overflow-visible" viewBox="0 0 100 100">
                            <rect x="5" y="5" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.05" />
                            <motion.rect
                                x="5" y="5" width="90" height="90"
                                fill="none" stroke="currentColor" strokeWidth="2"
                                strokeDasharray="360"
                                animate={timerActive ? { strokeDashoffset: [360, 0] } : {}}
                                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                                style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                            />
                        </svg>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.div 
                                animate={timerActive ? { scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] } : { opacity: 0.1 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-foreground/[0.05] border border-foreground/40"
                            />
                            <motion.div 
                                animate={timerActive ? { scale: [1, 2.2, 1], opacity: [0.2, 0, 0.2] } : { opacity: 0 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-foreground/10"
                            />
                            <div className="absolute w-3 h-3 bg-foreground rounded-full shadow-[0_0_20px_var(--foreground)]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Anchored Progress Bar & Controls (Media Player Style) */}
            <div className="w-full max-w-5xl space-y-12 pb-12">
                
                {/* 1. Time Display: Elapsed / Total */}
                <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[.4em]">Time Elapsed</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tabular-nums">{formatTime(timer)}</span>
                            <span className="text-muted-foreground/20 text-xl font-medium">/ {formatTime(totalSeconds)}</span>
                        </div>
                    </div>
                    
                    {/* Minimal Secondary Controls */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setTimerActive(!timerActive)}
                            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-all group [-webkit-tap-highlight-color:transparent]"
                        >
                            {timerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <button 
                            onClick={onNext}
                            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-foreground hover:text-background transition-all [-webkit-tap-highlight-color:transparent]"
                        >
                            <SkipForward size={18} fill="currentColor" />
                        </button>
                    </div>
                </div>

                {/* 2. Progress Bar */}
                <div className="relative h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <motion.div 
                        initial={false}
                        animate={{ width: `${(timer / totalSeconds) * 100}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                        className="absolute inset-y-0 left-0 bg-foreground"
                    />
                </div>
                
                {/* 3. Footer Stats (Instrumental Style) */}
                <div className="flex justify-between items-center text-muted-foreground/40">
                    <div className="flex gap-12">
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-bold uppercase tracking-[.3em]">Phase Progress</span>
                            <span className="text-[10px] font-black">{Math.round((timer / totalSeconds) * 100)}% COMPLETE</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-bold uppercase tracking-[.3em]">Status</span>
                            <span className="text-[10px] font-black text-foreground">{timerActive ? 'STREAMING' : 'PAUSED'}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onExit}
                        className="text-[9px] font-bold uppercase tracking-[.4em] hover:text-foreground transition-colors"
                    >
                        Exit Protocol
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
