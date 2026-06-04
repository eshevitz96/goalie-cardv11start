"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, Plus, Calendar, ToggleLeft, Loader2, LogOut, Edit2 } from "lucide-react";
import { PerformanceAvatar } from "@/components/ui/PerformanceAvatar";

export default function ProfilePage() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState({ savePct: "—", saves: "—", games: "—" });
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);
    const [performanceScore, setPerformanceScore] = useState(0);

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

                if (uid === '00000000-0000-0000-0000-000000000000') {
                    setUserData({
                        initials: "DV",
                        fullName: "Dev User",
                        gcNumber: "GC-0000",
                        positionClub: "Goalie | Lacrosse",
                        height: "6'0\"",
                        grad_year: "2026",
                        handedness: "Right",
                        primarySport: "Lacrosse",
                        team: "Local Devs"
                    });
                    setStats({
                        savePct: "92.4%",
                        saves: "152",
                        games: "12"
                    });
                    setSubscriptionData({
                        payment_status: 'paid',
                        plan: 'Goalie Card Private Training',
                        status: 'Active'
                    });
                    setLoading(false);
                    return;
                }

                // 1. Fetch user identity (select specific columns to prevent column-level security RLS errors)
                const { data: userRes, error: userErr } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, gc_number, primary_sport, teams, grad_year, handedness, profile_tags, height, gpa')
                    .eq('auth_user_id', uid)
                    .single();

                if (userErr) {
                    console.error("Profile page users SELECT query error:", userErr);
                }

                // Fetch latest Performance Index score safely (handling empty/no-snapshot result)
                try {
                    const { data: latestSnapshot } = await supabase
                        .from('performance_index_snapshots')
                        .select('score')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    setPerformanceScore(latestSnapshot?.score ?? 0);
                } catch (e) {
                    console.warn("Failed to fetch performance baseline snapshots:", e);
                    setPerformanceScore(0);
                }
                
                let initials = "GC";
                let fullName = "Goalie";
                let gcNumber = "GC-XXXX";
                let positionClub = "Goalie";
                let height = "—";
                let grad_year = "—";
                let handedness = "—";
                let gpaVal = "—";
                let profileTags: string[] = [];
                
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

                    let sport = userRes.primary_sport || "Lacrosse";
                    if (sport === 'lacrosse_mens') sport = "Men's Lacrosse";
                    else if (sport === 'lacrosse_womens') sport = "Women's Lacrosse";
                    else if (sport.includes('_')) {
                        sport = sport.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    } else {
                        sport = sport.charAt(0).toUpperCase() + sport.slice(1);
                    }

                    const teamsArray = userRes.teams || [];
                    const teamName = teamsArray.length > 0 ? teamsArray[0] : "";
                    positionClub = teamName ? `${sport} · ${teamName}` : sport;

                    if (userRes.grad_year) grad_year = userRes.grad_year;
                    if (userRes.handedness) {
                        handedness = userRes.handedness.charAt(0).toUpperCase() + userRes.handedness.slice(1);
                    }
                    if (userRes.profile_tags) profileTags = userRes.profile_tags;
                    if (userRes.height) height = userRes.height;
                    if (userRes.gpa) gpaVal = userRes.gpa;
                }
                
                setUserData({ initials, fullName, gcNumber, positionClub, height, grad_year, handedness, profileTags, gpa: gpaVal });

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

                // 3. Fetch private_training_submissions to verify payment status and subscription existence
                let userEmail = auth.userEmail;
                if (uid === '00000000-0000-0000-0000-000000000000') {
                    // For dev bypass, simulate paid subscription
                    setSubscriptionData({
                        payment_status: 'paid',
                        plan: 'Goalie Card Private Training',
                        status: 'Active'
                    });
                } else if (userEmail) {
                    const { data: sub } = await supabase
                        .from('private_training_submissions')
                        .select('payment_status, status')
                        .eq('email', userEmail.toLowerCase())
                        .eq('payment_status', 'paid')
                        .limit(1)
                        .maybeSingle();

                    if (sub) {
                        setSubscriptionData({
                            payment_status: sub.payment_status,
                            plan: 'Goalie Card Private Training',
                            status: sub.status === 'canceled' ? 'Cancelled' : 'Active'
                        });
                    } else {
                        setSubscriptionData(null);
                    }
                } else {
                    setSubscriptionData(null);
                }

            } catch (err) {
                console.error("Profile fetch error:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [auth.userId, auth.userEmail]);

    const handleManageSubscription = async () => {
        setPortalLoading(true);
        setPortalError(null);
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setPortalError(data.error || "Failed to load billing portal.");
            }
        } catch (err) {
            console.error("Portal redirect error:", err);
            setPortalError("An unexpected error occurred. Please try again.");
        } finally {
            setPortalLoading(false);
        }
    };

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
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40 mb-1">{userData?.gcNumber}</p>
                            <div className="flex items-center gap-2">
                                <p className="m-0 text-2xl font-bold tracking-tight">{userData?.fullName}</p>
                                <Link href="/onboarding?edit=true" className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" title="Edit Profile">
                                    <Edit2 size={16} />
                                </Link>
                            </div>
                            <p className="m-0 text-sm font-medium text-white/60 mt-1">{userData?.positionClub}</p>
                        </div>
                        <PerformanceAvatar score={performanceScore} size={56}>
                            <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg bg-[#006747] text-white shadow-xl shrink-0">
                                {userData?.initials}
                            </div>
                        </PerformanceAvatar>
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
                            <p className="m-0 text-sm font-bold mt-1">{userData?.grad_year}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">GPA</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.gpa}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-white/40">Stick</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.handedness}</p>
                        </div>
                    </div>

                    {/* Custom Tags Section */}
                    {userData?.profileTags && userData.profileTags.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
                            <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">Custom Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {userData.profileTags.map((tag: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/90"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
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
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
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

                {/* Public Connections Placeholder */}
                <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
                    <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">Public Connections</p>
                    <div className="rounded-[24px] p-4 bg-black/20 border border-white/5 flex flex-col gap-2">
                        <p className="m-0 text-sm font-bold text-white/90">Goalie Connections</p>
                        <p className="m-0 text-xs text-white/40 leading-relaxed font-medium">
                            Connect with other goalies, share cards, and build your network. (Coming Soon)
                        </p>
                    </div>
                </div>

                {/* Membership Card */}
                {subscriptionData && (
                    <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-3">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 font-bold">Membership</p>
                                <p className="m-0 text-sm font-bold tracking-tight">{subscriptionData.plan}</p>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 ${
                                subscriptionData.status === 'Active' 
                                    ? 'bg-[#006747] text-white shadow-lg' 
                                    : 'bg-white/10 text-white/60'
                            }`}>
                                {subscriptionData.status}
                            </span>
                        </div>
                        
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {portalLoading ? (
                                <Loader2 className="animate-spin text-white/30" size={16} />
                            ) : (
                                "Manage subscription"
                            )}
                        </button>
                        
                        {portalError && (
                            <p className="text-red-500 text-[11px] font-semibold mt-2 text-center">{portalError}</p>
                        )}
                    </div>
                )}

                {/* Log Out Button */}
                <button
                    onClick={() => auth.logout()}
                    className="w-full mt-6 py-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <LogOut size={16} />
                    Log Out
                </button>

            </div>
        </div>
    );
}
