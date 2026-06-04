"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, Calendar, Video, Target, ArrowRight, User } from "lucide-react";
import { PerformanceAvatar } from "@/components/ui/PerformanceAvatar";

export default function Dashboard() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
    const [gamesCount, setGamesCount] = useState(0);
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
                const uid = auth.userId;

                if (uid === '00000000-0000-0000-0000-000000000000') {
                    setUserData({
                        initials: "DV",
                        fullName: "Dev User",
                        publicUserId: "00000000-0000-0000-0000-000000000000"
                    });
                    setGreeting("Good afternoon, Dev.");
                    setSubline("Local development mode bypass active.");
                    setGamesCount(1);
                    setSeasonName("DEV SEASON");
                    setActiveDays(new Set([0, 2])); // Monday and Wednesday active
                    setHasWeeklyIntention(true);
                    setActionCard({
                        headline: "Maintain high hands and explode on bounce shots.",
                        subline: "Tap to adjust.",
                        btnText: "Adjust Focus",
                        navHref: "/calendar/week"
                    });
                    
                    const localPb = localStorage.getItem('dev_training_pb');
                    setTrainingPb(localPb ? parseInt(localPb, 10) : null);
                    
                    setLoading(false);
                    return;
                }

                // 1. Fetch user identity
                const { data: userRes, error: userErr } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, onboarding_completed, onboarding_completed_at, created_at')
                    .eq('auth_user_id', uid)
                    .single();
                
                let initials = "GC";
                let fullName = "Goalie";
                let firstName = "Goalie";
                let publicUserId = null;
                let onboardingCompletedAt: string | null = null;
                let userCreatedAt: string | null = null;
                let onboarded = true;
                
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
                }
                setUserData({ initials, fullName, publicUserId });
                setIsOnboardingCompleted(onboarded);

                // Fetch latest Performance Index score safely (handling empty result)
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

                // Compute time-based greeting (client-side local time)
                const hour = new Date().getHours();
                let greetingText = "";
                if (hour >= 5 && hour < 12) greetingText = `Good morning, ${firstName}.`;
                else if (hour >= 12 && hour < 17) greetingText = `Good afternoon, ${firstName}.`;
                else if (hour >= 17 && hour < 21) greetingText = `Good evening, ${firstName}.`;
                else greetingText = `Late night, ${firstName}.`;
                setGreeting(greetingText);

                // 2. Game sessions count
                if (publicUserId) {
                    const { count, error: countErr } = await supabase
                        .from('game_sessions')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', auth.userId); // original code used auth.userId
                    
                    if (!countErr && count !== null) {
                        setGamesCount(count);
                    }
                }

                // 3. Weekly Intention, Pre-warmups, Post-events, and Pulse logic
                if (publicUserId) {
                    const now = new Date();
                    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon
                    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    
                    const mon = new Date(now);
                    mon.setDate(now.getDate() - daysSinceMon);
                    mon.setHours(0,0,0,0);
                    const monStr = mon.toISOString().split("T")[0];
                    
                    const nextMon = new Date(mon);
                    nextMon.setDate(mon.getDate() + 7);
                    const nextMonStr = nextMon.toISOString().split("T")[0];

                    const todayStr = now.toISOString().split("T")[0];

                    // Fetch weekly intention for current week
                    const { data: intentionRes } = await supabase
                        .from('weekly_intentions')
                        .select('intention_text')
                        .eq('user_id', publicUserId)
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

                    const sessionMap = new Map<string, string>(); // session_id -> session_date
                    const sessionIds: string[] = [];
                    (weekSessions || []).forEach(s => {
                        sessionMap.set(s.id, s.session_date);
                        sessionIds.push(s.id);
                    });

                    // Fetch prewarmups and post-events for these session IDs to populate the weekly pulse
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
                    const { data: todayGames } = await supabase
                        .from('game_sessions')
                        .select('id, scheduled_time')
                        .eq('user_id', uid)
                        .eq('scheduled_date', todayStr);

                    let gameToday = todayGames && todayGames.length > 0;
                    let isPregameWindow = false;

                    if (gameToday && todayGames && todayGames[0]?.scheduled_time) {
                        const gameTimeStr = todayGames[0].scheduled_time; // HH:MM:SS
                        const [gHour, gMin] = gameTimeStr.split(":").map(Number);
                        
                        const gameDateTime = new Date(now);
                        gameDateTime.setHours(gHour, gMin, 0, 0);
                        
                        // Within 4 hours before the game
                        const diffMs = gameDateTime.getTime() - now.getTime();
                        const diffHours = diffMs / (1000 * 60 * 60);
                        
                        isPregameWindow = diffHours >= -1 && diffHours <= 4; // Allow prep starting 4 hours prior up to 1 hour post-start
                    }

                    // Today's Action Card properties calculation
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

                // 4. Fetch Active Season
                let activeSeason = "SEASON NOT SET";
                if (publicUserId) {
                    const { data: sData } = await supabase
                        .from('seasons')
                        .select('name')
                        .eq('user_id', publicUserId)
                        .eq('is_active', true)
                        .maybeSingle();
                    
                    if (sData?.name) {
                        activeSeason = sData.name.toUpperCase();
                    } else {
                        // Fallback check by auth user UUID
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

                // 5. Fetch Reflex personal best score
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
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <Loader2 className="animate-spin text-white/30" size={32} />
            </div>
        );
    }

    const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div 
            className="text-foreground font-sans flex flex-col justify-start w-full"
            style={{ minHeight: '100vh', background: '#09090B', padding: '32px 40px' }}
        >
            {/* Section 1: Context Strip */}
            <div className="max-w-xl md:max-w-[860px] mx-auto mb-6 w-full">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-[#006747] text-white shadow-xl">
                            {userData?.initials}
                        </div>
                        <div>
                            <p className="m-0 text-lg font-bold tracking-tight">{todayDateStr}</p>
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mt-0.5">{seasonName}</p>
                        </div>
                    </div>
                    <Link href="/profile" className="transition-transform hover:scale-105 active:scale-95">
                        <PerformanceAvatar score={performanceScore} size={48}>
                            <div className="w-full h-full bg-white/5 border border-white/10 flex items-center justify-center rounded-full text-white shadow-lg">
                                <User size={20} className="text-white" />
                            </div>
                        </PerformanceAvatar>
                    </Link>
                </div>
            </div>

            {/* Complete Profile Banner */}
            {!isOnboardingCompleted && (
                <div className="max-w-xl md:max-w-[860px] mx-auto mb-6 w-full px-2">
                    <div className="bg-[#006747]/10 border border-[#006747]/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div>
                            <p className="m-0 text-sm font-bold text-[#f4f4f5]">Complete your goalie profile</p>
                            <p className="m-0 text-xs text-white/40 mt-1">Set up your birthday, username, teams, and tags to unlock your full Goalie Card.</p>
                        </div>
                        <Link href="/onboarding" className="bg-[#006747] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#006747]/80 active:scale-95 transition-all whitespace-nowrap">
                            Complete Setup
                        </Link>
                    </div>
                </div>
            )}

            {/* Context-Aware Greeting */}
            <div className="max-w-xl md:max-w-[860px] mx-auto mb-6 w-full px-2">
                <p className="m-0 text-3xl md:text-4xl font-bold tracking-tight text-[#f4f4f5]">{greeting}</p>
                <p className="m-0 text-sm text-white/40 mt-1">{subline}</p>
            </div>

            {/* Main responsive grid layout */}
            <div className="max-w-xl md:max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-[12px] items-stretch w-full">
                
                {/* Left Column: Today's Action Card (spans full height of Right Column) */}
                <div className="md:col-span-6 flex flex-col h-full">
                    {/* Section 2: Today's Action Card */}
                    <Link href={actionCard.navHref} className="flex flex-col justify-between flex-1 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                        <div 
                            className="flex flex-col justify-between flex-1 h-full"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', position: 'relative', overflow: 'hidden', padding: '28px' }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,103,71,0.15), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }}></div>
                            
                            <div className="relative z-10">
                                <p className="m-0 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/35">Today</p>
                                <p className="m-0 mb-2 text-[20px] font-bold tracking-tight leading-tight text-[#f4f4f5]">{actionCard.headline}</p>
                                <p className="m-0 mb-6 text-sm text-white/40 font-medium leading-relaxed">
                                    {actionCard.subline}
                                </p>
                            </div>
                            <div className="relative z-10">
                                <span className="bg-white text-[#09090B] rounded-full px-[18px] py-[10px] text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2">
                                    <ArrowRight size={14} />
                                    {actionCard.btnText}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right Column: Module Tiles + Weekly Pulse */}
                <div className="md:col-span-6 flex flex-col gap-[12px] justify-between">
                    
                    {/* Section 3: Modules (3-Column Grid) */}
                    <div className="grid grid-cols-3 gap-3">
                        <Link 
                            href="/calendar" 
                            className="flex flex-col items-center justify-center p-5 bg-[#1C1C1E] transition-transform hover:scale-[1.02] active:scale-95 shadow-sm text-center"
                            style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}
                        >
                            <Calendar size={28} className="text-white/80 mb-3" />
                            <p className="m-0 text-[11px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Calendar</p>
                            <p className="m-0 text-[10px] text-white/35 mt-1">This week</p>
                        </Link>
                        <Link 
                            href="/film" 
                            className="flex flex-col items-center justify-center p-5 bg-[#1C1C1E] transition-transform hover:scale-[1.02] active:scale-95 shadow-sm text-center"
                            style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}
                        >
                            <Video size={28} className="text-white/80 mb-3" />
                            <p className="m-0 text-[11px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Film</p>
                            <p className="m-0 text-[10px] text-white/35 mt-1">{gamesCount > 0 ? `${gamesCount} games` : 'No games yet'}</p>
                        </Link>
                        <Link 
                            href="/training" 
                            className="flex flex-col items-center justify-center p-5 bg-[#1C1C1E] transition-transform hover:scale-[1.02] active:scale-95 shadow-sm text-center"
                            style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}
                        >
                            <Target size={28} className="text-white/80 mb-3" />
                            <p className="m-0 text-[11px] font-black uppercase tracking-[0.1em] text-[#f4f4f5]">Training</p>
                            <p className="m-0 text-[10px] text-white/35 mt-1">
                                {trainingPb !== null ? `PB: ${trainingPb}` : 'No runs yet'}
                            </p>
                        </Link>
                    </div>

                    {/* Section 4: Weekly Pulse */}
                    <div 
                        className="p-6 bg-[#1C1C1E] shadow-sm flex flex-col justify-between"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">This week's pulse</p>
                        </div>
                        <div className="flex gap-2 justify-between">
                            {dayLetters.map((dayLetter, dayIdx) => {
                                const isActive = activeDays.has(dayIdx);
                                const isToday = dayIdx === todayIndex;
                                
                                return (
                                    <div 
                                        key={dayIdx} 
                                        className="flex flex-col items-center justify-center py-3 flex-1 min-w-[36px] aspect-square relative transition-all duration-300"
                                        style={isToday ? {
                                            background: 'rgba(0,103,71,0.15)',
                                            border: '1px solid rgba(0,103,71,0.4)',
                                            borderRadius: '12px'
                                        } : {
                                            background: isActive 
                                                ? 'rgba(0,103,71,0.10)' 
                                                : (hasWeeklyIntention ? 'rgba(0,103,71,0.03)' : 'rgba(255,255,255,0.04)'),
                                            border: isActive 
                                                ? '1px solid rgba(0,103,71,0.3)' 
                                                : (hasWeeklyIntention ? '0.5px solid rgba(0,103,71,0.15)' : '0.5px solid rgba(255,255,255,0.07)'),
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <span 
                                            className="text-[11px] font-black tracking-tight"
                                            style={{ 
                                                color: isToday 
                                                    ? '#4ade80' 
                                                    : (isActive 
                                                        ? '#4ade80' 
                                                        : (hasWeeklyIntention ? 'rgba(74, 222, 128, 0.40)' : 'rgba(235,235,245,0.25)'))
                                            }}
                                        >
                                            {dayLetter}
                                        </span>
                                        {isToday && (
                                            <div className="w-1 h-1 rounded-full bg-[#006747] mt-1" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
