"use client";

import { motion } from "framer-motion";

const CREDITS_PER_PERIOD = 4;

interface MonthlyCreditsWidgetProps {
    credits: number;
    coachName?: string;
}

export function MonthlyCreditsWidget({ credits, coachName }: MonthlyCreditsWidgetProps) {
    const safeCredits = Math.max(0, credits);
    const allUsed = safeCredits === 0;

    // Don't render if no active plan yet
    if (credits === undefined || credits === null) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">
                        Monthly Lessons
                    </p>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl font-black tracking-tighter leading-none ${allUsed ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                            {safeCredits}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">
                            of {CREDITS_PER_PERIOD} remaining
                        </span>
                    </div>
                </div>

                {/* Stacked bar indicators */}
                <div className="flex gap-1 items-end pb-0.5">
                    {Array.from({ length: CREDITS_PER_PERIOD }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 rounded-sm transition-all duration-300 ${i < safeCredits
                                    ? 'h-5 bg-primary'
                                    : 'h-2.5 bg-muted-foreground/20'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Depleting progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${allUsed ? 'bg-muted-foreground/20' : 'bg-primary'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(safeCredits / CREDITS_PER_PERIOD) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                />
            </div>

            {/* Status message */}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {allUsed
                    ? "⚡ All lessons used this month"
                    : coachName
                        ? `Book with ${coachName} · ${safeCredits} ${safeCredits === 1 ? 'lesson' : 'lessons'} available`
                        : `${safeCredits} ${safeCredits === 1 ? 'lesson' : 'lessons'} available this month`
                }
            </p>
        </motion.div>
    );
}
