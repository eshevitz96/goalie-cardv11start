"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Loader2, Calendar, Video, Target, ArrowRight, User } from "lucide-react";

export default function Dashboard() {
    const auth = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
    const [gamesCount, setGamesCount] = useState(0);
    const [seasonName, setSeasonName] = useState("SEASON NOT SET");
    const [greeting, setGreeting] = useState("");
    const [subline, setSubline] = useState("Show up to the work.");

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

                // 1. Fetch user identity
                const { data: userRes, error: userErr } = await supabase
                    .from('users')
                    .select('id, first_name, last_name, display_name, onboarding_completed_at, created_at')
                    .eq('auth_user_id', uid)
                    .single();
                
                let initials = "GC";
                let fullName = "Goalie";
                let firstName = "Goalie";
                let publicUserId = null;
                let onboardingCompletedAt: string | null = null;
                let userCreatedAt: string | null = null;
                
                if (userRes && !userErr) {
                    publicUserId = userRes.id;
                    const f = userRes.first_name || "";
                    const l = userRes.last_name || "";
                    initials = ((f.charAt(0) || "") + (l.charAt(0) || "")).toUpperCase() || "GC";
                    fullName = userRes.display_name || `${f} ${l}`.trim() || "Goalie";
                    firstName = userRes.first_name || userRes.display_name || "Goalie";
                    onboardingCompletedAt = userRes.onboarding_completed_at || null;
                    userCreatedAt = userRes.created_at || null;
                }
                setUserData({ initials, fullName, publicUserId });

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

                // 3. Weekly Pulse (Touchpoints from reflections) + subline data
                if (publicUserId) {
                    const now = new Date();
                    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon
                    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    
                    const mon = new Date(now);
                    mon.setDate(now.getDate() - daysSinceMon);
                    mon.setHours(0,0,0,0);
                    
                    const nextMon = new Date(mon);
                    nextMon.setDate(mon.getDate() + 7);

                    // Fetch ALL reflections for this user (for subline: "ever" check + weekly pulse + recent 5-day check)
                    const { data: allRefRes } = await supabase
                        .from('reflections')
                        .select('created_at')
                        .eq('user_id', publicUserId)
                        .order('created_at', { ascending: false });
                    
                    // Weekly pulse calculation
                    const active = new Set<number>();
                    const weeklyRefs = (allRefRes || []).filter(r => {
                        const d = new Date(r.created_at);
                        return d >= mon && d < nextMon;
                    });
                    for (const r of weeklyRefs) {
                        const d = new Date(r.created_at);
                        let dayIdx = d.getDay() - 1;
                        if (dayIdx === -1) dayIdx = 6;
                        active.add(dayIdx);
                    }
                    setActiveDays(active);

                    // Fetch today's game sessions
                    const todayStart = new Date(now);
                    todayStart.setHours(0,0,0,0);
                    const todayEnd = new Date(now);
                    todayEnd.setHours(23,59,59,999);

                    const { data: todayGames } = await supabase
                        .from('game_sessions')
                        .select('created_at')
                        .eq('user_id', uid)
                        .gte('created_at', todayStart.toISOString())
                        .lte('created_at', todayEnd.toISOString());

                    // Fetch this week's game sessions
                    const { data: weekGames } = await supabase
                        .from('game_sessions')
                        .select('created_at')
                        .eq('user_id', uid)
                        .gte('created_at', mon.toISOString())
                        .lt('created_at', nextMon.toISOString())
                        .order('created_at', { ascending: false });

                    // ── Subline logic (priority order) ──
                    let computedSubline = "Show up to the work.";
                    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
                    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
                    const hasAnyReflections = allRefRes && allRefRes.length > 0;
                    const hasTodayGame = todayGames && todayGames.length > 0;
                    const hasWeekGame = weekGames && weekGames.length > 0;

                    if (onboardingCompletedAt && new Date(onboardingCompletedAt) >= tenMinAgo) {
                        computedSubline = "Welcome to Goalie Card.";
                    } else if (!hasAnyReflections) {
                        computedSubline = "Set the tone for this week.";
                    } else if (hasTodayGame) {
                        computedSubline = "Good game today. Reflect when you're ready.";
                    } else if (hasWeekGame) {
                        const mostRecentGame = new Date(weekGames![0].created_at);
                        const mostRecentRef = allRefRes![0] ? new Date(allRefRes![0].created_at) : null;
                        const hasRefSinceGame = mostRecentRef && mostRecentRef > mostRecentGame;
                        if (!hasRefSinceGame) {
                            const daysSinceGame = Math.floor((now.getTime() - mostRecentGame.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysSinceGame === 0) {
                                computedSubline = "You played today. Worth a look.";
                            } else if (daysSinceGame === 1) {
                                computedSubline = "You played yesterday. Worth a look.";
                            } else {
                                computedSubline = `You played ${daysSinceGame} days ago. Worth a look.`;
                            }
                        } else {
                            // Has reflection since game, check other conditions
                            if (weeklyRefs.length > 0) {
                                computedSubline = "The work is happening.";
                            }
                        }
                    } else if (userCreatedAt) {
                        const created = new Date(userCreatedAt);
                        const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                        const hasRecentReflection = allRefRes && allRefRes.some(r => new Date(r.created_at) >= fiveDaysAgo);
                        if (daysSinceCreation > 5 && !hasRecentReflection) {
                            computedSubline = "Good to have you back.";
                        } else if (weeklyRefs.length > 0) {
                            computedSubline = "The work is happening.";
                        }
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
                    <Link href="/profile" className="p-3 bg-white/5 border border-white/10 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg">
                        <User size={20} className="text-white" />
                    </Link>
                </div>
            </div>

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
                    <div 
                        className="transition-all flex flex-col justify-between flex-1"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', position: 'relative', overflow: 'hidden', padding: '28px' }}
                    >
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,103,71,0.15), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }}></div>
                        
                        <div className="relative z-10">
                            <p className="m-0 mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/35">Today</p>
                            <p className="m-0 mb-2 text-[20px] font-bold tracking-tight leading-tight text-[#f4f4f5]">Set your intention for the week.</p>
                            <p className="m-0 mb-6 text-sm text-white/40 font-medium leading-relaxed">
                                Show up to the work today.
                            </p>
                        </div>
                        <div className="relative z-10">
                            <button className="bg-white text-[#09090B] rounded-full px-[18px] py-[10px] text-[10px] font-black uppercase tracking-[0.2em] border-none inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                                <ArrowRight size={14} />
                                Begin
                            </button>
                        </div>
                    </div>
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
                            <p className="m-0 text-[10px] text-white/35 mt-1">3 prompts</p>
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
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '0.5px solid rgba(255,255,255,0.07)',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <span 
                                            className="text-[11px] font-black tracking-tight"
                                            style={{ 
                                                color: isToday 
                                                    ? '#4ade80' 
                                                    : (isActive ? '#006747' : 'rgba(235,235,245,0.25)')
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
