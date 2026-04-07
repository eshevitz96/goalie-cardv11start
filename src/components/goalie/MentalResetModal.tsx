"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DrillDef } from '@/lib/expert-engine';
import { completeProtocolSession } from '@/app/actions';

interface MentalResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    drill: DrillDef;
    snapshot?: any;
    sessionId?: string;
    userId?: string;
    onComplete?: (snapshot: any) => void;
}

export function MentalResetModal({ isOpen, onClose, drill, snapshot, sessionId, userId, onComplete }: MentalResetModalProps) {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (sessionId && userId) {
                completeProtocolSession(sessionId, userId).then(res => {
                    if (res.success && res.snapshot && onComplete) {
                        onComplete(res.snapshot);
                    }
                });
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, sessionId, userId, onComplete]);

    // Breathing Phase Logic
    useEffect(() => {
        if (!isActive) return;
        const phaseInterval = setInterval(() => {
            setPhase((prev) => {
                if (prev === 'Inhale') return 'Hold';
                if (prev === 'Hold') return 'Exhale';
                if (prev === 'Exhale') return 'Rest';
                return 'Inhale';
            });
        }, 4000);
        return () => clearInterval(phaseInterval);
    }, [isActive]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-background/80 backdrop-blur-3xl"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-xl bg-card border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <RotateCcw size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">{drill.name}</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Calm Feet Protocol</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center py-12 space-y-12">
                        {/* Visualization */}
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <motion.div 
                                animate={isActive ? { 
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 0.1, 0.3]
                                } : {}}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 border border-primary/20 rounded-full"
                            />
                            <motion.div 
                                animate={isActive ? { 
                                    scale: [1, 1.2, 1],
                                } : {}}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 h-32 bg-primary/5 border border-primary/20 rounded-full flex flex-col items-center justify-center text-center p-4"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{phase}</span>
                                <span className="text-4xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                            </motion.div>
                        </div>

                        <div className="space-y-4 text-center">
                             <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">
                                Focus on your breath. Clear your field of vision. Reset the optic nerve.
                             </p>
                             <div className="flex gap-2 justify-center">
                                {drill.steps?.map((step, i) => (
                                    <div key={i} className="px-3 py-1 bg-muted/50 rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {step}
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="w-full flex gap-4 pt-4">
                            <Button 
                                onClick={() => setIsActive(!isActive)}
                                className={`flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${isActive ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground hover:scale-[1.02]'}`}
                            >
                                {isActive ? <><Pause size={16} className="mr-2" /> Pause</> : <><Play size={16} className="mr-2" /> Start Protocol</>}
                            </Button>
                            
                            {timeLeft === 0 && (
                                <Button 
                                    onClick={onClose}
                                    className="flex-1 py-6 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    <CheckCircle size={16} className="mr-2" /> Complete
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
