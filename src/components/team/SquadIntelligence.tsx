"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { GameAnalysisSurface } from '@/components/goalie/GameAnalysisSurface';
import { TrendingUp, Users, Target, Activity, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface SquadIntelProps {
    teamId: string;
    rosterIds: string[];
}

export function SquadIntelligence({ teamId, rosterIds }: SquadIntelProps) {
    const [shots, setShots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'net' | 'field'>('net');

    useEffect(() => {
        if (rosterIds.length > 0) {
            fetchSquadShots();
        }
    }, [rosterIds]);

    const fetchSquadShots = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shot_events')
                .select('*')
                .in('roster_id', rosterIds);
            
            if (error) throw error;
            setShots(data || []);
        } catch (err) {
            console.error("Squad Intel Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const saves = shots.filter(s => s.result === 'save').length;
    const goals = shots.filter(s => s.result === 'goal').length;
    const total = shots.length;
    const savePct = total > 0 ? (saves / total) * 100 : 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                
                {/* 1. MASTER HEATMAP (THE VISUAL) */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                <Target className="text-primary" size={20} /> Squad Heatmap
                            </h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 opacity-70">
                                Aggregated shot density across {rosterIds.length} athletes
                            </p>
                        </div>
                        <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                            <button 
                                onClick={() => setView('net')}
                                className={twMerge("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", view === 'net' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
                            >Net View</button>
                            <button 
                                onClick={() => setView('field')}
                                className={twMerge("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", view === 'field' ? "bg-white text-black" : "text-zinc-500 hover:text-white")}
                            >Shot Origin</button>
                        </div>
                    </div>

                    <div className="relative aspect-square md:aspect-video w-full max-h-[400px]">
                        <GameAnalysisSurface 
                            sport="lacrosse-boys" // Defaulting for Lambert/User context
                            shots={shots}
                            interactive={false}
                            view={view}
                        />
                    </div>
                </div>

                {/* 2. SQUAD STATS (THE BRAIN) */}
                <div className="w-full md:w-80 space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between h-full relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={48} />
                        </div>
                        
                        <div>
                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Squad Save %</div>
                            <div className="text-7xl font-black italic tracking-tighter text-white leading-none">
                                {savePct.toFixed(1)}<span className="text-2xl text-primary">%</span>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4 leading-relaxed">
                                Performance baseline across all game & practice sessions
                            </p>
                        </div>

                        <div className="space-y-6 mt-12">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Shots</div>
                                    <div className="text-xl font-black italic">{total}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Goals</div>
                                    <div className="text-xl font-black italic text-rose-500">{goals}</div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all group/btn">
                                Download Squad Report <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
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
