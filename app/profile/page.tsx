"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, ToggleLeft, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState({ savePct: "—", saves: "—", games: "—" });

    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated) {
            router.push('/login');
        }
    }, [auth.loading, auth.isAuthenticated, router]);

    useEffect(() => {
        if (!auth.userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const uid = auth.userId; // auth.uid()

                // 1. Fetch user identity (select specific columns to prevent column-level security RLS errors)
                const { data: userRes, error: userErr } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, gc_number, primary_sport, team, height, grad_year, handedness, catch_hand')
                    .eq('auth_user_id', uid)
                    .single();
                
                let initials = "GC";
                let fullName = "Goalie";
                let gcNumber = "GC-XXXX";
                let positionClub = "Goalie";
                let height = "—";
                let gradYear = "—";
                let handedness = "—";
                
                if (userRes && !userErr) {
                    const f = userRes.first_name || "";
                    const l = userRes.last_name || "";
                    initials = ((f.charAt(0) || "") + (l.charAt(0) || "")).toUpperCase() || "GC";
                    fullName = userRes.display_name || `${f} ${l}`.trim() || "Goalie";
                    
                    if (userRes.gc_number) {
                        gcNumber = 'GC-' + String(userRes.gc_number).padStart(4, '0');
                    } else if (userRes.id) {
                        gcNumber = 'GC-' + userRes.id.substring(0, 4).toUpperCase();
                    }

                    const sport = userRes.primary_sport || "Lacrosse";
                    const team = userRes.team || "";
                    positionClub = team ? `${sport} · ${team}` : sport;

                    if (userRes.height) height = userRes.height;
                    if (userRes.grad_year) gradYear = userRes.grad_year;
                    if (userRes.catch_hand) handedness = userRes.catch_hand;
                }
                
                setUserData({ initials, fullName, gcNumber, positionClub, height, gradYear, handedness });

                // 2. Fetch game sessions for stats
                const { data: gamesRes } = await supabase
                    .from('game_sessions')
                    .select('saves, shots_faced')
                    .eq('user_id', uid); // Or public user id? The dashboard used auth.userId. Let's use auth.userId since it works there.

                if (gamesRes && gamesRes.length > 0) {
                    const gamesCount = gamesRes.length;
                    let totalSaves = 0;
                    let totalShots = 0;
                    gamesRes.forEach(g => {
                        totalSaves += (g.saves || 0);
                        totalShots += (g.shots_faced || 0);
                    });

                    let savePct = "—";
                    if (totalShots > 0) {
                        savePct = ((totalSaves / totalShots) * 100).toFixed(1);
                    }

                    setStats({
                        savePct,
                        saves: totalSaves.toString(),
                        games: gamesCount.toString()
                    });
                } else {
                    setStats({ savePct: "0.0", saves: "0", games: "0" });
                }

            } catch (err) {
                console.error("Profile fetch error:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [auth.userId]);

    if (auth.loading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pt-6 pb-20 px-4 md:px-8">
            <div className="max-w-xl mx-auto">
                
                {/* Back Navigation */}
                <Link href="/dashboard" className="flex items-center gap-2 mb-4 px-2 opacity-70 hover:opacity-100 transition-opacity w-fit">
                    <ArrowLeft size={18} />
                    <span className="text-xs font-medium">Back to dashboard</span>
                </Link>

                {/* Identity Card */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40 mb-1">{userData?.gcNumber}</p>
                            <p className="m-0 text-2xl font-bold tracking-tight">{userData?.fullName}</p>
                            <p className="m-0 text-sm font-medium text-white/60 mt-1">{userData?.positionClub}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg bg-[#006747] text-white shadow-xl shrink-0">
                            {userData?.initials}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-[24px] p-4 bg-black/20 border border-white/5">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Save %</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.savePct}</p>
                        </div>
                        <div className="rounded-[24px] p-4 bg-black/20 border border-white/5">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Saves</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.saves}</p>
                        </div>
                        <div className="rounded-[24px] p-4 bg-black/20 border border-white/5">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Games</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.games}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Details Grid */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
                    <p className="m-0 mb-4 text-[10px] font-black uppercase tracking-widest text-white/40">Profile</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">Height</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.height}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">Class</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.gradYear}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">GPA</p>
                            <p className="m-0 text-sm font-bold mt-1">—</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">Stick</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.handedness}</p>
                        </div>
                    </div>
                </div>

                {/* Events & Commitments Placeholder */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
                    <div className="flex items-center justify-between mb-4">
                        <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Events & commitments</p>
                        <Plus size={18} className="text-white/40 cursor-pointer hover:text-white transition-colors" />
                    </div>
                    
                    <div className="flex items-center gap-4 py-3 border-b border-white/10">
                        <Calendar size={22} className="text-white/40 shrink-0" />
                        <div className="flex-1">
                            <p className="m-0 text-sm font-bold">Top 205 Camp</p>
                            <p className="m-0 text-xs text-white/60 mt-0.5">June 14-16 · Registered</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[#006747]/20 text-[#006747] rounded-full shrink-0">
                            Confirmed
                        </span>
                    </div>

                    <div className="flex items-center gap-4 py-3 pt-4">
                        <Calendar size={22} className="text-white/40 shrink-0" />
                        <div className="flex-1">
                            <p className="m-0 text-sm font-bold">Showcase Tournament</p>
                            <p className="m-0 text-xs text-white/60 mt-0.5">July 22-24 · Open</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/10 text-white rounded-full shrink-0">
                            Register
                        </span>
                    </div>
                </div>

                {/* Recruiting Visibility */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm">
                    <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">Recruiting visibility</p>
                    <div className="flex items-center justify-between mb-2">
                        <p className="m-0 text-sm font-bold">Public profile</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Off</span>
                            <ToggleLeft size={24} className="text-white/20" />
                        </div>
                    </div>
                    <p className="m-0 text-xs text-white/40 leading-relaxed font-medium">
                        Turn on to allow verified college coaches to view your profile, save percentage, and approved highlight clips.
                    </p>
                </div>

            </div>
        </div>
    );
}
