"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DrillDef } from '@/lib/expert-engine';

interface MentalResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    drill: DrillDef;
}

export function MentalResetModal({ isOpen, onClose, drill }: MentalResetModalProps) {
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
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-between p-6 md:p-12 text-white"
        >
            {/* Header */}
            <div className="w-full flex justify-between items-start max-w-lg">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">{drill.name}</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{drill.duration}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative">
                <AnimatePresence mode="wait">
                    {!isActive && timeLeft > 0 ? (
                        <motion.div 
                            key="static"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-12">
                                Breathwork & Meditation
                            </div>
                            
                            {/* Geometric Flower Animation */}
                            <div className="relative w-64 h-64 mb-16">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 border border-zinc-500/30 rounded-full"
                                        style={{
                                            transform: `rotate(${i * 60}deg) translateX(40px)`,
                                        }}
                                    />
                                ))}
                                <div className="absolute inset-0 border border-zinc-500/50 rounded-full scale-75" />
                            </div>

                            <Button 
                                onClick={() => setIsActive(true)}
                                variant="outline"
                                className="rounded-full px-12 py-6 border-zinc-700 hover:bg-zinc-900 bg-transparent text-lg font-medium group transition-all"
                            >
                                Set timer <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    ) : timeLeft === 0 ? (
                        <motion.div 
                            key="complete"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center text-center space-y-10"
                        >
                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={32} className="text-emerald-500" />
                                </div>
                                <h3 className="text-4xl font-black tracking-tighter">Session Complete</h3>
                                <div className="flex flex-col gap-1">
                                    <p className="text-emerald-500 text-lg font-bold">5 Day Streak</p>
                                    <p className="text-zinc-500 text-sm font-medium">15 mins trained today</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <Button 
                                    onClick={onClose}
                                    className="bg-white text-black hover:scale-[1.02] py-6 rounded-2xl text-base font-bold transition-all shadow-xl shadow-white/5"
                                >
                                    Write in Journal
                                </Button>
                                <Button 
                                    onClick={onClose}
                                    variant="ghost"
                                    className="text-zinc-500 hover:text-white py-4 text-xs font-bold uppercase tracking-widest"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="active"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center w-full"
                        >
                            {/* Dynamic Breathing Circle */}
                            <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                                <motion.div 
                                    animate={{ 
                                        scale: phase === 'Inhale' ? 1.5 : phase === 'Exhale' ? 0.8 : 1,
                                        opacity: phase === 'Hold' ? 0.6 : 0.4
                                    }}
                                    transition={{ duration: 4, ease: "easeInOut" }}
                                    className="absolute w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px]"
                                />
                                
                                <motion.div 
                                    animate={{ 
                                        scale: phase === 'Inhale' ? 1.2 : phase === 'Exhale' ? 0.8 : 1
                                    }}
                                    transition={{ duration: 4, ease: "easeInOut" }}
                                    className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center relative overflow-hidden"
                                >
                                    <div className="text-xl font-light tracking-[0.2em]">{phase}</div>
                                </motion.div>
                            </div>

                            <div className="w-full space-y-8">
                                <div className="flex flex-col gap-2">
                                    <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-white" 
                                            animate={{ width: `${(300 - timeLeft) / 3}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                        <span>{formatTime(300 - timeLeft)}</span>
                                        <span>{formatTime(timeLeft)}</span>
                                    </div>
                                </div>

                                {/* Minimal Controls */}
                                <div className="flex items-center justify-center gap-12">
                                    <button 
                                        onClick={() => setTimeLeft(prev => Math.min(300, prev + 10))}
                                        className="text-zinc-600 hover:text-white transition-colors"
                                    >
                                        <RotateCcw size={18} className="-scale-x-100" />
                                    </button>
                                    <button 
                                        onClick={() => setIsActive(!isActive)}
                                        className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                    >
                                        {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
                                    </button>
                                    <button 
                                        onClick={() => setTimeLeft(prev => Math.max(0, prev - 10))}
                                        className="text-zinc-600 hover:text-white transition-colors"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Description Area */}
            {!isActive && timeLeft > 0 && (
                <div className="w-full max-w-lg border-t border-zinc-800 pt-6">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Technique</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        {drill.reason || "Focus on the steady expansion of your lungs. Maintain a clear and open channel for each breath."}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
