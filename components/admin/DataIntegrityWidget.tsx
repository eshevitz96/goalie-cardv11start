"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { AlertTriangle, Database, CheckCircle, ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function DataIntegrityWidget() {
    const [stats, setStats] = useState({
        orphanedShots: 0,
        unlinkedUsers: 0,
        missingRosterIds: 0,
        totalShots: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isFixing, setIsFixing] = useState(false);
    const [repairStatus, setRepairStatus] = useState<string | null>(null);

    const fetchAudit = async () => {
        setIsLoading(true);
        try {
            // 1. Audit Shots
            const { data: shots, error: shotError } = await supabase.from('shot_events').select('id, roster_id');
            if (shotError) throw shotError;

            // 2. Audit Profiles
            const { data: profiles, error: profError } = await supabase.from('profiles').select('id, email, role');
            if (profError) throw profError;

            // 3. Audit Roster
            const { data: roster, error: rostError } = await supabase.from('roster_uploads').select('id, email, linked_user_id');
            if (rostError) throw rostError;

            const rosterProfileMap = new Set(roster.map(r => r.linked_user_id).filter(Boolean));
            const orphanShots = shots.filter(s => !s.roster_id).length;
            const unlinked = profiles.filter(p => p.role === 'goalie' && !rosterProfileMap.has(p.id)).length;

            setStats({
                orphanedShots: orphanShots,
                unlinkedUsers: unlinked,
                missingRosterIds: roster.filter(r => !r.linked_user_id).length,
                totalShots: shots.length
            });
        } catch (err) {
            console.error("Audit Failed:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSmartRepair = async () => {
        setIsFixing(true);
        setRepairStatus("Scanning Digital DNA...");
        
        try {
            // Step 1: Link orphaned shots to rosters by User ID + Sport
            const { data: orphans } = await supabase.from('shot_events').select('*').is('roster_id', null);
            const { data: roster } = await supabase.from('roster_uploads').select('id, linked_user_id, sport');

            if (orphans && roster) {
                let fixedCount = 0;
                for (const shot of orphans) {
                    const match = roster.find(r => 
                        r.linked_user_id === shot.goalie_id && 
                        (r.sport === shot.sport || !shot.sport)
                    );
                    
                    if (match) {
                        const { error } = await supabase.from('shot_events').update({ roster_id: match.id }).eq('id', shot.id);
                        if (!error) fixedCount++;
                    }
                }
                setRepairStatus(`Successfully anchored ${fixedCount} shots to cards!`);
            } else {
                setRepairStatus("No obvious repairs found.");
            }
        } catch (err) {
            setRepairStatus("Repair failed. Check console.");
        } finally {
            setIsFixing(false);
            fetchAudit();
            setTimeout(() => setRepairStatus(null), 5000);
        }
    };

    useEffect(() => {
        fetchAudit();
    }, []);

    const hasIssues = stats.orphanedShots > 0 || stats.unlinkedUsers > 0;

    return (
        <section className="glass rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Database className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase tracking-tighter italic">Digital DNA Audit</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">V11 Integrity Engine</p>
                    </div>
                </div>
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                ) : hasIssues ? (
                    <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle size={12} /> Data Leaks Found
                    </div>
                ) : (
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase flex items-center gap-1.5">
                        <CheckCircle size={12} /> System Solid
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted/40 border border-border rounded-2xl">
                    <div className="text-[10px] text-muted-foreground font-black uppercase mb-1">Orphaned Shots</div>
                    <div className={twMerge("text-2xl font-black italic tracking-tighter", stats.orphanedShots > 0 ? "text-rose-500" : "text-foreground")}>
                        {stats.orphanedShots}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">Shots not anchored to a specific Goalie Card.</p>
                </div>
                <div className="p-4 bg-muted/40 border border-border rounded-2xl">
                    <div className="text-[10px] text-muted-foreground font-black uppercase mb-1">Unlinked Users</div>
                    <div className={twMerge("text-2xl font-black italic tracking-tighter", stats.unlinkedUsers > 0 ? "text-amber-500" : "text-foreground")}>
                        {stats.unlinkedUsers}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 leading-tight">Profiles missing an active Card connection.</p>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    disabled={isLoading || isFixing || !hasIssues}
                    onClick={handleSmartRepair}
                    className={twMerge(
                        "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        hasIssues ? "bg-foreground text-background hover:bg-primary hover:text-white" : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                >
                    {isFixing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Run Smart Repair
                </button>
            </div>

            {repairStatus && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black text-center uppercase tracking-widest animate-in fade-in zoom-in slide-in-from-top-2">
                    {repairStatus}
                </div>
            )}
        </section>
    );
}
