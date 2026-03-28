"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, Shield, TrendingUp, Info, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GoalieIndexBriefingProps {
    isOpen: boolean;
    onClose: () => void;
    score: number;
    sport: string;
}

export function GoalieIndexBriefing({ isOpen, onClose, score, sport }: GoalieIndexBriefingProps) {
    const ranks = [
        { label: "Developing", range: "0-65", color: "text-white/40" },
        { label: "Competitive", range: "66-79", color: "text-blue-400" },
        { label: "Elite", range: "80-89", color: "text-emerald-400" },
        { label: "D1 Prospects", range: "90-97", color: "text-purple-400" },
        { label: "The Zero-Set", range: "98-99", color: "text-orange-400" },
    ];

    const currentRank = score >= 98 ? "The Zero-Set" : score >= 90 ? "D1 Prospects" : score >= 80 ? "Elite" : score >= 66 ? "Competitive" : "Developing";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-3xl"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-xl bg-card border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden"
                    >
                        {/* Subtle Math Background */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none select-none">
                            <span className="text-9xl font-black italic">INDEX_V11</span>
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">The Goalie Index</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">V11 Power-Law Saturation Algorithm</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-muted-foreground transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Score Display */}
                            <div className="flex items-end justify-between border-b border-white/5 pb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Multiplier</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-7xl font-black tracking-tighter text-foreground">{score}</span>
                                        <span className={`text-xs font-black uppercase tracking-widest ${ranks.find(r => r.label === currentRank)?.color}`}>
                                            {currentRank} Status
                                        </span>
                                    </div>
                                </div>
                                <Activity size={32} className="text-primary/20" />
                            </div>

                            {/* Algorithm Briefing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                        <TrendingUp size={12} /> The Difficulty Curve
                                    </div>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                        V11 transitions from linear scoring to <span className="text-foreground">Power-Law Saturation</span>. 
                                        Getting from 90 to 95 is mathematically 4x more difficult than from 70 to 75. 
                                        This ensures 'Elite' status is reserved for the top 0.1% of performers.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                        <Shield size={12} /> Foundation Data
                                    </div>
                                    <ul className="text-[10px] font-medium text-muted-foreground space-y-2 opacity-80">
                                        <li className="flex items-center gap-2">• Weighted SV% (Difficulty Adjusted)</li>
                                        <li className="flex items-center gap-2">• Historical Discipline (Journal consistency)</li>
                                        <li className="flex items-center gap-2">• Peak Performance Volatility</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Ranking Hierarchy */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Elite Benchmarks</p>
                                <div className="space-y-2">
                                    {ranks.map((rank) => (
                                        <div key={rank.label} className="grid grid-cols-[1fr_auto] items-center gap-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${rank.color} ${rank.label === currentRank ? 'opacity-100 scale-105 origin-left' : 'opacity-40'}`}>
                                                {rank.label}
                                            </span>
                                            <span className="text-[10px] font-mono text-white/20 whitespace-nowrap">
                                                {rank.range} PTS
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <Button onClick={onClose} className="w-full py-6 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:scale-[1.02] transition-all">
                                Acknowledge Rating Context
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
