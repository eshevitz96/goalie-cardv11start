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
    name: string;
    session: number;
    lesson: number;
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
    pendingPayment
}: GoalieCardProps) {
    const maxLessons = 4; // Standard package size
    // Calculate Training Progress (Lessons)
    const trainingProgress = (lesson / maxLessons) * 100;

    const [showQR, setShowQR] = useState(false);
    const [showWalletPreview, setShowWalletPreview] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Use logic hook
    const { seasonProgress: calculatedSeasonProgress, seasonLabel } = useSeasonTimeline();
    const finalSeasonProgress = seasonProgress ?? calculatedSeasonProgress;

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
                    "relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl transition-colors min-h-[400px]",
                    className
                )}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="h-[4.5rem] w-[4.5rem] flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0">
                                <GoalieGuardLogo size={36} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-0.5">
                                    {isPro ? "Pro Profile" : "Goalie Profile"}
                                    {gradYear && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-bold border border-border uppercase">
                                            {gradYear} Grad Year
                                        </span>
                                    )}
                                </h2>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight leading-none mb-1.5 line-clamp-1">
                                    {name}
                                </h1>

                                <div className="space-y-0.5">
                                    {team && (
                                        <div className="text-sm font-semibold text-foreground line-clamp-1">
                                            {team}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQR(true)}
                                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground group relative border border-transparent hover:border-border h-auto w-auto"
                                title="View Wallet ID"
                            >
                                <QrCode size={18} />
                            </Button>
                        </div>
                    </div>

                    {showProgress && (
                        <div className="space-y-4">

                            {/* 1. TRAINING PROGRESS (Youth/Default) */}
                            {!isPro && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                Training Status
                                            </div>
                                            <div className="text-xl font-mono font-bold text-foreground">
                                                Session {session} • Lesson {lesson}
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-primary">{lesson} / {maxLessons}</span>
                                    </div>
                                    <ProgressBar
                                        value={trainingProgress}
                                        height="h-4"
                                        showGlow={true}
                                        delay={0.2}
                                    />
                                </div>
                            )}

                            {/* 2. SEASON PROGRESS (Compact View) */}
                            <div className="space-y-1 pt-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    <span>Season Timeline</span>
                                    <span>{Math.round(finalSeasonProgress)}%</span>
                                </div>
                                <ProgressBar
                                    value={finalSeasonProgress}
                                    height="h-1.5"
                                    barClassName="bg-muted-foreground/50"
                                    delay={0.4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Base Tier Up-Sell / Progress Logic */}
                    {!isPro && showProgress && (
                        <div className="space-y-4">
                            {lesson >= maxLessons ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="w-full mt-2 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl font-black text-amber-500 flex items-center justify-center gap-2 uppercase tracking-wide text-sm">
                                        <span className="flex items-center gap-2">
                                            <span>⚠️</span> Session Complete
                                        </span>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                                    <span>Keep grinding!</span>
                                    <span>{maxLessons - lesson} lessons to go</span>
                                </div>
                            )}

                            {pendingPayment?.status === 'approved_pending_payment' ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleUpgradeCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full mt-4 py-3 bg-emerald-500 border border-emerald-400 text-emerald-950 hover:bg-emerald-400 rounded-xl font-black transition-colors flex items-center justify-center gap-2 text-sm z-20 pointer-events-auto shadow-lg shadow-emerald-500/20 shadow-emerald-500/20 disabled:opacity-50"
                                >
                                    {isCheckingOut ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" /> Loading Checkout...</span> : "Complete Pro Upgrade ($300/mo)"}
                                </motion.button>
                            ) : pendingPayment?.status === 'pending' ? (
                                <div className="w-full mt-4 py-3 bg-muted border border-border text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2 text-sm z-20">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Coach Request Pending</span>
                                </div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowRequestModal(true)}
                                    className="w-full mt-4 py-3 bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm z-20 pointer-events-auto"
                                >
                                    Request Pro Coach
                                </motion.button>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom ID and Season */}
                <div className="absolute bottom-3 right-5 flex flex-col items-end gap-1.5 pointer-events-none">
                    {credits !== undefined && (
                        <div className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                            {credits} Hybrid Lesson{credits !== 1 && 's'} Remaining
                        </div>
                    )}
                    <div className="text-[10px] font-mono text-muted-foreground/40 font-semibold tracking-widest text-right">
                        SEASON {seasonLabel}
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
                data={{ name, team, session, id }}
            />

            {/* Coach Request Modal (Only for Base Tier) */}
            {!isPro && (
                <CoachRequestModal
                    isOpen={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    rosterId={id || ''}
                    goalieName={name}
                />
            )}
        </>
    );
}
