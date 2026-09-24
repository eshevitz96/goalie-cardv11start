import React from 'react';
import { Medal, Network, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface CoachesCornerProps {
    activeGoalie: any;
    hasCoach?: boolean;
    onPickCoach?: () => void;
    onAddVideo?: () => void;
}

export function CoachesCorner({ activeGoalie, hasCoach, onPickCoach, onAddVideo }: CoachesCornerProps) {
    const toast = useToast();

    const handleRequestAccess = () => {
        if (confirm("Request Access to Coach OS Enterprise? This connects your profile directly to the coach's management dashboard.")) {
            toast.success("Request Sent! Connecting to Coach OS...");
            // Future: triggers DB insert to requests table
        }
    };

    return (
        <div className="rounded-[28px] p-6 md:p-8 relative overflow-hidden bg-card border border-border hover:border-foreground/30 flex flex-col justify-between transition-all shadow-sm font-sans">
            {/* Watermark */}
            <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                <Medal size={72} strokeWidth={1.5} className="text-foreground" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                            <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-base md:text-lg text-foreground tracking-tight m-0">
                            Coaches Corner
                        </h3>
                    </div>
                    <span className="px-2.5 py-1 bg-muted rounded-md text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Coach Card
                    </span>
                </div>

                <div className="space-y-4">
                    {hasCoach || activeGoalie.coachDetails ? (
                        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/50 border border-border/60">
                            <div className="w-11 h-11 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                                <span>{(activeGoalie.coach || "E").charAt(0)}</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Assigned Coach</div>
                                <div className="font-bold text-foreground text-sm leading-tight">{activeGoalie.coach || "Coach Elliott"}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                             <button 
                                onClick={onPickCoach}
                                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 px-4 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm text-center"
                            >
                                Connect with Coach
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 pt-4 mt-6 border-t border-border">
                {/* Highlights Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Highlights</span>
                        <button 
                            onClick={onAddVideo}
                            className="text-xs font-semibold px-3 py-1 bg-muted border border-border hover:bg-muted/80 rounded-xl text-foreground transition-all cursor-pointer"
                        >
                            + Add Video
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground m-0">
                        Share game clips for personalized technical review.
                    </p>
                </div>
            </div>
        </div>
    );
}
