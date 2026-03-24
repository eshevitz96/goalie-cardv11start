"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { GameAnalysisSurface } from '@/components/goalie/GameAnalysisSurface';
import { TrendingUp, Users, Target, Activity, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface SquadMember {
    id: string;
    athlete_name: string;
    sport?: string;
}

interface SquadIntelProps {
    teamId: string;
    members: SquadMember[];
}

import { useSquadIntel } from '@/hooks/useSquadIntel';

export function SquadIntelligence({ teamId, members }: SquadIntelProps) {
    const resolveSport = (s?: string): any => {
        if (!s) return 'hockey';
        const lower = s.toLowerCase();
        if (lower.includes('lacrosse')) return 'lacrosse-boys';
        if (lower.includes('soccer')) return 'soccer';
        return lower;
    };

    const teamSport = resolveSport(members[0]?.sport);
    const { 
        shots, 
        stats, 
        compareStats,
        isLoading, 
        selectedGoalieIds, 
        toggleGoalie 
    } = useSquadIntel(members);

    const { saves, goals, total, savePct } = stats;
    const [view, setView] = useState<'net' | 'field'>('net');
    const [compareMode, setCompareMode] = useState(false);

    // Auto-enable compare mode if 2 are selected, or let user toggle
    const isComparing = compareMode && selectedGoalieIds.length === 2;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-6">
                
                {/* 1. MASTER HEADER & TOGGLES */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 pb-4 relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black tracking-tighter flex items-center gap-3">
                                <Target className="text-primary" size={20} /> Squad Intelligence 
                                {isComparing && <span className="bg-primary/20 text-primary text-[10px] px-2 py-1 rounded-lg">Crease Battle Active</span>}
                            </h3>
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest mt-1 opacity-70">
                                {selectedGoalieIds.length > 0 
                                    ? `Filtered for ${selectedGoalieIds.length} athletes` 
                                    : `Aggregated performance across ${members.length} athletes`}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Compare Mode Toggle */}
                            <button 
                                onClick={() => setCompareMode(!compareMode)}
                                className={twMerge(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border",
                                    compareMode ? "bg-indigo-500 border-indigo-500 text-white" : "bg-black/40 border-white/10 text-zinc-400"
                                )}
                            >
                                <Users size={14} /> Side-by-Side Mode
                            </button>

                            <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                                <button 
                                    onClick={() => setView('net')}
                                    className={twMerge("px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all", view === 'net' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
                                >Net View</button>
                                <button 
                                    onClick={() => setView('field')}
                                    className={twMerge("px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all", view === 'field' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
                                >Shot Origin</button>
                            </div>
                        </div>
                    </div>

                    {/* Goalie Switcher Chips */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-4 scrollbar-hide z-10 relative">
                        <button 
                            onClick={() => toggleGoalie(null)}
                            className={twMerge("whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", selectedGoalieIds.length === 0 ? "bg-primary border-primary text-black" : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/30")}
                        >Full Squad Baseline</button>
                        {members.map(m => (
                            <button 
                                key={m.id}
                                onClick={() => toggleGoalie(m.id)}
                                className={twMerge(
                                    "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border", 
                                    selectedGoalieIds.includes(m.id) ? "bg-white border-white text-black" : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/30"
                                )}
                            >{m.athlete_name}</button>
                        ))}
                    </div>
                </div>

                {/* 2. ANALYTICS SURFACE (SPLIT OR SINGLE) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* VISUALS (Heatmaps) */}
                    <div className={twMerge("lg:col-span-3 transition-all duration-500", isComparing ? "lg:col-span-4" : "")}>
                        {isComparing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {compareStats.map(goalie => (
                                    <div key={goalie.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-sm font-black uppercase tracking-widest italic">{goalie.name}</h4>
                                            <div className="text-lg font-black text-primary italic">{goalie.stats.savePct.toFixed(1)}%</div>
                                        </div>
                                        <div className="relative aspect-square w-full">
                                            <GameAnalysisSurface 
                                                sport={resolveSport(goalie.shots[0]?.sport || members.find(m => m.id === goalie.id)?.sport)}
                                                shots={goalie.shots}
                                                interactive={false}
                                                view={view}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group h-full">
                                <div className="relative aspect-square md:aspect-video w-full max-h-[450px]">
                                    <GameAnalysisSurface 
                                        sport={teamSport} 
                                        shots={shots}
                                        interactive={false}
                                        view={view}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI CARDS (Only show if not in full-screen comparison) */}
                    {!isComparing && (
                        <div className="lg:col-span-1 border border-white/10 bg-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp size={48} />
                            </div>
                            
                            <div>
                                <div className="text-[10px] font-black text-primary tracking-[0.2em] mb-4">Selection Save %</div>
                                <div className="text-7xl font-black tracking-tighter text-white leading-none">
                                    {savePct.toFixed(1)}<span className="text-2xl text-primary">%</span>
                                </div>
                            </div>
                            
                            <div className="flex-1" />

                            <div className="mt-8">
                                <button className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black tracking-widest hover:bg-white text-black transition-all group/btn">
                                    Export Tactical PDF <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* 3. PERFORMANCE TRENDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active Velocity</div>
                        <div className="text-lg font-black italic">High Energy</div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Crease Utilization</div>
                        <div className="text-lg font-black italic">88% Capacity</div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Health</div>
                        <div className="text-lg font-black italic text-emerald-500">Peak Signal</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
