"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, Calendar, Video, Target, ArrowRight } from "lucide-react";
import { isPastSeniorSeason } from "@/utils/role-logic";
import { GoalieCard } from "@/components/GoalieCard";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { LessonsTransparency } from "@/components/goalie/LessonsTransparency";
import { PendingActionsOverlay } from "@/components/goalie/PendingActionsOverlay";
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
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
    const [performanceScore, setPerformanceScore] = useState<number | string>(0);
    const [isPro, setIsPro] = useState(false);
    const [credits, setCredits] = useState(0);
    const [showProgress, setShowProgress] = useState(true);
    const [hasLessonRecord, setHasLessonRecord] = useState(false);
    const [resolvedGoalieId, setResolvedGoalieId] = useState<string | null>(null);
    const [showActionsOverlay, setShowActionsOverlay] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { seasonLabel: hookSeasonLabel } = useSeasonTimeline(userData?.sport || rosterData?.sport || null);

    useEffect(() => {
        if (!auth.loading && !auth.isAuthenticated) {
            router.push('/login');
        }
    }, [auth.loading, auth.isAuthenticated, router]);

    const fetchData = useCallback(async () => {
        if (!auth.userId) return;
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
                    
                    const devOnboarding = typeof window !== 'undefined' ? localStorage.getItem('dev_onboarding_completed') : null;
                    setIsOnboardingCompleted(devOnboarding === 'true');
                    setIsProfileIncomplete(devOnboarding !== 'true');

                    setLoading(false);
                    return;
                }

                // 1. Resolve Goalie Profile ID (FIX 1)
                let goalieProfileId = uid;
                let rosterRes = null;

                if (auth.userRole === 'parent' && auth.userEmail) {
                    const { data: parentRosters } = await supabase
                        .from('roster_uploads')
                        .select('*')
                        .ilike('guardian_email', auth.userEmail);
                    if (parentRosters && parentRosters.length > 0) {
                        const activeRoster = parentRosters.find(r => r.linked_user_id) || parentRosters[0];
                        rosterRes = activeRoster;
                        goalieProfileId = activeRoster.linked_user_id || uid;
                    }
                } else {
                    const { data: rRes } = await supabase
                        .from('roster_uploads')
                        .select('*')
                        .eq('linked_user_id', uid)
                        .maybeSingle();
                    rosterRes = rRes;
                }

                setResolvedGoalieId(goalieProfileId);

                // 2. Fetch user identity and profile details using resolved goalie ID
                const [userRes, profileRes] = await Promise.all([
                    supabase
                        .from('users')
                        .select('id, first_name, last_name, display_name, gc_number, onboarding_completed, onboarding_completed_at, created_at, teams, handedness, primary_sport')
                        .eq('auth_user_id', goalieProfileId)
                        .maybeSingle(),
                    supabase
                        .from('profiles')
                        .select('goalie_name, sport, grad_year')
                        .eq('id', goalieProfileId)
                        .maybeSingle()
                ]);
                
                const userResData = userRes.data;
                const userErr = userRes.error;
                
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
                
                if (userResData && !userErr) {
                    publicUserId = userResData.id;
                    const f = userResData.first_name || "";
                    const l = userResData.last_name || "";
                    initials = ((f.charAt(0) || "") + (l.charAt(0) || "")).toUpperCase() || "GC";
                    fullName = userResData.display_name || `${f} ${l}`.trim() || "Goalie";
                    firstName = userResData.first_name || userResData.display_name || "Goalie";
                    onboardingCompletedAt = userResData.onboarding_completed_at || null;
                    userCreatedAt = userResData.created_at || null;
                    onboarded = userResData.onboarding_completed !== false; // False means incomplete
                    teams = userResData.teams || null;
                    handedness = userResData.handedness || null;
                    sport = normalizeSportDisplay(userResData.primary_sport);
                    if (userResData.gc_number) {
                        gcNumber = 'GC-' + String(userResData.gc_number).padStart(4, '0');
                    }
                }
                setUserData({ initials, fullName, publicUserId, teams, handedness, gcNumber, sport });
                setIsOnboardingCompleted(onboarded);

                // Compute profile completeness
                let isProfileIncompleteVal = false;
                if (profileRes && profileRes.data) {
                    const p = profileRes.data;
                    const nameEmpty = !p.goalie_name || p.goalie_name.trim() === '';
                    const sportUnset = !p.sport || p.sport.trim() === '';
                    const gradYearNull = p.grad_year === null || p.grad_year === undefined;
                    isProfileIncompleteVal = nameEmpty || sportUnset || gradYearNull;
                } else {
                    isProfileIncompleteVal = true;
                }
                setIsProfileIncomplete(isProfileIncompleteVal);



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

                // Fetch goalie_lesson_balance view (FIX 2)
                let lessonsBalanceRowExists = false;
                try {
                    const { data: balanceData } = await supabase
                        .from("goalie_lesson_balance")
                        .select("goalie_id")
                        .eq("goalie_id", goalieProfileId)
                        .maybeSingle();
                    lessonsBalanceRowExists = !!balanceData;
                } catch (e) {
                    console.warn("Failed to fetch goalie_lesson_balance:", e);
                }
                setHasLessonRecord(lessonsBalanceRowExists);

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

                    // Open-app overlay actions check (non-blocking with timeout fallback)
                    if (goalieProfileId) {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);

                        fetch('/api/lessons/pending', { signal: controller.signal })
                            .then(res => res.json())
                            .then(pendData => {
                                clearTimeout(timeoutId);
                                const hasPendingLesson = pendData.success && pendData.pending && pendData.pending.length > 0;
                                const needsIntention = !weeklyIntentionText && (auth.userRole === 'goalie' || auth.userRole === 'parent');
                                if (hasPendingLesson || needsIntention) {
                                    setShowActionsOverlay(true);
                                }
                            })
                            .catch(e => {
                                clearTimeout(timeoutId);
                                console.warn("Failed to check pending overlay actions:", e);
                            });
                    }

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
                setLoading(false); // FIXED SPINNER

        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setLoading(false);
        }
    }, [auth.userId, auth.userRole, auth.userEmail, hookSeasonLabel]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.userId, refreshTrigger]);

    if (auth.loading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <Loader2 className="animate-spin text-foreground/30" size={32} />
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
            style={{ padding: '32px 24px 140px 24px' }}
        >
            {/* Section 1: Simplified Minimal Header */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto mb-6 w-full">
                <div className="flex items-center justify-between px-2 border-b border-border/50 pb-4">
                    <div className="flex flex-col">
                        <p className="m-0 text-lg font-bold tracking-tight text-foreground/90">
                            {dayOfWeekStr}, {dateStrShort}
                        </p>
                        <p className="m-0 text-[9px] font-black uppercase tracking-[0.15em] text-[#006747] mt-1 leading-none">
                            {(!seasonName || seasonName === "SEASON NOT SET") 
                                ? `Season ${hookSeasonLabel}` 
                                : (seasonName.toUpperCase().startsWith("SEASON") ? seasonName.toUpperCase() : `Season ${seasonName.toUpperCase()}`)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BrandLogo textClassName="text-lg md:text-xl font-medium tracking-tight text-foreground/90 select-none pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Complete your card Banner */}
            {isProfileIncomplete && (
                <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto mb-6 w-full px-2">
                    <Link 
                        href="/onboarding"
                        className="block bg-card border border-border hover:border-border/80 rounded-2xl p-4 transition-all group shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="m-0 text-sm font-bold text-foreground group-hover:text-foreground/90">Complete your card</p>
                                <p className="m-0 text-xs text-muted-foreground mt-1">Set up your name, sport, and grad year to activate your card.</p>
                            </div>
                            <div className="bg-foreground text-background text-xs font-bold px-4 py-2.5 rounded-xl group-hover:bg-foreground/90 active:scale-95 transition-all whitespace-nowrap">
                                Complete Setup
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Main responsive card-first layout */}
            <div className="max-w-xl md:max-w-[860px] lg:max-w-5xl xl:max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
                
                {/* Left Column (or Top on Mobile): Athlete Card */}
                <div className="col-span-1 md:col-span-4 lg:col-span-3 w-full flex flex-col items-center">
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
                        isIncomplete={isProfileIncomplete}
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
                <div className="col-span-1 md:col-span-8 lg:col-span-9 flex flex-col gap-6 w-full">
                    
                    {/* Context-Aware Greeting */}
                    <div className="px-2 mb-4">
                        <h1 className="m-0 text-4xl md:text-5xl font-sans font-black tracking-tight text-foreground">{greeting}</h1>
                        <p className="m-0 text-base md:text-lg text-muted-foreground font-medium mt-1 mb-5">{subline}</p>
                        
                        {/* Weekly Pulse - Compact */}
                        <div className="flex gap-2">
                            {dayLetters.map((dayLetter, dayIdx) => {
                                const isActive = activeDays.has(dayIdx);
                                const isToday = dayIdx === todayIndex;
                                
                                return (
                                    <div 
                                        key={dayIdx} 
                                        className={twMerge(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300",
                                            isToday
                                                ? "bg-foreground text-background ring-2 ring-foreground/20 ring-offset-2 ring-offset-background scale-110"
                                                : isActive
                                                    ? "bg-[#006747] text-[#006747]"
                                                    : "bg-muted text-muted-foreground/30 border border-border/50"
                                        )}
                                    >
                                        {dayLetter}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                                        {/* Today's Action Card & Lessons Transparency (Side-by-Side on Desktop/Tablet if balance exists) */}
                    <div className={twMerge(
                        "grid grid-cols-1 gap-6 w-full",
                        (hasLessonRecord || credits > 0) ? "lg:grid-cols-2" : "grid-cols-1"
                    )}>
                        {/* Today's Action Card */}
                        <Link href={actionCard.navHref} className="flex flex-col justify-between transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer h-full min-h-[192px]">
                            <div 
                                className="flex flex-col justify-between p-6 h-full glass rounded-3xl relative overflow-hidden"
                            >
                                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,103,71,0.12), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }}></div>
                                
                                <div className="relative z-10">
                                    <p className="m-0 mb-1 text-[8px] font-black uppercase tracking-[0.3em] text-foreground/35">Today</p>
                                    <p className="m-0 mb-1.5 text-xl font-bold tracking-tight leading-tight text-foreground">{actionCard.headline}</p>
                                    <p className="m-0 text-xs text-muted-foreground font-medium leading-relaxed">
                                        {actionCard.subline}
                                    </p>
                                </div>
                                <div className="relative z-10 mt-4">
                                    <span className="bg-foreground text-background rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2">
                                        <ArrowRight size={12} />
                                        {actionCard.btnText}
                                    </span>
                                </div>
                            </div>
                        </Link>

                        {/* Reclaimed Space: Lessons Transparency (Render Gate - FIX 2) */}
                        {(hasLessonRecord || credits > 0) && resolvedGoalieId && (
                            <LessonsTransparency goalieProfileId={resolvedGoalieId} />
                        )}
                    </div>

                    {/* Module Tiles Grid (3-Column) */}
                    <div className="grid grid-cols-3 gap-3 w-full">
                        <Link 
                            href="/calendar" 
                            className="flex flex-col items-center justify-center p-4 bg-card border border-border transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl shadow-sm"
                        >
                            <Calendar size={24} className="text-foreground mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">Calendar</p>
                            <p className="m-0 text-[9px] text-muted-foreground mt-1">This week</p>
                        </Link>
                        <Link 
                            href="/film" 
                            className="flex flex-col items-center justify-center p-4 bg-card border border-border transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl shadow-sm"
                        >
                            <Video size={24} className="text-foreground mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">Film</p>
                            <p className="m-0 text-[9px] text-muted-foreground mt-1">{gamesCount > 0 ? `${gamesCount} games` : 'No games'}</p>
                        </Link>
                        <Link 
                            href="/training" 
                            className="flex flex-col items-center justify-center p-4 bg-card border border-border transition-transform hover:scale-[1.02] active:scale-95 text-center rounded-2xl shadow-sm"
                        >
                            <Target size={24} className="text-foreground mb-2" />
                            <p className="m-0 text-[10px] font-black uppercase tracking-[0.1em] text-foreground">Training</p>
                            <p className="m-0 text-[9px] text-muted-foreground mt-1">
                                {trainingPb !== null ? `PB: ${trainingPb}` : 'No runs'}
                            </p>
                        </Link>
                    </div>



                </div>

            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Pending Actions Overlay (Confirmation & Weekly Intention Flow) */}
            {showActionsOverlay && resolvedGoalieId && (
                <PendingActionsOverlay
                    goalieProfileId={resolvedGoalieId}
                    publicUserId={userData?.publicUserId || undefined}
                    rosterId={rosterData?.id}
                    userRole={auth.userRole || 'goalie'}
                    hasWeeklyIntention={hasWeeklyIntention}
                    onClose={() => setShowActionsOverlay(false)}
                    onRefreshDashboard={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}
        </div>
    );
}
