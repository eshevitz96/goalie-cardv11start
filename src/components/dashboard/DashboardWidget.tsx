"use client";

import { motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

interface DashboardWidgetProps {
    id: string;
    title?: string;
    size: WidgetSize;
    isEditing: boolean;
    onRemove?: () => void;
    onResize?: (newSize: WidgetSize) => void;
    children: React.ReactNode;
    className?: string; // For additional styling
}

const sizeClasses: Record<WidgetSize, string> = {
    sm: "col-span-1 row-span-1", // 1x1
    md: "col-span-2 row-span-1", // 2x1
    lg: "col-span-2 row-span-2", // 2x2
    xl: "col-span-4 row-span-2", // Full width
};

export function DashboardWidget({
    id,
    title,
    size,
    isEditing,
    onRemove,
    onResize,
    children,
    className
}: DashboardWidgetProps) {

    return (
        <motion.div
            layout // Enable Framer Motion layout animations for smooth resizing
            className={cn(
                "relative group bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl",
                sizeClasses[size],
                isEditing && "ring-2 ring-primary border-primary animate-pulse-slow",
                className
            )}
        >
            {/* Widget Content */}
            <div className="h-full w-full relative z-10">
                {children}
            </div>

            {/* Edit Mode Overlay */}
            {isEditing && (
                <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-4">
                    <div className="font-bold text-white mb-2">{title || "Widget"}</div>

                    {/* Size Controls */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onResize?.('sm')}
                            className={cn("h-8 px-2 text-xs", size === 'sm' && "bg-primary text-white")}
                        >
                            1x1
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onResize?.('md')}
                            className={cn("h-8 px-2 text-xs", size === 'md' && "bg-primary text-white")}
                        >
                            2x1
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onResize?.('lg')}
                            className={cn("h-8 px-2 text-xs", size === 'lg' && "bg-primary text-white")}
                        >
                            2x2
                        </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={onRemove}
                        className="mt-2 h-8"
                    >
                        <X size={14} className="mr-1" /> Remove
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
