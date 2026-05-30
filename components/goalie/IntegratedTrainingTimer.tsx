"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, ChevronRight, CheckCircle, RotateCcw, Check, Share, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from "@/components/ui/BrandLogo";
import { completeProtocolSession } from '@/app/actions';

interface IntegratedTrainingTimerProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        warmup?: { name: string; duration: string; steps?: string[] };
        main?: { name: string; duration: string; steps?: string[] };
        mental?: { name: string; duration: string; steps?: string[] };
    };
    onComplete: (data: { streak: number; totalTime: number; snapshot?: any }) => void;
    snapshot?: any;
    sessionId?: string;
    userId?: string;
}

const PHASE_ORDER = ['mental', 'main', 'warmup'] as const;

export function IntegratedTrainingTimer({ isOpen, onClose, plan, onComplete, snapshot, sessionId, userId }: IntegratedTrainingTimerProps) {
    const [phaseIndex, setPhaseIndex] = useState(0);
    const phaseKey = PHASE_ORDER[phaseIndex];
    
    const [isActive, setIsActive] = useState(true);
    const [showComplete, setShowComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [totalTimeTrained, setTotalTimeTrained] = useState(0);
    const [completionPage, setCompletionPage] = useState(0); // 0 or 1 for the two completion pages

    const currentDrill = plan[phaseKey];
    const durationInSeconds = useMemo(() => parseInt(currentDrill?.duration || "2") * 60, [currentDrill]);

    useEffect(() => {
        if (isOpen) {
            setTimeLeft(durationInSeconds);
            setIsActive(true);
            setPhaseIndex(0);
            setShowComplete(false);
            setTotalTimeTrained(0);
            setCompletionPage(0);
        }
    }, [isOpen, plan]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                setTotalTimeTrained(prev => prev + 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            handlePhaseComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handlePhaseComplete = () => {
        if (phaseIndex < PHASE_ORDER.length - 1) {
            setPhaseIndex(phaseIndex + 1);
            setTimeLeft(300); // Reset for next phase
        } else {
            setIsActive(false);
            setShowComplete(true);
            // TRIGGER CANONICAL COMPLETION
            if (sessionId && userId) {
                console.log("[V11] Triggering canonical protocol completion...");
                completeProtocolSession(sessionId, userId).then(res => {
                    if (res.success && res.snapshot) {
                        console.log("[V11] Canonical score updated:", res.snapshot.score_after);
                        onComplete({ streak: 1, totalTime: totalTimeTrained, snapshot: res.snapshot });
                    } else {
                         onComplete({ streak: 1, totalTime: totalTimeTrained });
                    }
                });
            } else {
                 onComplete({ streak: 1, totalTime: totalTimeTrained });
            }
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Breath timer logic
    const [breathText, setBreathText] = useState("Inhale");
    useEffect(() => {
        if (phaseKey === 'mental' && isActive) {
            const breathInterval = setInterval(() => {
                const s = totalTimeTrained % 16;
                if (s < 4) setBreathText("Inhale");
                else if (s < 8) setBreathText("Hold");
                else if (s < 12) setBreathText("Exhale");
                else setBreathText("Hold");
            }, 1000);
            return () => clearInterval(breathInterval);
        }
    }, [phaseKey, isActive, totalTimeTrained]);

    if (showComplete) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[700] bg-black flex flex-col items-center justify-between p-8 text-white"
            >
                {/* Completion Header */}
                <div className="w-full flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                             <BrandLogo size={32} />
                        </div>
                        <div>
                             <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">MARCH 2026</p>
                             <h3 className="text-xl font-medium tracking-tight">Daily Practice</h3>
                             <p className="text-sm font-medium text-white/60">1/31</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* Progress Bar under header */}
                <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-white/40"
                        initial={{ width: 0 }}
                        animate={{ width: '3.2%' }}
                    />
                </div>

                {/* Completion Content - Carousel */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {completionPage === 0 ? (
                            <motion.div 
                                key="p1"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="text-center space-y-12"
                            >
                                <div className="space-y-4">
                                     <h2 className="text-2xl font-medium tracking-tight">Congratulations</h2>
                                     <p className="text-zinc-400 font-medium tracking-tight">You have successfully completed</p>
                                </div>
                                <div className="relative">
                                     <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full scale-150" />
                                     <h1 className="text-[9rem] font-medium leading-none relative z-10">1</h1>
                                </div>
                                <p className="text-2xl font-medium text-white">1 Class</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="p2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="w-full max-w-xs grid grid-cols-2 gap-y-12 gap-x-8"
                            >
                                <div className="space-y-2">
                                     <h1 className="text-5xl font-medium">1</h1>
                                     <p className="text-[11px] text-zinc-500 font-medium">Day Streak</p>
                                </div>
                                <div className="space-y-2">
                                     <h1 className="text-5xl font-medium">1</h1>
                                     <p className="text-[11px] text-zinc-500 font-medium">Classes Taken</p>
                                </div>
                                <div className="space-y-2">
                                     <h1 className="text-5xl font-medium">1</h1>
                                     <p className="text-[11px] text-zinc-500 font-medium">Best Streak</p>
                                </div>
                                <div className="space-y-2">
                                     <h1 className="text-5xl font-medium">{Math.max(1, Math.ceil(totalTimeTrained / 60))}</h1>
                                     <p className="text-[11px] text-zinc-500 font-medium">Minutes Practiced</p>
                                </div>
                                <div className="space-y-2 col-span-2 pt-4 border-t border-white/5">
                                     <h1 className="text-5xl font-medium text-[#D4FB79]">{snapshot?.score_after || '68'}</h1>
                                     <p className="text-[11px] text-[#D4FB79]/60 font-black uppercase tracking-widest">Canonical V11 Index</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Carousel Indicators */}
                <div className="flex gap-2 mb-12">
                     {[0, 1].map(i => (
                         <div 
                             key={i} 
                             className={`w-1.5 h-1.5 rounded-full transition-colors ${completionPage === i ? 'bg-white' : 'bg-white/20'}`} 
                         />
                     ))}
                </div>

                {/* Footer Buttons */}
                 <div className="w-full flex gap-4 pb-8">
                    <Button 
                        variant="outline"
                        className="flex-1 border-white/20 rounded-full py-7 flex items-center justify-center gap-3 font-medium text-sm hover:bg-white/5 text-white h-auto"
                    >
                        <Share size={18} /> Share
                    </Button>
                    {completionPage === 0 ? (
                        <Button 
                            onClick={() => setCompletionPage(1)}
                            className="flex-1 bg-white text-black hover:bg-white/90 rounded-full py-7 flex items-center justify-center gap-2 font-medium text-sm h-auto"
                        >
                            Next <ArrowRight size={18} />
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => {
                                console.log('[TIMER] Done clicked. Trained:', totalTimeTrained);
                                onComplete({ streak: 1, totalTime: totalTimeTrained });
                                onClose();
                            }}
                            className="flex-1 bg-white text-black hover:bg-white/90 rounded-full py-7 flex items-center justify-center gap-2 font-medium text-sm h-auto"
                        >
                            Done <ArrowRight size={18} />
                        </Button>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[700] bg-black flex flex-col text-white"
                >
                    {/* Top Header */}
                    <div className="p-8 flex items-start justify-between z-20">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold tracking-tight">
                                {phaseKey === 'mental' ? 'Breathwork' : currentDrill?.name || (phaseKey === 'warmup' ? 'Dynamic Prep' : 'Training')}
                            </h2>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Stage {phaseIndex + 1}/3</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 transition-all text-white/40 hover:text-white"
                        >
                            <X size={24} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Central Atmosphere */}
                    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black opacity-40" />
                        
                        {phaseKey === 'mental' ? (
                            <div className="relative w-80 h-80 flex flex-col items-center justify-center gap-8">
                                {/* Dynamic Breathing Visual Based on Step */}
                                <motion.div 
                                    className="relative flex items-center justify-center"
                                    animate={{ 
                                        scale: breathText === "Inhale" ? [1, 1.8] : breathText === "Exhale" ? [1.8, 1] : 1.4,
                                    }}
                                    transition={{ duration: 4, ease: "easeInOut" }}
                                >
                                    {/* Breathing Circle Drawing */}
                                    <svg className="w-64 h-64 -rotate-90">
                                        <motion.circle 
                                            cx="128" cy="128" r="100" 
                                            fill="none" stroke="#D4FB79" strokeWidth="2" strokeDasharray="628"
                                            animate={{ 
                                                strokeDashoffset: breathText === "Hold" ? 0 : [628, 0],
                                                opacity: [0.2, 0.8, 0.2]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                         <span className="text-sm font-bold text-[#D4FB79] uppercase tracking-[0.4em] translate-x-1">{breathText}</span>
                                    </div>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <motion.div 
                                    animate={{ 
                                        scale: isActive ? [1, 1.1, 1] : 1,
                                        opacity: isActive ? [0.2, 0.4, 0.2] : 0.1
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute w-40 h-40 bg-zinc-400 rounded-full blur-[80px]"
                                />
                                <div className="p-8 rounded-full border border-white/5 bg-white/5">
                                    <Play size={40} className="text-white/20" />
                                </div>
                            </div>
                        )}

                        {/* Text Overlay - Extremely minimal */}
                        <div className="relative z-30 text-center mt-12 space-y-4 max-w-sm px-10">
                             <p className="text-base font-medium text-white/80 leading-snug">
                                {currentDrill?.steps?.[0] || 'Find your focus.'}
                             </p>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="p-8 pb-12 space-y-8 z-20">
                        {/* Scrubber */}
                        <div className="space-y-4 px-4">
                            <div className="relative h-px bg-white/20">
                                <motion.div 
                                    className="absolute inset-y-0 left-0 bg-white"
                                    animate={{ width: `${((durationInSeconds - timeLeft) / durationInSeconds) * 100}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-white/40 tracking-wider">
                                <span>{formatTime(durationInSeconds - timeLeft)}</span>
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-12">
                            <button 
                                onClick={() => setTimeLeft(durationInSeconds)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <RotateCcw size={24} />
                            </button>
                            
                            <button 
                                onClick={() => setIsActive(!isActive)}
                                className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                            >
                                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                            </button>

                            <button 
                                onClick={handlePhaseComplete}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
