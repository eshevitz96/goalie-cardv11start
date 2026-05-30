"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, Shield, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreHistoryChart } from "@/components/goalie/ScoreHistoryChart";
import { performanceService, PerformanceSnapshot } from "@/services/performance";
import { supabase } from "@/utils/supabase/client";

interface GoalieIndexBriefingProps {
    isOpen: boolean;
    onClose: () => void;
    score: number;
    sport: string;
    userId?: string | null;
}

type Tab = "index" | "history";

export function GoalieIndexBriefing({ isOpen, onClose, score, sport, userId }: GoalieIndexBriefingProps) {
    const [activeTab, setActiveTab] = useState<Tab>("index");
    const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const ranks = [
        { label: "Developing",  range: "0-65",  color: "text-white/40" },
        { label: "Competitive", range: "66-79", color: "text-blue-400" },
        { label: "Elite",       range: "80-89", color: "text-emerald-400" },
        { label: "D1 Prospects",range: "90-97", color: "text-purple-400" },
        { label: "The Zero-Set",range: "98-99", color: "text-orange-400" },
    ];

    const currentRank =
        score >= 98 ? "The Zero-Set" :
        score >= 90 ? "D1 Prospects" :
        score >= 80 ? "Elite" :
        score >= 66 ? "Competitive" : "Developing";

    // Fetch snapshot history when History tab is opened
    useEffect(() => {
        if (activeTab === "history" && userId && snapshots.length === 0) {
            setHistoryLoading(true);
            performanceService.fetchSnapshotHistory(supabase, userId, 20).then(data => {
                setSnapshots(data);
                setHistoryLoading(false);
            });
        }
    }, [activeTab, userId]);

    // Reset tab when closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setActiveTab("index"), 300);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-3xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-xl bg-card border border-white/5 rounded-[2.5rem] shadow-3xl relative overflow-hidden flex flex-col max-h-[88vh]"
                    >
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
                            <span className="text-9xl font-black italic">INDEX</span>
                        </div>

                        {/* Header */}
                        <div className="p-8 pb-0">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Target size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">The Goalie Index</h2>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                                            Power-Law Saturation Algorithm
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Score + current rank — always visible */}
                            <div className="flex items-end justify-between border-b border-white/5 pb-6 mb-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        Current Rating
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black tracking-tighter text-foreground">{score}</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${ranks.find(r => r.label === currentRank)?.color}`}>
                                            {currentRank} Status
                                        </span>
                                    </div>
                                </div>
                                <Activity size={32} className="text-primary/20" />
                            </div>

                            {/* Tab strip */}
                            {userId && (
                                <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 mb-6">
                                    {(["index", "history"] as Tab[]).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                activeTab === tab
                                                    ? "bg-foreground text-background"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {tab === "index" ? "Index" : "Score History"}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-8 pb-8">
                            <AnimatePresence mode="wait">
                                {activeTab === "index" ? (
                                    <motion.div
                                        key="index"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-6"
                                    >
                                        {/* Algorithm Briefing */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                                    <TrendingUp size={12} /> The Difficulty Curve
                                                </div>
                                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                                    The Index transitions from linear scoring to{" "}
                                                    <span className="text-foreground">Power-Law Saturation</span>.
                                                    Getting from 90 to 95 is mathematically 4× harder than from 70 to 75.
                                                    This ensures 'Pro' status is reserved for the top 0.1% of performers.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                                    <Shield size={12} /> Foundation Data
                                                </div>
                                                <ul className="text-[10px] font-medium text-muted-foreground space-y-2 opacity-80">
                                                    <li>• Weighted SV% (Difficulty Adjusted)</li>
                                                    <li>• Historical Discipline (Journal consistency)</li>
                                                    <li>• Peak Performance Volatility</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Ranking Hierarchy */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                                                Performance Benchmarks
                                            </p>
                                            <div className="space-y-2">
                                                {ranks.map(rank => (
                                                    <div key={rank.label} className="grid grid-cols-[1fr_auto] items-center gap-4">
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${rank.color} ${rank.label === currentRank ? "opacity-100" : "opacity-40"}`}>
                                                            {rank.label}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-white/20 whitespace-nowrap">
                                                            {rank.range} PTS
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={onClose}
                                            className="w-full py-6 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:scale-[1.02] transition-all"
                                        >
                                            Acknowledge Rating Context
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="history"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {historyLoading ? (
                                            <div className="py-10 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">
                                                Loading history…
                                            </div>
                                        ) : (
                                            <ScoreHistoryChart snapshots={snapshots} />
                                        )}

                                        {/* Legend */}
                                        {!historyLoading && snapshots.length > 0 && (
                                            <div className="flex items-center gap-5 mt-6 pt-4 border-t border-white/[0.05]">
                                                {[
                                                    { color: "#a3e635", label: "Game" },
                                                    { color: "#60a5fa", label: "Protocol" },
                                                    { color: "#f59e0b", label: "Manual" },
                                                ].map(({ color, label }) => (
                                                    <div key={label} className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
