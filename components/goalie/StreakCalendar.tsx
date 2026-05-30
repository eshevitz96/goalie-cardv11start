"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StreakCalendarProps {
    isOpen: boolean;
    onClose: () => void;
    sessions?: any[];
}

export function StreakCalendar({ isOpen, onClose, sessions = [] }: StreakCalendarProps) {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    
    // Current date info
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    
    // Calendar layout logic
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Adjust to M=0
    
    // Real trained days for the month
    const trainedDays = sessions
        .filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .map(s => new Date(s.date).getDate());

    // Calculate streak logic (simplified for UI)
    const currentStreak = sessions.length > 0 ? 8 : 0; 

    const handleDayClick = (day: number) => {
        setSelectedDay(day);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl"
                    />
                    
                    {/* Modal */}
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className="relative w-full max-w-sm bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-8"
                    >
                        {/* Header: Date Range */}
                        <div className="flex items-center justify-between mb-8">
                           <button className="p-2 text-muted-foreground hover:text-foreground"><ChevronLeft size={16}/></button>
                           <h3 className="text-[10px] font-black uppercase tracking-[.4em] text-foreground">MAR 15 - MAR 21</h3>
                           <button className="p-2 text-muted-foreground hover:text-foreground"><ChevronRight size={16}/></button>
                        </div>

                        {/* Calendar Row */}
                        <div className="grid grid-cols-7 gap-2 mb-12">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <span className="text-[10px] font-bold text-muted-foreground">{d}</span>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border ${
                                        trainedDays.includes(i + 15) // Mock logic for the screenshot range
                                            ? 'bg-foreground text-background border-foreground' 
                                            : 'bg-white/5 border-white/5 text-muted-foreground'
                                    }`}>
                                        {i + 15}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-white/10 mb-10" />

                        {/* Primary Streaks */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="space-y-1">
                                <h2 className="text-6xl font-black tracking-tighter text-foreground">2</h2>
                                <p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Day Streak</p>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-6xl font-black tracking-tighter text-foreground">1</h2>
                                <p className="text-[10px] font-black uppercase tracking-[.2em] text-muted-foreground">Week Streak</p>
                            </div>
                        </div>

                        <div className="h-px bg-white/10 mb-10" />

                        {/* Bottom Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-foreground">2</h4>
                                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-tight">Best Day Streak</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-foreground">{sessions.length}</h4>
                                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-tight">Sessions Logged</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-foreground">28</h4>
                                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-tight">Minutes Practiced</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-foreground">1</h4>
                                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-tight">Best Week Streak</p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-all transform hover:scale-110"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
