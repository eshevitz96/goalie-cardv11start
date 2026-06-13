"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, Calendar, Video, Target, ArrowRight } from "lucide-react";
import { isPastSeniorSeason } from "@/utils/role-logic";
import { GoalieCard } from "@/components/GoalieCard";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { v11Engine } from "@/lib/v11-engine";
import { useSeasonTimeline } from "@/hooks/useSeasonTimeline";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { twMerge } from "tailwind-merge";

function normalizeSportDisplay(rawSport: string | null | undefined): string | null {
    if (!rawSport) return null;
    const sport = rawSport.toLowerCase();
    if (sport === 'lacrosse_mens') return "Men's Lacrosse";
    if (sport === 'lacrosse_womens') return "Women's Lacrosse";
    if (sport === 'soccer_mens') return "Men's Soccer";
    if (sport === 'soccer_womens') return "Women's Soccer";
    if (sport.includes('_')) {
        return sport.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return rawSport.charAt(0).toUpperCase() + rawSport.slice(1);
}

export default function Dashboard() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [rosterData, setRosterData] = useState<any>(null);
    const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
    const [gamesCount, setGamesCount] = useState(0);
    const [practicesCount, setPracticesCount] = useState(0);
    const [seasonName, setSeasonName] = useState("SEASON NOT SET");
    const [greeting, setGreeting] = useState("");
    const [trainingPb, setTrainingPb] = useState<number | null>(null);
    const [subline, setSubline] = useState("Show up to the work.");
    const [hasWeeklyIntention, setHasWeeklyIntention] = useState(false);
    const [actionCard, setActionCard] = useState({
        headline: "Set your intention for the week.",
        subline: "Show up to the work today.",
        btnText: "Begin",
        navHref: "/calendar/week"
    });
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(true);
    const [performanceScore, setPerformanceScore] = useState<number | string>(0);
    const [isPro, setIsPro] = useState(false);
    const [credits, setCredits] = useState(0);
    const [showProgress, setShowProgress] = useState(true);
    const { seasonLabel: hookSeasonLabel } = useSeasonTimeline(userData?.sport || rosterData?.sport || null);

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
                const uid = auth.userId;

                if (uid === '00000000-0000-0000-0000-000000000000') {
                    setUserData({
                        initials: "DV",
                        fullName: "Dev User",
                        publicUserId: "00000000-0000-0000-0000-000000000000",
                        gcNumber: "GC-0001"
                    });
                    setRosterData({
                        id: "00000000-0000-0000-0000-000000000000",
                        goalie_name: "Dev User",
                        team: "Arizona Coyotes",
                        grad_year: 2024,
                        height: "6-2",
                        weight: "205",
                        catch_hand: "Left",
                        sport: "Hockey",
                        session_count: 5,
                        lesson_count: 2
                    });
                    setGreeting("Good afternoon, Dev.");
                    setSubline("Local development mode bypass active.");
                    setGamesCount(24);
                    setPracticesCount(112);
                    setSeasonName("DEV SEASON");
                    setActiveDays(new Set([0, 2])); // Monday and Wednesday active
                    setHasWeeklyIntention(true);
                    setActionCard({
                        headline: "Maintain high hands and explode on bounce shots.",
                        subline: "Tap to adjust.",
                        btnText: "Adjust Focus",
                        navHref: "/calendar/week"
                    });
                    setIsPro(true);
                    setCredits(3);
                    setPerformanceScore(82);
                    
                    const localPb = localStorage.getItem('dev_training_pb');
                    setTrainingPb(localPb ? parseInt(localPb, 10) : null);
                    
                    setLoading(false);
                    return;
                }

                // 1. Fetch user identity from public.users using auth_user_id
                const { data: userRes, error: userErr } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, gc_number, onboarding_completed, onboarding_completed_at, created_at, teams, handedness, primary_sport')
                    .eq('auth_user_id', uid)
                    .single();
                
                let initials = "GC";
                let fullName = "Goalie";
                let firstName = "Goalie";
                let publicUserId = null;
                let onboardingCompletedAt: string | null = null;
                let userCreatedAt: string | null = null;
                let onboarded = true;
                let teams: string[] | null = null;
                let handedness: string | null = null;
                let gcNumber = "GC-0000";
                let sport = null;
                
                if (userRes && !userErr) {
                    publicUserId = userRes.id;
                    const f = userRes.first_name || "";
                    const l = userRes.last_name || "";
                    initials = ((f.charAt(0) || "") + (l.charAt(0) || "")).toUpperCase() || "GC";
                    fullName = userRes.display_name || `${f} ${l}`.trim() || "Goalie";
                    firstName = userRes.first_name || userRes.display_name || "Goalie";
                    onboardingCompletedAt = userRes.onboarding_completed_at || null;
                    userCreatedAt = userRes.created_at || null;
                    onboarded = userRes.onboarding_completed !== false; // False means incomplete
                    teams = userRes.teams || null;
                    handedness = userRes.handedness || null;
                    sport = normalizeSportDisplay(userRes.primary_sport);
                    if (userRes.gc_number) {
                        gcNumber = 'GC-' + String(userRes.gc_number).padStart(4, '0');
                    }
                }
                setUserData({ initials, fullName, publicUserId, teams, handedness, gcNumber, sport });
                setIsOnboardingCompleted(onboarded);

                // 2. Fetch roster upload details using linked_user_id (matches auth.users.id)
                const { data: rosterRes } = await supabase
                    .from('roster_uploads')
                    .select('*')
                    .eq('linked_user_id', uid)
                    .maybeSingle();

                let isProVal = false;
                let creditsVal = 0;
                let practicesVal = 0;
                let gamesVal = 0;

                if (rosterRes) {
                    setRosterData(rosterRes);
                    const grad = rosterRes.grad_year;
                    const isPastSenior = grad ? isPastSeniorSeason(grad) : false;
                    isProVal = isPastSenior || !!(rosterRes.team && (rosterRes.team.toLowerCase().includes('blue') || rosterRes.team.toLowerCase().includes('pro')));
                    
                    // Fetch and sum credit balance
                    const { data: creditsData } = await supabase
                        .from('credit_transactions')
                        .select('amount')
                        .eq('roster_id', rosterRes.id);
                    if (creditsData) {
                        creditsVal = creditsData.reduce((sum, c) => sum + (c.amount || 0), 0);
                    }

                    // Fetch logged practices count from sessions
                    const { count: sessionsCount, error: sessionsErr } = await supabase
                        .from('sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('roster_id', rosterRes.id);
                    const loggedSessionsCount = (!sessionsErr && sessionsCount !== null) ? sessionsCount : 0;
                    practicesVal = Math.max(Number(rosterRes.practice_count) || 0, loggedSessionsCount);

                    // Base games count
                    gamesVal = Number(rosterRes.games_count) || 0;
                }

                setIsPro(isProVal);
                setCredits(creditsVal);
                setPracticesCount(practicesVal);

                // 3. Fetch latest Performance Index score (from performance_index_snapshots)
                try {
                    if (publicUserId) {
                        const { data: latestSnapshot } = await supabase
                            .from('performance_index_snapshots')
                            .select('score_after')
                            .eq('user_id', publicUserId)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                        
                        if (latestSnapshot && latestSnapshot.score_after > 0) {
                            setPerformanceScore(latestSnapshot.score_after);
                        } else {
                            setPerformanceScore("Baseline Pending");
                        }
                    } else {
                        setPerformanceScore("Baseline Pending");
                    }
                } catch (e) {
                    console.warn("Failed to fetch performance baseline snapshots:", e);
                    setPerformanceScore("Baseline Pending");
                }

                // Compute time-based greeting (client-side local time)
                const hour = new Date().getHours();
                let greetingText = "";
                if (hour >= 5 && hour < 12) greetingText = `Good morning, ${firstName}.`;
                else if (hour >= 12 && hour < 17) greetingText = `Good afternoon, ${firstName}.`;
                else if (hour >= 17 && hour < 21) greetingText = `Good evening, ${firstName}.`;
                else greetingText = `Late night, ${firstName}.`;
                setGreeting(greetingText);

                // 4. Fetch complete game sessions count
                let completedGamesCount = 0;
                if (publicUserId) {
                    const { count: gameSessionsCount, error: countErr } = await supabase
                        .from('game_sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', publicUserId);
                    
                    if (!countErr && gameSessionsCount !== null) {
                        completedGamesCount = gameSessionsCount;
                    }
                }
                setGamesCount(Math.max(gamesVal, completedGamesCount));

                // 5. Weekly Intention, Pre-warmups, Post-events, and Pulse logic
                if (publicUserId || rosterRes?.id) {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    
                    const mon = new Date(now);
                    mon.setDate(now.getDate() - daysSinceMon);
                    mon.setHours(0,0,0,0);
                    const monStr = mon.toISOString().split("T")[0];
                    
                    const nextMon = new Date(mon);
                    nextMon.setDate(mon.getDate() + 7);
                    const nextMonStr = nextMon.toISOString().split("T")[0];

                    const todayStr = now.toISOString().split("T")[0];

                    const targetUserId = publicUserId || rosterRes?.id;

                    // Fetch weekly intention for current week
                    const { data: intentionRes } = await supabase
                        .from('weekly_intentions')
                        .select('intention_text')
                        .eq('user_id', targetUserId)
                        .eq('week_start_date', monStr)
                        .maybeSingle();

                    const weeklyIntentionText = intentionRes?.intention_text || null;
                    setHasWeeklyIntention(!!weeklyIntentionText);

                    // Fetch daily sessions for this week
                    const { data: weekSessions } = await supabase
                        .from('daily_sessions')
                        .select('id, session_date')
                        .eq('user_id', uid)
                        .gte('session_date', monStr)
                        .lt('session_date', nextMonStr);

                    const sessionMap = new Map<string, string>();
                    const sessionIds: string[] = [];
                    (weekSessions || []).forEach(s => {
                        sessionMap.set(s.id, s.session_date);
                        sessionIds.push(s.id);
                    });

                    let active = new Set<number>();
                    let todayHasPrep = false;
                    let todayHasDebrief = false;

                    if (sessionIds.length > 0) {
                        const { data: prewarmups } = await supabase
                            .from('daily_prewarmup_entries')
                            .select('session_id')
                            .in('session_id', sessionIds);

                        const { data: postevents } = await supabase
                            .from('daily_post_event_entries')
                            .select('session_id')
                            .in('session_id', sessionIds);

                        (prewarmups || []).forEach(pw => {
                            const dateStr = sessionMap.get(pw.session_id);
                            if (dateStr) {
                                const d = new Date(dateStr + "T00:00:00");
                                let dayIdx = d.getDay() - 1;
                                if (dayIdx === -1) dayIdx = 6;
                                active.add(dayIdx);
                                if (dateStr === todayStr) todayHasPrep = true;
                            }
                        });

                        (postevents || []).forEach(pe => {
                            const dateStr = sessionMap.get(pe.session_id);
                            if (dateStr) {
                                const d = new Date(dateStr + "T00:00:00");
                                let dayIdx = d.getDay() - 1;
                                if (dayIdx === -1) dayIdx = 6;
                                active.add(dayIdx);
                                if (dateStr === todayStr) todayHasDebrief = true;
                            }
                        });
                    }
                    setActiveDays(active);

                    // Fetch today's scheduled games
                    let todayGames: any[] = [];
                    if (publicUserId) {
                        const { data } = await supabase
                            .from('game_sessions')
                            .select('id, scheduled_time')
                            .eq('user_id', publicUserId)
                            .eq('scheduled_date', todayStr);
                        if (data) todayGames = data;
                    }
 
                    let gameToday = todayGames && todayGames.length > 0;
                    let isPregameWindow = false;

                    if (gameToday && todayGames && todayGames[0]?.scheduled_time) {
                        const gameTimeStr = todayGames[0].scheduled_time;
                        const [gHour, gMin] = gameTimeStr.split(":").map(Number);
                        
                        const gameDateTime = new Date(now);
                        gameDateTime.setHours(gHour, gMin, 0, 0);
                        
                        const diffMs = gameDateTime.getTime() - now.getTime();
                        const diffHours = diffMs / (1000 * 60 * 60);
                        
                        isPregameWindow = diffHours >= -1 && diffHours <= 4;
                    }

                    let headline = "Set your intention for the week.";
                    let subHeadline = "Show up to the work today.";
                    let btnText = "Begin";
                    let navHref = "/calendar/week";

                    if (gameToday) {
                        if (isPregameWindow && !todayHasPrep) {
                            headline = "Game today. Ready to prepare?";
                            subHeadline = "Tune your focus before you step on the field.";
                            btnText = "Prepare";
                            navHref = `/calendar/pregame?date=${todayStr}`;
                        } else if (!todayHasDebrief) {
                            headline = "You played today. Reflect when you're ready.";
                            subHeadline = "Log your post-game debrief.";
                            btnText = "Reflect";
                            navHref = `/calendar/postgame?date=${todayStr}`;
                        } else if (weeklyIntentionText) {
                            headline = weeklyIntentionText;
                            subHeadline = "Tap to adjust.";
                            btnText = "Adjust Focus";
                            navHref = "/calendar/week";
                        }
                    } else if (weeklyIntentionText) {
                        headline = weeklyIntentionText;
                        subHeadline = "Tap to adjust.";
                        btnText = "Adjust Focus";
                        navHref = "/calendar/week";
                    }

                    setActionCard({ headline, subline: subHeadline, btnText, navHref });
                    
                    let computedSubline = "Show up to the work.";
                    if (weeklyIntentionText) {
                        computedSubline = "Intention active. Make it stick.";
                    } else {
                        computedSubline = "Set the tone for this week.";
                    }
                    setSubline(computedSubline);
                }

                // 6. Fetch Active Season
                let activeSeason = "SEASON NOT SET";
                const targetSeasonUserId = publicUserId || uid;
                if (targetSeasonUserId) {
                    const { data: sData } = await supabase
                        .from('seasons')
                        .select('name')
                        .eq('user_id', targetSeasonUserId)
                        .eq('is_active', true)
                        .maybeSingle();
                    
                    if (sData?.name) {
                        activeSeason = sData.name.toUpperCase();
                    } else {
                        const { data: sDataAuth } = await supabase
                            .from('seasons')
                            .select('name')
                            .eq('user_id', uid)
                            .eq('is_active', true)
                            .maybeSingle();
                        if (sDataAuth?.name) {
                            activeSeason = sDataAuth.name.toUpperCase();
                        }
                    }
                }
                setSeasonName(activeSeason);

                // 7. Fetch Reflex PB score
                const { data: scoreRes } = await supabase
                    .from('training_game_scores')
                    .select('score')
                    .eq('user_id', uid)
                    .eq('game_type', 'training')
                    .order('score', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                setTrainingPb(scoreRes ? scoreRes.score : null);

            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [auth.userId]);

    if (auth.loading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-foreground">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    const dayOfWeekStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dateStrShort = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
 
    return (
        <div 
            className="text-foreground font-sans flex flex-col justify-start w-full min-h-screen pb-[calc(120px+env(safe-area-inset-bottom))]"
            style={{ background: '#09090B', padding: '32px 24px 140px 24px' }}
        >
            {/* Section 1: Simplified Minimal Header */}
            <div className="max-w-xl md:max-w-[860px] mx-auto mb-6 w-full">
                <div className="flex items-center justify-between px-2 border-b border-white/5 pb-4">
                    <div className="flex flex-col">
                        <p className="m-0 text-lg font-bold tracking-tight text-white/90">
                            {dayOfWeekStr}, {dateStrShort}
                        </p>
                        <p className="m-0 text-[9px] font-black uppercase tracking-[0.15em] text-[#006747] mt-1 leading-none">
                            {(!seasonName || seasonName === "SEASON NOT SET") 
                                ? `Season ${hookSeasonLabel}` 
                                : (seasonName.toUpperCase().startsWith("SEASON") ? seasonName.toUpperCase() : `Season ${seasonName.toUpperCase()}`)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BrandLogo textClassName="text-lg md:text-xl font-medium tracking-tight text-white/90 select-none pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Profile Setup Banner */}
            {!isOnboardingCompleted && (
                <div className="max-w-xl md:max-w-[860px] mx-auto mb-6 w-full px-2">
                    <div className="bg-[#006747]/10 border border-[#006747]/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="m-0 text-sm font-bold text-[#f4f4f5] truncate">Complete your goalie profile</p>
                            <p className="m-0 text-xs text-white/40 mt-1 line-clamp-2">Set up your birthday, username, teams, and tags to unlock your full Goalie Card.</p>
                        </div>
                        <Link href="/onboarding" className="bg-[#006747] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#006747]/80 active:scale-95 transition-all whitespace-nowrap">
                            Complete Setup
                        </Link>
                    </div>
                </div>
            )}

            {/* Main responsive card-first layout */}
            <div className="max-w-xl md:max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
                
                {/* Left Column (or Top on Mobile): Athlete Card */}
                <div className="col-span-1 md:col-span-5 w-full flex flex-col items-center">
                    <GoalieCard
                        name={rosterData?.goalie_name || userData?.fullName}
                        team={rosterData?.team || (userData?.teams && userData.teams[0]) || "Unattached"}
                        gradYear={rosterData?.grad_year}
                        height={rosterData?.height || rosterData?.raw_data?.height}
                        weight={rosterData?.weight || rosterData?.raw_data?.weight}
                        catchHand={rosterData?.catch_hand || userData?.handedness}
                        showProgress={showProgress}
                        credits={credits}
                        session={rosterData?.session_count || 0}
                        lesson={rosterData?.lesson_count || 0}
                        games={gamesCount}
                        practices={practicesCount}
                        sport={userData?.sport || rosterData?.sport || null}
                        id={rosterData?.id}
                        isPro={isPro}
                        performanceScore={performanceScore}
                        initials={userData?.initials}
                        gcNumber={userData?.gcNumber}
                        className="w-full"
                    />
                    
                    {/* Toggle counts button */}
                    <button 
                        onClick={() => setShowProgress(!showProgress)}
                        className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors group cursor-pointer"
                    >
                        <div className={`w-1.5 h-1.5 rounded-full border transition-colors ${showProgress ? 'bg-[#006747] border-[#006747]' : 'border-muted-foreground'}`} />
                        <span>{showProgress ? 'Hide' : 'Show'} Activity Counts</span>
                    </button>
                </div>

                {/* Right Column (or Bottom on Mobile): Greeting + Actions + Tiles + Pulse */}
                <div className="col-span-1 md:col-span-7 flex flex-col gap-6 w-full">
                    
                    {/* Context-Aware Greeting */}
                    <div className="px-2">
                        <p className="m-0 text-3xl font-bold tracking-tight text-[#f4f4f5]">{greeting}</p>
                        <p className="m-0 text-sm text-white/40 mt-1">{subline}</p>
                    </div>

                    {/* Today's Action Card */}
                    <Link href={actionCard.navHref} className="flex flex-col justify-between transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                        <div 
                            className="flex flex-col justify-between p-6 h-48"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,103,71,0.12), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }}></div>
                            
                            <div className="relative z-10">
                                <p className="m-0 mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-white/35">Today</p>
                                <p className="m-0 mb-1.5 text-xl font-bold tracking-tight leading-tight text-[#f4f4f5]">{actionCard.headline}</p>
                                <p className="m-0 text-xs text-white/40 font-medium leading-relaxed">
                                    {actionCard.subline}
                                </p>
                            </div>
                            <div className="relative z-10">
                                <span className="bg-white text-[#09090B] rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2">
                                    <ArrowRight size={12} />
                                    {actionCard.btnText}
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Module Tiles Grid (3-Column) */}
                    <div className="grid grid-cols-3 gap-3">
                        <Link 
                            href="/calendar" 
                            className="flex flex-col items-center justify-center p-4 bg-[#1C1C1E] border border-white/5 transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl"
                        >
                            <Calendar size={24} className="text-white mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Calendar</p>
                            <p className="m-0 text-[9px] text-white/35 mt-1">This week</p>
                        </Link>
                        <Link 
                            href="/film" 
                            className="flex flex-col items-center justify-center p-4 bg-[#1C1C1E] border border-white/5 transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl"
                        >
                            <Video size={24} className="text-white mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Film</p>
                            <p className="m-0 text-[9px] text-white/35 mt-1">{gamesCount > 0 ? `${gamesCount} games` : 'No games'}</p>
                        </Link>
                        <Link 
                            href="/training" 
                            className="flex flex-col items-center justify-center p-4 bg-[#1C1C1E] border border-white/5 transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl"
                        >
                            <Target size={24} className="text-white mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Training</p>
                            <p className="m-0 text-[9px] text-white/35 mt-1">
                                {trainingPb !== null ? `PB: ${trainingPb}` : 'No runs'}
                            </p>
                        </Link>
                    </div>

                    {/* Weekly Pulse */}
                    <div 
                        className="p-4 bg-[#1C1C1E] border border-white/5 rounded-2xl flex justify-between items-center"
                    >
                        <div className="flex gap-2 justify-between w-full px-1">
                            {dayLetters.map((dayLetter, dayIdx) => {
                                const isActive = activeDays.has(dayIdx);
                                const isToday = dayIdx === todayIndex;
                                
                                return (
                                    <div 
                                        key={dayIdx} 
                                        className={twMerge(
                                            "w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-md",
                                            isToday
                                                ? "bg-emerald-400 text-neutral-950 ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-[#1C1C1E] scale-110"
                                                : isActive
                                                    ? "bg-[#006747] text-white"
                                                    : "bg-white/5 text-white/30 border border-white/5"
                                        )}
                                    >
                                        {dayLetter}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
