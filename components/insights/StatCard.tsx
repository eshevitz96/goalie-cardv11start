"use client";

import { ArrowLeft } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    sub?: string;
    onClick?: () => void;
    label?: string;
    className?: string; // Additional classes
}

export function StatCard({ title, value, icon, sub, onClick, label, className }: StatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${className}`}
        >
            <div className="rounded-xl border shadow-sm glass h-full hover:border-primary/50 transition-colors bg-card text-card-foreground">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                {title}
                            </p>
                            <h3 className="text-2xl font-bold text-foreground mt-2 mb-1">
                                {value}
                            </h3>
                            {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}

                            {label && (
                                <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {label} <ArrowLeft className="rotate-180" size={10} />
                                </p>
                            )}
                        </div>
                        <div className="p-2 bg-secondary/30 rounded-lg group-hover:bg-secondary/50 transition-colors shadow-inner">
                            {icon}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
