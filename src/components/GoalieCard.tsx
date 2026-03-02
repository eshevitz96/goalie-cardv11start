"use client";

import { motion } from "framer-motion";
import { CheckCircle, QrCode } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { useState } from "react";
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
    pureIcon
}: GoalieCardProps) {
    const safeSession = session ?? 0;
    const safeLesson = lesson ?? 0;
    const safeName = name ?? "";

    // Dynamic package size: rounds up to nearest block of 4 (4, 8, 12, etc.)
    const maxLessons = safeLesson <= 4 ? 4 : Math.ceil(safeLesson / 4) * 4;
    const trainingProgress = Math.min(100, (safeLesson / maxLessons) * 100);

    const [showQR, setShowQR] = useState(false);
    const [showWalletPreview, setShowWalletPreview] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Use logic hook
    const { seasonProgress: calculatedSeasonProgress, seasonLabel } = useSeasonTimeline(sport);
    const finalSeasonProgress = seasonProgress ?? calculatedSeasonProgress;

    if (pureIcon) {
        return (
            <div className={twMerge("flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0 shadow-inner", className)}>
                <GoalieGuardLogo size={className?.includes('w-12') ? 24 : 36} />
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
                    "relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl transition-colors min-h-[440px] flex flex-col",
                    className
                )}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl opacity-50" />

                {/* Identity Section (Top) */}
                <div className="relative z-10 flex items-center gap-4 mb-4">
                    <div className="h-[4.5rem] w-[4.5rem] flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0 shadow-inner">
                        <GoalieGuardLogo size={36} />
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
                            {/* Training Progress (Only for active lessons) */}
                            {((credits !== undefined && credits > 0) || (safeLesson > 0)) && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end px-1">
                                        <div>
                                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5 opacity-50">
                                                Training Status
                                            </div>
                                            <div className="text-lg font-mono font-black text-foreground flex items-baseline gap-1.5">
                                                <span className="text-primary tracking-tighter">S{safeSession}</span>
                                                <span className="text-muted-foreground/20">•</span>
                                                <span className="tracking-tighter">L{safeLesson}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-primary italic tracking-tight leading-none">{safeLesson}/{maxLessons}</span>
                                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Lessons</span>
                                        </div>
                                    </div>
                                    <ProgressBar
                                        value={trainingProgress}
                                        height="h-2.5"
                                        showGlow={true}
                                        delay={0.2}
                                        className="rounded-full overflow-hidden border border-foreground/5 shadow-inner"
                                    />
                                </div>
                            )}

                            {/* Season Progress */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">
                                    <span>Season Timeline</span>
                                    <span className="text-foreground/40">{Math.round(finalSeasonProgress)}%</span>
                                </div>
                                <ProgressBar
                                    value={finalSeasonProgress}
                                    height="h-2"
                                    barClassName="bg-muted-foreground/60"
                                    delay={0.4}
                                    className="rounded-full overflow-hidden bg-muted/20"
                                />
                            </div>
                        </div>
                    )}

                    {/* 2. CTA / Up-Sell Section (Only for non-pro) */}
                    {!isPro && showProgress && (
                        <div className="space-y-4">
                            {safeLesson >= maxLessons ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl font-black text-amber-500 flex items-center justify-center gap-2 uppercase tracking-wide text-xs">
                                        <span>⚠️</span> Session Complete
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-tighter px-1">
                                    <span>Keep grinding!</span>
                                    <span>{maxLessons - safeLesson} to go</span>
                                </div>
                            )}

                            {pendingPayment?.status === 'approved_pending_payment' ? (
                                <Button
                                    onClick={handleUpgradeCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full py-3 bg-emerald-500 border border-emerald-400 text-emerald-950 hover:bg-emerald-400 rounded-xl font-black uppercase tracking-tight text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    {isCheckingOut ? "Loading Checkout..." : "Complete Pro Upgrade ($300/mo)"}
                                </Button>
                            ) : pendingPayment?.status === 'pending' ? (
                                <div className="w-full py-3 bg-muted border border-border text-muted-foreground rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase italic">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Approval
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setShowRequestModal(true)}
                                    className="w-full py-3.5 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-foreground/5"
                                >
                                    Request Pro Coach
                                </Button>
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
                data={{ name: safeName, team, session: safeSession, id: id || "DEMO" }}
            />

            {!isPro && (
                <CoachRequestModal
                    isOpen={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    rosterId={id || ''}
                    goalieName={safeName}
                />
            )}
        </>
    );
}
