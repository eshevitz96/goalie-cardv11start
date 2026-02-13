"use client";

import { motion } from "framer-motion";
import { CheckCircle, QrCode } from "lucide-react";
import { GoalieGuardLogo } from "@/components/ui/GoalieGuardLogo";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useSeasonTimeline } from "@/hooks/useSeasonTimeline";
import { QRCodeModal } from "@/components/goalie/card/QRCodeModal";
import { WalletPreviewModal } from "@/components/goalie/card/WalletPreviewModal";

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
    isPro?: boolean; // Explicit control
    seasonProgress?: number; // 0-100, schedule based
    showProgress?: boolean; // Display progress bars
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
    showProgress
}: GoalieCardProps) {
    const maxLessons = 4; // Standard package size
    // Calculate Training Progress (Lessons)
    const trainingProgress = (lesson / maxLessons) * 100;

    const [showQR, setShowQR] = useState(false);
    const [showWalletPreview, setShowWalletPreview] = useState(false);

    // Use logic hook
    const { seasonProgress: calculatedSeasonProgress, seasonLabel } = useSeasonTimeline();
    const finalSeasonProgress = seasonProgress ?? calculatedSeasonProgress;

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

                    {/* Renewal Logic (Only for Youth) */}
                    {!isPro && showProgress && (
                        <>
                            {lesson >= maxLessons ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Link
                                        href="/parent/renew"
                                        className="w-full mt-2 py-3 bg-primary rounded-xl font-black text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-wide text-sm relative overflow-hidden group hover:opacity-90 active:scale-[0.98] transition-all"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            Renew Session
                                            <CheckCircle size={16} className="text-primary-foreground/80" />
                                        </span>
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                                    <span>Keep grinding!</span>
                                    <span>{maxLessons - lesson} lessons to go</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Bottom ID and Season */}
                <div className="absolute bottom-3 right-5 text-[10px] font-mono text-muted-foreground/40 font-semibold tracking-widest text-right pointer-events-none">
                    <div>SEASON {seasonLabel}</div>
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
        </>
    );
}
