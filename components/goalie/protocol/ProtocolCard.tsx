"use client";

import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";

interface ProtocolCardProps {
    variant: 'hero' | 'minimal';
    title: string;
    description?: string;
    duration?: string;
    stages?: string[];
    onClick?: () => void;
    className?: string;
}

export function ProtocolCard({ variant, title, description, duration, stages, onClick, className }: ProtocolCardProps) {
    if (variant === 'hero') {
        return (
            <div className={`w-full bg-transparent text-foreground relative overflow-hidden rounded-none ${className}`}>
                {/* Protocol Info Section */}
                <div 
                    onClick={onClick}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-14 relative z-10 px-1 cursor-pointer group"
                >
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-[2.65rem] font-black tracking-[-0.03em] leading-none uppercase -ml-0.5 group-hover:text-primary transition-colors">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.3em] mt-6">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-transparent border border-border rounded-full flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all duration-700 hover:scale-105 shadow-xl shrink-0">
                        <Play fill="currentColor" size={24} className="ml-1" />
                    </div>
                </div>

                <div className="h-[1px] bg-border mb-12" />

                {/* Footer Metadata */}
                <div className="flex items-start gap-24 relative z-10 font-bold mb-2 px-1">
                    {stages && (
                        <div className="space-y-4">
                            <span className="text-[9px] uppercase text-muted-foreground/40 tracking-[.45em]">Protocol Stages</span>
                            <div className="flex gap-6 text-[11px] text-foreground uppercase tracking-[.1em] font-black">
                                {stages.map(s => <span key={s}>{s}</span>)}
                            </div>
                        </div>
                    )}
                    {duration && (
                        <div className="space-y-4">
                            <span className="text-[9px] uppercase text-muted-foreground/40 tracking-[.45em]">Duration</span>
                            <p className="text-[11px] text-foreground font-black uppercase tracking-widest">{duration}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full bg-transparent py-6 md:py-8 relative overflow-hidden rounded-none transition-all group ${className}`}>
            <div 
                onClick={onClick}
                className="group cursor-pointer flex items-center justify-between gap-8 h-full"
            >
                <div className="flex flex-col gap-2">
                    <span className="text-[8px] font-bold text-muted-foreground tracking-[.49em] uppercase leading-none">
                        {duration ? `${duration} • ` : ''}{description}
                    </span>
                    <h4 className="text-xl md:text-2xl font-black tracking-[-0.03em] uppercase leading-none transition-colors text-foreground">
                        {title}
                    </h4>
                </div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-all group-hover:bg-foreground group-hover:text-background shrink-0">
                    <ArrowRight size={16} />
                </div>
            </div>
        </div>
    );
}
