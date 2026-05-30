"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface StreakTrackerProps {
    onClick?: () => void;
    sessions?: any[]; // Allow passing real sessions
}

export function StreakTracker({ onClick, sessions = [] }: StreakTrackerProps) {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date().getDay(); // 0 is Sunday
    
    // Calculate real trained days from sessions
    const trainedDaysIdx = sessions.map(s => new Date(s.date).getDay());
    const isTrained = (idx: number) => trainedDaysIdx.includes(idx);

    return (
        <div 
            onClick={onClick}
            className="flex items-center gap-6 mb-12 cursor-pointer group"
        >
            <div className="flex items-center relative">
                <div className="flex gap-4 relative z-10 px-2 py-1">
                    {days.map((day, i) => {
                        const active = isTrained(i);
                        const isToday = i === today;
                        
                        // Logic for pill-background: if it's trained, it should have a shared background with neighbors
                        return (
                            <div key={i} className="flex flex-col items-center relative min-w-[12px]">
                                <span className={`text-[9px] font-bold tracking-widest transition-colors ${
                                    active ? 'text-foreground' : (isToday ? 'text-foreground font-black' : 'text-muted-foreground/30')
                                }`}>
                                    {day}
                                </span>
                                {isToday && (
                                    <div className="absolute -bottom-1 w-full h-[1.5px] bg-foreground rounded-full opacity-60" />
                                )}
                                
                                {/* Background Pill Logic */}
                                {active && (
                                    <div className={`absolute inset-y-0 -inset-x-2 bg-foreground/10 -z-10 ${
                                        isTrained(i-1) ? 'rounded-l-none' : 'rounded-l-full'
                                    } ${
                                        isTrained(i+1) ? 'rounded-r-none' : 'rounded-r-full'
                                    }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="h-4 w-px bg-border/20 mx-2" />
            <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-none mb-1">Streak</span>
                <span className="text-xs font-black text-foreground leading-none uppercase tracking-tight">
                    {sessions.length > 0 ? 5 : 0} Days
                </span>
            </div>
        </div>
    );
}
