"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface StreakTimelineProps {
    streak: number;
    onClick?: () => void;
    className?: string;
}

export function StreakTimeline({ streak, onClick, className }: StreakTimelineProps) {
    const daysArr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const now = new Date("2026-03-28T14:25:39.000Z"); // Canonical reference date
    const todayIdx = (now.getDay() + 6) % 7;

    const currentWeekInfo = useMemo(() => {
        const start = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        start.setDate(diff);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push({ 
                day: daysArr[i], 
                isToday: d.toDateString() === now.toDateString(),
                isInStreak: streak > 0 && i <= todayIdx && i >= (todayIdx - (streak - 1))
            });
        }
        return days;
    }, [streak, todayIdx]);

    return (
        <div 
            onClick={onClick}
            className={`flex items-center justify-between relative z-10 font-bold uppercase tracking-[.45em] cursor-pointer group ${className}`}
        >
            <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] relative">
                {/* 
                    Streak Range Pill - Highly Precise Alignment
                    Day pitch = w-8 (2rem) + gap-2 (0.5rem) = 2.5rem.
                */}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 h-8 bg-foreground/[0.08] rounded-full z-0 transition-all duration-500" 
                    style={{ 
                        left: `calc(${streak > 0 ? (todayIdx - (streak - 1) >= 0 ? todayIdx - (streak - 1) : 0) : todayIdx} * 2.5rem - 0.4rem)`,
                        width: `calc(${streak > 0 ? (streak > todayIdx + 1 ? todayIdx + 1 : streak) : 1} * 2.5rem - 0.3rem)` 
                    }}
                />
                
                {currentWeekInfo.map((d, i) => (
                    <div key={i} className="relative flex flex-col items-center w-8 text-center z-10 transition-colors">
                        <span className={`text-[11px] w-full block ${d.isToday ? 'text-foreground font-black' : (d.isInStreak ? 'text-foreground/80' : 'text-foreground/30 font-bold')}`}>
                            {d.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
