"use client";

import { motion } from "framer-motion";
import { CheckCircle, QrCode, Settings2, Check } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSeasonTimeline } from "@/hooks/useSeasonTimeline";
import { QRCodeModal } from "@/components/goalie/card/QRCodeModal";
import { WalletPreviewModal } from "@/components/goalie/card/WalletPreviewModal";
import { CoachRequestModal } from "@/components/goalie/card/CoachRequestModal";

export interface GoalieCardProps {
    name?: string;
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
}

export function GoalieCard({
    name,
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
    practices
}: GoalieCardProps) {
    const safeName = name ?? "";
    const { theme } = useTheme();

    const [showQR, setShowQR] = useState(false);
    const [showWalletPreview, setShowWalletPreview] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Local override state for custom season dates
    const [isEditingSeason, setIsEditingSeason] = useState(false);
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");

    // Use logic hook
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
                <img 
                    src="/flower-logo.png?v=5" 
                    alt="CIC Logo" 
                    width={className?.includes('w-12') ? 22 : 34} 
                    height={className?.includes('w-12') ? 22 : 34} 
                    draggable={false}
                    className="object-contain pointer-events-none select-none opacity-90 transition-all duration-300"
                    style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                />
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
                    priceId: 'price_1T4QvMGj0SdRYIlhJeSpz3YW', // The Pro Tier $300/mo Price ID
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

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={twMerge(
                    "relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl transition-colors min-h-[500px] flex flex-col",
                    className
                )}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl opacity-50" />

                {/* Identity Section (Top) */}
                <div className="relative z-10 flex items-center gap-4 mb-4">
                    <div className="h-[4.5rem] w-[4.5rem] flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0 shadow-inner">
                        <img 
                            src="/flower-logo.png?v=5" 
                            alt="CIC Logo" 
                            width={34} 
                            height={34} 
                            draggable={false}
                            className="object-contain pointer-events-none select-none opacity-90 transition-all duration-300"
                            style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
                        />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                                {isPro ? "Pro Profile" : "Goalie Profile"}
                            </span>
                            {gradYear && (
                                <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-black border border-border uppercase shrink-0">
                                    {gradYear} Grad
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tighter leading-none mb-1.5 truncate">
                            {safeName}
                        </h1>

                        <div className="space-y-0.5">
                            {team && (
                                <div className="text-sm font-bold text-foreground truncate opacity-90">
                                    {team}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-black uppercase tracking-tighter whitespace-nowrap opacity-60">
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

                {/* Spacer - Pushes the rest to the bottom */}
                <div className="flex-1" />

                {/* Bottom Content Area */}
                <div className="relative z-10 space-y-6">
                    {/* 1. Progress Bars Section */}
                    {showProgress && (
                        <div className="space-y-4">
                            {/* Season Progress */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Season Timeline</span>
                                        <button 
                                            onClick={() => setIsEditingSeason(!isEditingSeason)}
                                            className="text-muted-foreground/40 hover:text-foreground transition-colors"
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
                                
                                {isEditingSeason && (
                                    <div className="flex items-center gap-2 mt-2 bg-foreground/5 p-2 rounded-lg border border-border/10">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 w-full block">1st Practice</label>
                                            <input 
                                                type="date" 
                                                value={customStart}
                                                onChange={(e) => setCustomStart(e.target.value)}
                                                className="w-full bg-transparent text-[10px] font-bold text-foreground outline-none"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1 border-l border-border/20 pl-2">
                                            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 w-full block">Championship</label>
                                            <input 
                                                type="date" 
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                                className="w-full bg-transparent text-[10px] font-bold text-foreground outline-none"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setIsEditingSeason(false)}
                                            className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0 hover:bg-primary/30"
                                        >
                                            <Check size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Additional Volume Counts */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/20 border border-border/40 rounded-xl p-3 text-center flex flex-col items-center justify-center group hover:bg-muted/40 transition-colors">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5 whitespace-nowrap group-hover:text-foreground transition-colors">Games Played</div>
                                    <div className="text-sm font-black text-foreground">{games || 0}</div>
                                </div>
                                <div className="bg-muted/20 border border-border/40 rounded-xl p-3 text-center flex flex-col items-center justify-center group hover:bg-muted/40 transition-colors">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5 whitespace-nowrap group-hover:text-foreground transition-colors">Practices Logged</div>
                                    <div className="text-sm font-black text-foreground">{practices || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. CTA / Up-Sell Section (Only for non-pro) */}
                    {!isPro && showProgress && (pendingPayment?.status === 'approved_pending_payment' || pendingPayment?.status === 'pending') && (
                        <div className="space-y-3">
                            {pendingPayment?.status === 'approved_pending_payment' ? (
                                <Button
                                    onClick={handleUpgradeCheckout}
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

                    {/* 3. Bottom Metadata (ID and Season) */}
                    <div className="flex justify-between items-end border-t border-border/30 pt-4">
                        <div className="flex flex-col gap-1.5">
                            {credits !== undefined && credits > 0 && (
                                <div className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 backdrop-blur-sm w-fit uppercase tracking-tighter">
                                    {credits} Hybrid Credits
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQR(true)}
                                className="p-2 rounded-xl bg-muted/40 hover:bg-muted transition-all text-muted-foreground hover:text-foreground border border-border group h-auto w-auto"
                                title="View Card ID"
                            >
                                <QrCode size={18} className="group-hover:scale-110 transition-transform" />
                            </Button>
                            <div className="flex flex-col items-end">
                                <div className="text-[10px] font-bold text-foreground/50 tracking-widest uppercase leading-none mb-1">
                                    Season {seasonLabel}
                                </div>
                                <div className="text-[8px] font-mono text-muted-foreground/30 font-black tracking-[0.2em] uppercase">
                                    ID: {id?.slice(0, 8) || 'GOALIE-01'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <QRCodeModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                id={id || 'DEMO'}
                onPreviewWallet={() => {
                    setShowQR(false);
                    setShowWalletPreview(true);
                }}
            />

            <WalletPreviewModal
                isOpen={showWalletPreview}
                onClose={() => setShowWalletPreview(false)}
                data={{ name: safeName, team, session: session ?? 0, id: id || "DEMO" }}
            />

            {!isPro && (
                <CoachRequestModal
                    isOpen={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    rosterId={id || ''}
                    goalieName={safeName}
                    goalieSport={sport}
                />
            )}
        </>
    );
}
