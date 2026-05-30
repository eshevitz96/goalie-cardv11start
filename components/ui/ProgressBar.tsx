"use client";

import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

interface ProgressBarProps {
    value: number; // 0-100
    max?: number; // default 100
    className?: string; // Container classes
    barClassName?: string; // Inner bar classes
    height?: string; // explicit height like h-4, h-1.5
    showGlow?: boolean; // Add shadow/glow effect
    delay?: number; // Animation delay in seconds
}

export function ProgressBar({
    value,
    max = 100,
    className,
    barClassName,
    height = "h-4",
    showGlow = false,
    delay = 0
}: ProgressBarProps) {
    // Clamp percentage between 0 and 100
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));

    return (
        <div className={twMerge(`w-full bg-muted rounded-full overflow-hidden border border-border/50 ${height}`, className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay, ease: "easeOut" }}
                className={twMerge(
                    "h-full bg-primary",
                    showGlow && "shadow-[0_0_15px_rgba(0,0,0,0.1)]",
                    barClassName
                )}
            />
        </div>
    );
}
