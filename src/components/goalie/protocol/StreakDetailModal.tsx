"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
import { useMemo } from "react";

interface StreakDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    streak: number;
    rosterId?: string;
    performanceSnapshot?: any;
}

export function StreakDetailModal({ isOpen, onClose, streak, rosterId, performanceSnapshot }: StreakDetailModalProps) {
    const daysArr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const now = new Date("2026-03-28T14:25:39.000Z");

    const currentWeekInfo = useMemo(() => {
        const start = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        start.setDate(diff);
        
        const label = `${start.toLocaleString('default', { month: 'short' })} ${start.getDate()} - ${new Date(start.getTime() + 6 * 86400000).toLocaleString('default', { month: 'short' })} ${new Date(start.getTime() + 6 * 86400000).getDate()}`;
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push({ 
                day: daysArr[i], 
                date: d.getDate(), 
                isToday: d.toDateString() === now.toDateString(),
                isPast: d < now && d.toDateString() !== now.toDateString()
            });
        }
        return { label, days };
    }, [now]);

    if (!isOpen) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 sm:p-12 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)]"
        >
            <div className="w-full max-w-sm bg-[#080808] border border-white/5 rounded-[3.25rem] p-8 flex flex-col gap-10 shadow-[0_20px_100px_rgba(0,0,0,0.8)] relative group">
                <button 
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 text-white/20 hover:text-white uppercase text-[8px] font-bold tracking-[.4em] transition-colors [-webkit-tap-highlight-color:transparent]"
                >
                    Close [ESC]
                </button>

                {/* Week Navigation */}
                <div className="flex items-center justify-between px-2">
                    <button className="text-white/30 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                    <span className="text-[10px] font-medium text-white/50 uppercase tracking-[.45em]">{currentWeekInfo.label}</span>
                    <button className="text-white/30 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                </div>

                {/* Date Selector Row */}
                <div className="grid grid-cols-7 gap-2 text-center pb-2">
                    {currentWeekInfo.days.map((d, i) => (
                        <div key={i} className="flex flex-col gap-4 items-center">
                            <span className="text-[10px] font-medium text-white/40 uppercase">{d.day}</span>
                            <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                                d.isToday ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                                d.isPast ? 'bg-white/[0.08] text-white/90' : 
                                'text-white/20'
                            }`}>
                                {d.date}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-[0.5px] bg-white/5 w-full -my-2" />

                {/* Main Performance Metrics */}
                <div className="flex gap-16 py-4">
                    <div className="space-y-1">
                        <h2 className="text-[5.5rem] font-medium tracking-tighter leading-none text-white">{streak}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[.35em] text-white/40">Day Streak</p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-[5.5rem] font-medium tracking-tighter leading-none text-white">{Math.ceil(streak / 7)}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[.35em] text-white/40">Week Streak</p>
                    </div>
                </div>

                <div className="h-[0.5px] bg-white/5 w-full -my-2" />

                {/* Account Life Progress Section */}
                <div className="space-y-6">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-[.4em]">Season Progress</span>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Stability", val: performanceSnapshot?.stability_score || "..." },
                            { label: "Execution", val: performanceSnapshot?.execution_score || "..." },
                            { label: "Readiness", val: performanceSnapshot?.readiness_score || "..." }
                        ].map((stat, i) => (
                             <div key={i} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                 <span className="text-xl font-medium text-white">{stat.val}</span>
                                 <span className="text-[7.5px] font-bold uppercase tracking-[.1em] text-white/30">{stat.label}</span>
                             </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Breakdown */}
                <div className="grid grid-cols-4 gap-6 py-2">
                    {[
                        { val: streak.toString(), label: "Best Day Streak" },
                        { val: "...", label: "Activity" },
                        { val: "...", label: "Minutes" },
                        { val: "1", label: "Best Week Streak" }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col gap-2.5">
                            <span className="text-2xl font-medium text-white leading-none">{stat.val}</span>
                            <span className="text-[7.5px] font-bold uppercase tracking-[.15em] text-white/30 leading-tight">
                                {stat.label.split(' ').map((word, wi) => (
                                    <span key={wi} className="block">{word}</span>
                                ))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Interaction Hint */}
                <div className="flex flex-col items-center gap-2 pt-2">
                    <ChevronUp className="text-white/10" size={20} />
                </div>
            </div>
        </motion.div>
    );
}
