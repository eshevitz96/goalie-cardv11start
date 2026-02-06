"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, Circle, QrCode, Settings, X, Flower2, Wallet, Share2, Maximize2 } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
    const toast = useToast();
    const maxLessons = 4; // Standard package size
    // Calculate Training Progress (Lessons)
    const trainingProgress = (lesson / maxLessons) * 100;

    const [showQR, setShowQR] = useState(false);
    const [showWalletPreview, setShowWalletPreview] = useState(false);

    // Date-based fallback if no specific schedule progress provided
    const dateBasedSeasonProgress = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const start = new Date(currentYear, 8, 1).getTime(); // Sept 1
        const end = new Date(currentYear + 1, 3, 30).getTime(); // April 30
        const effectiveStart = now.getMonth() < 5 ? new Date(currentYear - 1, 8, 1).getTime() : start;
        const effectiveEnd = now.getMonth() < 5 ? new Date(currentYear, 3, 30).getTime() : end;
        const total = effectiveEnd - effectiveStart;
        const current = now.getTime() - effectiveStart;
        return Math.max(0, Math.min(100, (current / total) * 100));
    };

    const finalSeasonProgress = seasonProgress ?? dateBasedSeasonProgress();

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={twMerge(
                    "relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl transition-colors min-h-[400px]", // Added min-h to prevent cramping
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
                                <Shield size={36} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-0.5">
                                    {isPro ? "Pro Profile" : "Goalie Profile"}
                                    {gradYear && (
                                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-bold border border-border">
                                            {gradYear} YOB
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
                            {/* Always show QR Code as requested */}
                            {/* Always show QR Code as requested */}
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
                            {/* Always show unless explicitly hidden or if it's strictly a Pro view that doesn't track training */}
                            {/* The user wants BOTH if possible. So we show both. */}
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
                                    <div className="h-4 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${trainingProgress}%` }}
                                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                            className="h-full bg-primary shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 2. SEASON PROGRESS (Compact View) */}
                            <div className="space-y-1 pt-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                    <span>Season Timeline</span>
                                    <span>{Math.round(finalSeasonProgress)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${finalSeasonProgress}%` }}
                                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                                        className="h-full bg-zinc-500/50"
                                    />
                                </div>
                            </div>

                            {/* Renewal Logic (Only for Youth) */}
                            {!isPro && (
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
                    )}
                </div>

                {/* Bottom ID and Season */}
                <div className="absolute bottom-3 right-5 text-[10px] font-mono text-muted-foreground/40 font-semibold tracking-widest text-right pointer-events-none">

                    <div>SEASON {(() => {
                        // Dynamic Season Year Calculation
                        const date = new Date();
                        const year = date.getFullYear();
                        // Season turnover ~July 1st (after Stanley Cup)
                        // If month is < 6 (Jan-June), we are in the season causing year-1
                        const startYear = date.getMonth() < 6 ? year - 1 : year;
                        return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
                    })()}</div>
                </div>
            </motion.div>

            {/* QR CODE MODAL - Apple Wallet Style */}
            <Modal isOpen={showQR} onClose={() => setShowQR(false)} size="sm" className="bg-transparent shadow-none border-none p-0 overflow-visible">
                <div className="bg-card w-full rounded-[32px] overflow-hidden shadow-2xl border border-border relative">
                    {/* Card Header */}
                    <div className="bg-gradient-to-br from-zinc-800 to-black p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg border border-white/10">
                                <Shield size={24} className="text-white" />
                            </div>
                            <h3 className="text-white font-black text-xl tracking-tight">GOALIE CARD</h3>
                            <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mt-1">Official Digital ID</p>
                        </div>
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/50 hover:text-white transition-colors z-50 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* QR Section */}
                    <div className="bg-white p-8 flex flex-col items-center gap-6">
                        <div className="relative w-48 h-48">
                            {/* QR API */}
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://goaliecard.app/share/${id}&color=000000&bgcolor=ffffff`}
                                alt="Goalie Card QR"
                                className="w-full h-full object-contain mix-blend-multiply"
                            />
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                Scan to Add to Wallet
                            </p>
                            <p className="text-zinc-900 font-medium text-xs max-w-[200px] mx-auto leading-relaxed">
                                This dynamic pass updates automatically with your new teams & stats.
                            </p>
                        </div>

                        {/* Wallet Button Simulation */}
                        <Button
                            onClick={() => setShowWalletPreview(true)}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg active:scale-95 duration-200"
                        >
                            <Wallet size={18} />
                            <span>Preview Wallet Pass</span>
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* APPLE WALLET PREVIEW MODAL */}
            <Modal isOpen={showWalletPreview} onClose={() => setShowWalletPreview(false)} size="sm" className="bg-transparent shadow-none border-none p-0 overflow-visible">
                <div className="relative w-full max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Wallet Pass UI - Mimics PKPass */}
                    <div className="bg-[#1c1c1e] w-full rounded-[14px] overflow-hidden text-white shadow-2xl border border-white/10 relative">
                        {/* Header Strip */}
                        <div className="bg-[#2c2c2e] p-4 flex justify-between items-center relative">
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setShowWalletPreview(true)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors h-auto w-auto">
                                    <Maximize2 size={12} className="text-white/70" />
                                </Button>
                                <span className="font-bold tracking-tight">Goalie Card</span>
                            </div>
                            <Button variant="ghost" onClick={() => setShowWalletPreview(false)} className="bg-white/10 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors z-50 cursor-pointer relative h-auto w-auto p-0 hover:bg-white/20"><X size={12} /></Button>
                        </div>

                        {/* Pass Body */}
                        <div className="p-5 space-y-6">
                            {/* Primary Field */}
                            <div>
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Athlete</div>
                                <div className="text-2xl font-bold font-mono tracking-tight">{name}</div>
                            </div>

                            {/* Secondary Fields */}
                            <div className="flex justify-between">
                                <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Team</div>
                                    <div className="text-sm font-semibold">{team || "Unattached"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Status</div>
                                    <div className="text-sm font-semibold text-green-400">Active</div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <div>
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">Session</div>
                                    <div className="text-sm font-semibold">{session > 0 ? session : 'PRO'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-zinc-400 font-semibold uppercase">ID</div>
                                    <div className="text-sm font-mono text-zinc-300">{id?.slice(0, 8).toUpperCase() || 'DEMO-01'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Barcode Area */}
                        <div className="bg-white p-4 flex flex-col items-center justify-center gap-2 mt-4">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PKPass:${id}&color=000000`}
                                className="w-32 h-32 object-contain"
                            />
                            <div className="text-black font-mono text-[10px]">{id}</div>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-white/50 text-xs mb-4">This is how your card appears in Apple Wallet.</p>
                        <Button onClick={() => toast.success("Pass Signed & Downloaded!")} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-500 transition-all w-full">
                            Add to Wallet
                        </Button>
                    </div>

                </div>
            </Modal>
        </>
    );
}
