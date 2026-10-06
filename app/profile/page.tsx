"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, Plus, Calendar, ToggleLeft, ToggleRight, Loader2, LogOut, Edit2, MapPin, MessageSquarePlus } from "lucide-react";
import { PerformanceAvatar } from "@/components/ui/PerformanceAvatar";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { usePerformanceRealtime } from "@/hooks/usePerformanceRealtime";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { checkFeedbackEligibility } from "@/app/actions/feedback";

export default function ProfilePage() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState({ savePct: "—", saves: "—", games: "—" });
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);
    const { score: realtimeScore } = usePerformanceRealtime(auth.userId);
    const performanceScore = typeof realtimeScore === 'number' ? realtimeScore : (Number(realtimeScore) || 0);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
    const [isFeedbackEligible, setIsFeedbackEligible] = useState<boolean>(false);

    useEffect(() => {
        if (auth.userId) {
            checkFeedbackEligibility().then(res => {
                setIsFeedbackEligible(res.eligible);
            }).catch(console.error);
        }
    }, [auth.userId]);

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

                // 1. Fetch user identity from profiles
                const { data: userRes, error: userErr } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, display_name, full_name, goalie_name, gc_number, primary_sport, sport, teams, grad_year, handedness, profile_tags, height, gpa')
                    .eq('id', uid)
                    .maybeSingle();

                if (userErr) {
                    console.error("Profile page profiles SELECT query error:", userErr);
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
                
                if (userRes) {
                    const f = userRes.first_name || (userRes.full_name ? userRes.full_name.split(' ')[0] : '') || (userRes.goalie_name ? userRes.goalie_name.split(' ')[0] : '');
                    const l = userRes.last_name || (userRes.full_name ? userRes.full_name.split(' ').slice(1).join(' ') : '') || (userRes.goalie_name ? userRes.goalie_name.split(' ').slice(1).join(' ') : '');
                    initials = ((f.charAt(0) || "") + (l.charAt(0) || "")).toUpperCase() || "GC";
                    fullName = userRes.display_name || userRes.full_name || userRes.goalie_name || `${f} ${l}`.trim() || "Goalie";
                    
                    if (userRes.gc_number) {
                        gcNumber = 'GC-' + String(userRes.gc_number).padStart(4, '0');
                    } else if (userRes.id) {
                        gcNumber = 'GC-' + userRes.id.substring(0, 4).toUpperCase();
                    }

                    let sport = userRes.primary_sport || userRes.sport || "Lacrosse";
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

                    if (userRes.grad_year) grad_year = String(userRes.grad_year);
                    if (userRes.handedness) {
                        handedness = userRes.handedness.charAt(0).toUpperCase() + userRes.handedness.slice(1);
                    }
                    if (userRes.profile_tags) profileTags = userRes.profile_tags;
                    if (userRes.height) height = userRes.height;
                    if (userRes.gpa) gpaVal = userRes.gpa;
                }
                
                setUserData({ initials, fullName, gcNumber, positionClub, height, grad_year, handedness, profileTags, gpa: gpaVal });

                // 2. Fetch game sessions / games for stats
                if (!uid) {
                    setStats({ savePct: "—", saves: "—", games: "—" });
                } else {
                    const { data: gamesRes } = await supabase
                        .from('games')
                        .select('saves, shots_against')
                        .eq('user_id', uid);

                    if (gamesRes && gamesRes.length > 0) {
                        const gamesCount = gamesRes.length;
                        let totalSaves = 0;
                        let totalShots = 0;
                        gamesRes.forEach(g => {
                            totalSaves += (g.saves || 0);
                            totalShots += (g.shots_against || 0);
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

                // 4. Fetch real events & commitments for the athlete
                const todayStr = new Date().toISOString().split('T')[0];
                const { data: userGames } = await supabase
                    .from('games')
                    .select('*')
                    .gte('scheduled_date', todayStr)
                    .order('scheduled_date', { ascending: true })
                    .limit(4);

                if (userGames && userGames.length > 0) {
                    setUpcomingEvents(userGames);
                } else {
                    const { data: recentGames } = await supabase
                        .from('games')
                        .select('*')
                        .order('scheduled_date', { ascending: false })
                        .limit(3);
                    setUpcomingEvents(recentGames || []);
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
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col pb-[calc(100px+env(safe-area-inset-bottom))] md:pb-12 font-sans">
            {/* Top Navigation & Header - Mirrors App Shell */}
            <header className="sticky top-0 z-[1100] w-full bg-background border-b border-border h-auto md:h-20">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-16 flex flex-col md:flex-row justify-between items-center h-full py-3 md:py-0 gap-3 md:gap-0">
                    {/* Left Group: Breadcrumbs & Navigation */}
                    <div className="flex items-center justify-between md:justify-start gap-4 md:gap-12 w-full md:w-auto h-full">
                        <Link 
                            href="/dashboard"
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[0.95rem] font-medium transition-colors font-sans tracking-tight"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                            Dashboard
                        </Link>

                        <div className="flex items-center gap-2 md:gap-4 text-xl md:text-2xl">
                            <Link 
                                href="/dashboard"
                                className="text-foreground tracking-tight font-sans font-bold text-[1.25rem] md:text-[1.4rem] hover:text-foreground/80 transition-colors"
                            >
                                Goalie Card
                            </Link>
                            
                            <span className="text-muted-foreground/30 font-light hidden md:inline">
                                /
                            </span>
                            
                            <span className="text-muted-foreground font-medium tracking-tight font-sans text-[1.3rem] md:text-[1.5rem] hidden md:inline">
                                Profile
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-[1600px] mx-auto px-4 py-6 md:px-16 md:py-8 flex-1 flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                    {/* Left Column (Identity, Profile, Membership, Logout) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
                        {/* Identity Card */}
                <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">{userData?.gcNumber}</p>
                            <div className="flex items-center gap-2">
                                <p className="m-0 text-2xl font-bold tracking-tight">{userData?.fullName}</p>
                                <Link href="/onboarding?edit=true" className="p-1 hover:bg-muted-foreground/20 rounded-lg transition-colors text-muted-foreground/80 hover:text-foreground" title="Edit Profile">
                                    <Edit2 size={16} />
                                </Link>
                            </div>
                            <p className="m-0 text-sm font-medium text-muted-foreground/80 mt-1">{userData?.positionClub}</p>
                        </div>
                        <PerformanceAvatar score={performanceScore} size={56}>
                            <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg bg-[#00E676] text-black shadow-xl shrink-0">
                                {userData?.initials}
                            </div>
                        </PerformanceAvatar>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-[24px] p-4 bg-muted border border-border">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Save %</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.savePct}</p>
                        </div>
                        <div className="rounded-[24px] p-4 bg-muted border border-border">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saves</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.saves}</p>
                        </div>
                        <div className="rounded-[24px] p-4 bg-muted border border-border">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Games</p>
                            <p className="m-0 text-xl font-bold mt-2">{stats.games}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Details Grid */}
                <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                    <p className="m-0 mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Height</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.height}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Class</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.grad_year}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-muted-foreground">GPA</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.gpa}</p>
                        </div>
                        <div>
                            <p className="m-0 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Stick</p>
                            <p className="m-0 text-sm font-bold mt-1">{userData?.handedness}</p>
                        </div>
                    </div>

                    {/* Custom Tags Section */}
                    {userData?.profileTags && userData.profileTags.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                            <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {userData.profileTags.map((tag: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-muted border border-border rounded-full text-xs font-semibold text-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                
                        {/* Membership Card */}
                {subscriptionData && (
                    <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="m-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 font-bold">Membership</p>
                                <p className="m-0 text-sm font-bold tracking-tight">{subscriptionData.plan}</p>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 ${
                                subscriptionData.status === 'Active' 
                                    ? 'bg-[#00E676] text-black shadow-lg' 
                                    : 'bg-muted-foreground/20 text-muted-foreground/80'
                            }`}>
                                {subscriptionData.status}
                            </span>
                        </div>
                        
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="w-full py-4 bg-muted hover:bg-muted-foreground/20 disabled:opacity-50 text-foreground border border-border rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {portalLoading ? (
                                <Loader2 className="animate-spin text-muted-foreground" size={16} />
                            ) : (
                                "Manage subscription"
                            )}
                        </button>
                        
                        {portalError && (
                            <p className="text-red-500 text-[11px] font-semibold mt-2 text-center">{portalError}</p>
                        )}
                    </div>
                )}

                {/* Take the Tour Button */}
                <Link
                    href="/dashboard"
                    onClick={() => {
                        localStorage.removeItem('tour_completed');
                    }}
                    className="w-full mt-4 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground border border-border rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center"
                >
                    Take the tour
                </Link>

                {/* Feedback Button for Eligible Private Clients */}
                {isFeedbackEligible && (
                    <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="w-full mt-3 py-3 bg-secondary/60 hover:bg-secondary text-foreground border border-border rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center cursor-pointer"
                    >
                        <MessageSquarePlus size={16} />
                        Feedback
                    </button>
                )}

                {/* Log Out Button */}
                <button
                    onClick={() => auth.logout()}
                    className="w-full mt-3 py-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-[24px] text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
                    </div>

                    {/* Right Column (Events, Visibility, Connections) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
                        {/* Events & Commitments */}
                        <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                            <div className="flex items-center justify-between mb-4">
                                <p className="m-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Events & commitments</p>
                                <Link href="/calendar" className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Open Full Calendar">
                                    <Plus size={18} />
                                </Link>
                            </div>
                            
                            {upcomingEvents.length === 0 ? (
                                <div className="py-6 text-center">
                                    <Calendar size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                                    <p className="text-xs font-bold text-foreground m-0">No upcoming events scheduled</p>
                                    <p className="text-[11px] text-muted-foreground m-0 mt-0.5">Add games, tournaments, or camps to your schedule.</p>
                                    <Link 
                                        href="/calendar" 
                                        className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-2 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold rounded-xl transition-colors"
                                    >
                                        <Plus size={13} />
                                        <span>Add to Calendar</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {upcomingEvents.map((evt, idx) => {
                                        const isTraining = evt.game_type === 'training';
                                        const isPractice = evt.game_type === 'practice';
                                        const evtDate = evt.scheduled_date ? new Date(evt.scheduled_date + 'T00:00:00') : null;
                                        const dateFormatted = evtDate ? evtDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Scheduled";

                                        return (
                                            <div key={evt.id || idx} className="flex items-center justify-between gap-3 py-3 border-b border-border/50 last:border-0">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="p-2.5 rounded-xl bg-muted text-muted-foreground shrink-0">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="m-0 text-sm font-bold text-foreground truncate">{evt.opponent || evt.title || "Scheduled Event"}</p>
                                                        <p className="m-0 text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                                            <span>{dateFormatted}</span>
                                                            {evt.location && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-0.5 truncate">
                                                                        <MapPin size={10} className="text-[#00E676] shrink-0" />
                                                                        {evt.location}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
                                                    isTraining
                                                        ? 'bg-amber-400 text-black font-black'
                                                        : isPractice
                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black'
                                                            : 'bg-rose-500 text-white font-black'
                                                }`}>
                                                    {isTraining ? 'Training' : isPractice ? 'Practice' : 'Game'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recruiting Visibility */}
                        <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                            <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recruiting visibility</p>
                            <div className="flex items-center justify-between mb-2">
                                <p className="m-0 text-sm font-bold">Public profile</p>
                                <button
                                    type="button"
                                    onClick={() => setIsPublicProfile(prev => !prev)}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isPublicProfile ? 'text-[#00E676]' : 'text-muted-foreground'}`}>
                                        {isPublicProfile ? 'On' : 'Off'}
                                    </span>
                                    {isPublicProfile ? (
                                        <ToggleRight size={26} className="text-[#00E676] transition-colors" />
                                    ) : (
                                        <ToggleLeft size={26} className="text-muted-foreground/50 transition-colors" />
                                    )}
                                </button>
                            </div>
                            <p className="m-0 text-xs text-muted-foreground leading-relaxed font-medium">
                                Turn on to allow verified college coaches to view your profile, save percentage, and approved highlight clips.
                            </p>
                        </div>

                        {/* Public Connections */}
                        <div className="rounded-[32px] p-6 bg-card border border-border shadow-sm mb-3">
                            <p className="m-0 mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Public Connections</p>
                            <div className="rounded-[24px] p-4 bg-muted border border-border flex flex-col gap-2">
                                <p className="m-0 text-sm font-bold text-foreground">Goalie Network</p>
                                <p className="m-0 text-xs text-muted-foreground leading-relaxed font-medium">
                                    Connect with other goalies, share cards, and build your recruiting network.
                                </p>
                            </div>
                        </div>

                
                    </div>
                </div>
            </main>
            <MobileBottomNav />

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </div>
    );
}
