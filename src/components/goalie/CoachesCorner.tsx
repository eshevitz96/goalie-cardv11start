import React from 'react';
import { Medal, Network, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface CoachesCornerProps {
    activeGoalie: any;
    hasCoach?: boolean;
    onPickCoach?: () => void;
}

export function CoachesCorner({ activeGoalie, hasCoach, onPickCoach }: CoachesCornerProps) {
    const toast = useToast();

    const handleRequestAccess = () => {
        if (confirm("Request Access to Coach OS Enterprise? This connects your profile directly to the coach's management dashboard.")) {
            toast.success("Request Sent! Connecting to Coach OS...");
            // Future: triggers DB insert to requests table
        }
    };

    return (
        <div className="glass rounded-[2rem] p-6 relative overflow-hidden bg-gradient-to-br from-card to-background border border-border/50 flex flex-col">
            {/* Trophy Icon Watermark */}
            <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
                <Medal size={60} strokeWidth={1} className="text-muted-foreground" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-base text-foreground flex items-center gap-2 tracking-tight">
                        <ShieldCheck size={18} className="text-foreground" /> Coaches Corner
                    </h3>
                </div>

                <div className="space-y-4">
                    {hasCoach || activeGoalie.coachDetails ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-inner">
                                <span className="font-black text-base">{(activeGoalie.coach || "E").charAt(0)}</span>
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Assigned Coach</div>
                                <div className="font-bold text-foreground text-sm leading-tight">{activeGoalie.coach || "Coach Elliott"}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                             <button 
                                onClick={onPickCoach}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none group-hover:scale-105 transition-transform">Connect with Coach</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 pt-4 mt-6 border-t border-border/40">
                {/* Highlights Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[.2em]">Highlights</span>
                        <button 
                            className="text-[9px] font-black text-blue-500 hover:bg-blue-500/5 transition-colors border border-blue-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap"
                        >
                            + Add Video
                        </button>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground italic">
                        Share game clips for review.
                    </p>
                </div>
            </div>
        </div>
    );
}
