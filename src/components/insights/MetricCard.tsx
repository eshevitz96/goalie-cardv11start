import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

interface MetricCardProps {
    title: string;
    value: string | number | undefined;
    sub?: string;
    icon: React.ReactNode;
    onClick: () => void;
    label: string;
}

export function MetricCard({ title, value, sub, icon, onClick, label }: MetricCardProps) {
    return (
        <div onClick={onClick} className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
            <Card variant="glass" className="h-full border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
                            <h3 className="text-2xl font-bold text-foreground mt-2 mb-1">{value}</h3>
                            {sub && <p className="text-xs text-gray-500">{sub}</p>}
                            {label && (
                                <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {label} <span className="rotate-180 inline-block">→</span>
                                </p>
                            )}
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors shadow-inner">{icon}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
