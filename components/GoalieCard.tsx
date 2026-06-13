"use client";

import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSeasonTimeline } from "@/hooks/useSeasonTimeline";
import { PerformanceAvatar } from "@/components/ui/PerformanceAvatar";

export interface GoalieCardProps {
    name?: string;
    initials?: string;
    performanceScore?: number | string;
    session?: number;
    lesson?: number;
    team?: string;
    height?: string;
    weight?: string;
    catchHand?: string;
    gradYear?: string | number;
    className?: string;
    id?: string;
    isPro?: boolean;
    seasonProgress?: number;
    showProgress?: boolean;
    credits?: number;
    pendingPayment?: any;
    sport?: string;
    pureIcon?: boolean;
    games?: number;
    practices?: number;
    gcNumber?: string;
}

export function GoalieCard({
    name,
    initials,
    performanceScore,
    session,
    lesson,
    team,
    height,
    weight,
    catchHand,
    gradYear,
    className,
    id,
    isPro,
    seasonProgress,
    showProgress,
    credits,
    pendingPayment,
    sport,
    pureIcon,
    games,
    practices,
    gcNumber
}: GoalieCardProps) {
    const safeName = name ?? "";
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Local override state for custom season dates
    const [isEditingSeason, setIsEditingSeason] = useState(false);
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");

    // Persist to local storage keyed by goalie ID
    useEffect(() => {
        if (id) {
            const saved = localStorage.getItem(`season_dates_${id}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.start) setCustomStart(parsed.start);
                    if (parsed.end) setCustomEnd(parsed.end);
                } catch (e) {}
            }
        }
    }, [id]);

    useEffect(() => {
        if (id && customStart && customEnd) {
            localStorage.setItem(`season_dates_${id}`, JSON.stringify({ start: customStart, end: customEnd }));
        }
    }, [id, customStart, customEnd]);

    // Use season timeline logic hook
    const { seasonProgress: hookProgress, seasonLabel } = useSeasonTimeline(sport);
    let finalSeasonProgress = seasonProgress ?? hookProgress;
    
    // Calculate dynamic progress if custom dates exist
    if (customStart && customEnd) {
        const startMs = new Date(customStart).getTime();
        const endMs = new Date(customEnd).getTime();
        const nowMs = new Date().getTime();
        
        if (startMs < endMs) {
            finalSeasonProgress = Math.max(0, Math.min(100, ((nowMs - startMs) / (endMs - startMs)) * 100));
        }
    }

    if (pureIcon) {
        return (
            <div className={twMerge("flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0 shadow-inner", className)}>
                <div className="w-full h-full bg-[#006747] flex items-center justify-center rounded-2xl text-white font-bold uppercase text-sm">
                    {initials || "GC"}
                </div>
            </div>
        );
    }

    const handleUpgradeCheckout = async () => {
        if (!pendingPayment || !id) return;
        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: 'price_1T4QvMGj0SdRYIlhJeSpz3YW',
                    userId: pendingPayment.goalie_id,
                    returnUrl: `${window.location.origin}/dashboard`,
                    mode: 'subscription',
                    metadata: {
                        type: 'pro_upgrade',
                        rosterId: id,
                        coachId: pendingPayment.coach_id,
                        requestId: pendingPayment.id
                    }
                })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No URL returned from Stripe");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to initiate checkout. Please try again.");
            setIsCheckingOut(false);
        }
    };

    const calculatedInitials = initials || (safeName ? safeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "GC");

    // Performance Index checks
    const hasScore = performanceScore !== undefined && 
                     performanceScore !== null && 
                     performanceScore !== 0 && 
                     performanceScore !== "N/A" && 
                     performanceScore !== "Baseline Pending" && 
                     performanceScore !== "PENDING";
    const scoreValue = hasScore ? Number(performanceScore) : 0;

    return (
        <Link 
            href="/profile"
            className={twMerge(
                "glass rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[480px] select-none block cursor-pointer",
                className
            )}
        >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl opacity-50" />

            {/* Identity Section (Top) */}
            <div className="relative z-10 flex flex-col w-full mb-4">
                {/* Full-width Name Row */}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tighter leading-tight mb-3 break-words whitespace-normal w-full group-hover:text-white transition-colors">
                    {safeName}
                </h1>

                {/* Avatar & PI Ring Row */}
                <div className="flex items-center gap-4">
                    {/* Initials & Progress Ring */}
                    <PerformanceAvatar score={hasScore ? Number(performanceScore) : 0} size={72}>
                        <div className="w-full h-full bg-[#006747] text-white flex flex-col items-center justify-center leading-none rounded-full border border-white/5 shadow-md select-none pointer-events-none">
                            <span className={twMerge(
                                "font-black tracking-tighter uppercase", 
                                hasScore ? "text-[13px]" : "text-[16px]"
                            )}>
                                {calculatedInitials}
                            </span>
                            {hasScore && (
                                <span className="text-[11px] font-black text-emerald-400 tracking-tight mt-0.5">
                                    {performanceScore}
                                </span>
                            )}
                        </div>
                    </PerformanceAvatar>

                    {/* Team & Details */}
                    <div className="flex flex-col min-w-0">
                        {team && (
                            <div className="text-sm font-bold text-foreground opacity-90 break-words whitespace-normal leading-tight mb-1">
                                {team}
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                            {catchHand && (
                                <>
                                    <span>Catch: <span className="text-foreground">{catchHand}</span></span>
                                    {(height || weight) && <span className="w-1 h-1 rounded-full bg-border" />}
                                </>
                            )}
                            {(height || weight) && (
                                <span>
                                    {height && <span>{height}</span>}
                                    {height && weight && " / "}
                                    {weight && <span>{weight}</span>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Content Area */}
            <div className="relative z-10 space-y-6">
                {showProgress && (
                    <div className="space-y-4">
                        {/* Season Progress */}
                        <div className="space-y-1.5">
                            {finalSeasonProgress === null ? (
                                <div className="bg-muted/10 border border-border/20 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Season Timeline</span>
                                        <span className="text-[11px] font-bold text-foreground/70 mt-1 uppercase tracking-wider">{seasonLabel || "Off-season"}</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Goalie Card</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Season Timeline</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setIsEditingSeason(!isEditingSeason);
                                                }}
                                                className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                                            >
                                                <Settings2 size={10} />
                                            </button>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{Math.round(finalSeasonProgress)}%</span>
                                    </div>
                                    <ProgressBar
                                        value={finalSeasonProgress}
                                        height="h-2"
                                        barClassName="bg-muted-foreground/60"
                                        delay={0.4}
                                        className="rounded-full overflow-hidden bg-muted/20"
                                    />
                                </>
                            )}
                            
                            {isEditingSeason && (
                                <div 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="flex items-center gap-2 mt-2 bg-foreground/5 p-2 rounded-lg border border-border/10"
                                >
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 w-full block">1st Practice</label>
                                        <input 
                                            type="date" 
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="w-full bg-transparent text-[10px] font-bold text-foreground outline-none border-none p-0 min-h-0"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1 border-l border-border/20 pl-2">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 w-full block">Championship</label>
                                        <input 
                                            type="date" 
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="w-full bg-transparent text-[10px] font-bold text-foreground outline-none border-none p-0 min-h-0"
                                        />
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsEditingSeason(false);
                                        }}
                                        className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 hover:bg-primary/30 cursor-pointer"
                                    >
                                        <Check size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Counts */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/20 border border-border/40 rounded-xl p-3 text-center flex flex-col items-center justify-center group/count hover:bg-muted/40 transition-colors">
                                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5 whitespace-nowrap group-hover/count:text-foreground transition-colors">Games Played</div>
                                <div className="text-sm font-black text-foreground">{games || 0}</div>
                            </div>
                            <div className="bg-muted/20 border border-border/40 rounded-xl p-3 text-center flex flex-col items-center justify-center group/count hover:bg-muted/40 transition-colors">
                                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5 whitespace-nowrap group-hover/count:text-foreground transition-colors">Practices Logged</div>
                                <div className="text-sm font-black text-foreground">{practices || 0}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pro Upgrade */}
                {!isPro && showProgress && (pendingPayment?.status === 'approved_pending_payment' || pendingPayment?.status === 'pending') && (
                    <div className="space-y-3">
                        {pendingPayment?.status === 'approved_pending_payment' ? (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUpgradeCheckout();
                                }}
                                disabled={isCheckingOut}
                                className="w-full py-3 bg-emerald-500 border border-emerald-400 text-emerald-950 hover:bg-emerald-400 rounded-xl font-black uppercase tracking-tight text-xs shadow-lg shadow-emerald-500/20"
                            >
                                {isCheckingOut ? "Loading Checkout..." : "Complete Pro Upgrade ($300/mo)"}
                            </Button>
                        ) : (
                            <div className="w-full py-3 bg-muted border border-border text-muted-foreground rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase italic">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Approval
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Info */}
                <div className="flex justify-between items-end border-t border-border/30 pt-4">
                    <div className="flex flex-col gap-1.5">
                        {credits !== undefined && credits > 0 && (
                            <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 backdrop-blur-sm w-fit uppercase tracking-tighter">
                                {credits} Hybrid Credits
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] font-bold text-foreground/50 tracking-widest uppercase leading-none mb-1">
                                Season {seasonLabel}
                            </div>
                            <div className="text-[8px] font-mono text-muted-foreground/30 font-black tracking-[0.2em] uppercase">
                                ID: {gcNumber || 'GC-0000'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
