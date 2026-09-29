"use client";

import React, { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Snowflake, ArrowRight, Activity } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export interface GoalieCardProps {
    name?: string;
    initials?: string;
    team?: string;
    teams?: string[] | string | null;
    catchHand?: string;
    sport?: string;
    gcNumber?: string;
    userId?: string;
    id?: string;
    className?: string;
    isIncomplete?: boolean;
    pureIcon?: boolean;
    // Backward-compatibility props (no-op on redesigned card)
    performanceScore?: number | string;
    session?: number;
    lesson?: number;
    height?: string;
    weight?: string;
    gradYear?: string | number;
    isPro?: boolean;
    seasonProgress?: number;
    showProgress?: boolean;
    credits?: number;
    pendingPayment?: any;
    games?: number;
    practices?: number;
}

interface UserIdentityData {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    handedness: string | null;
    primarySport: string | null;
    teams: string[] | null;
    gcNumber: string | null;
}

interface ContractData {
    id: string;
    name: string | null;
    objective: string | null;
    phase: string | null;
    startDate: string | null;
}

interface IceExposuresData {
    count: number;
    lastIceDate: string | null;
}

interface MorningStateData {
    hasEntry: boolean;
    mood: string | null;
    intention?: string | null;
}

interface FocusMissionData {
    directive: string | null;
}

interface NextIceData {
    date: string;
    title: string;
}

function formatPhaseLabel(rawPhase: string | null | undefined): string | null {
    if (!rawPhase) return null;
    const lower = rawPhase.toLowerCase().trim();
    if (lower === 'return') return 'Return';
    if (lower === 'reacquire') return 'Reacquire';
    if (lower === 'compete') return 'Compete';
    if (lower === 'advance') return 'Advance';
    return rawPhase.charAt(0).toUpperCase() + rawPhase.slice(1);
}

function formatCatchHand(rawHandedness: string | null | undefined): string | null {
    if (!rawHandedness) return null;
    const lower = rawHandedness.toLowerCase().trim();
    if (lower === 'right' || lower === 'r' || lower === 'catches right' || lower === 'catches_right') {
        return 'Catches right';
    }
    if (lower === 'left' || lower === 'l' || lower === 'catches left' || lower === 'catches_left') {
        return 'Catches left';
    }
    if (lower.startsWith('catches')) {
        return rawHandedness;
    }
    return `Catches ${rawHandedness}`;
}

function formatDateDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
        const parts = dateStr.slice(0, 10).split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function formatShortDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
        const today = new Date().toISOString().slice(0, 10);
        if (dateStr.slice(0, 10) === today) return 'Today';
        
        const parts = dateStr.slice(0, 10).split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

export function GoalieCard({
    name: propName,
    initials: propInitials,
    team: propTeam,
    teams: propTeams,
    catchHand: propCatchHand,
    sport: propSport,
    gcNumber: propGcNumber,
    userId: propUserId,
    id: propId,
    className,
    isIncomplete,
    pureIcon
}: GoalieCardProps) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [identity, setIdentity] = useState<UserIdentityData>({
        firstName: '',
        lastName: '',
        fullName: propName || '',
        email: null,
        handedness: formatCatchHand(propCatchHand),
        primarySport: propSport || null,
        teams: null,
        gcNumber: propGcNumber || null
    });

    const [contract, setContract] = useState<ContractData | null>(null);
    const [iceExposures, setIceExposures] = useState<IceExposuresData>({ count: 0, lastIceDate: null });
    const [morningState, setMorningState] = useState<MorningStateData>({ hasEntry: false, mood: null });
    const [focusMission, setFocusMission] = useState<FocusMissionData | null>(null);
    const [nextIce, setNextIce] = useState<NextIceData | null>(null);

    const todayStr = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        let isMounted = true;

        async function fetchLiveAthleteCardData() {
            setLoading(true);
            try {
                // 1. Resolve Auth / User ID
                let targetId = propUserId || propId;
                let userEmail: string | null = null;
                
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    if (!targetId || targetId === '00000000-0000-0000-0000-000000000000') {
                        targetId = session.user.id;
                    }
                    userEmail = session.user.email || null;
                }

                // 2. Fetch User Identity directly from LIVE `users` table
                let userPublicId: string | null = null;
                let userAuthId: string | null = null;
                let loadedIdentity: UserIdentityData = {
                    firstName: '',
                    lastName: '',
                    fullName: propName || '',
                    email: userEmail,
                    handedness: formatCatchHand(propCatchHand),
                    primarySport: propSport || null,
                    teams: null,
                    gcNumber: propGcNumber || null
                };

                let userQuery = supabase
                    .from('users')
                    .select('id, auth_user_id, email, first_name, last_name, display_name, handedness, primary_sport, teams, gc_number');

                if (targetId && targetId !== '00000000-0000-0000-0000-000000000000') {
                    if (userEmail) {
                        userQuery = userQuery.or(`id.eq.${targetId},auth_user_id.eq.${targetId},email.ilike.${userEmail.trim()}`);
                    } else {
                        userQuery = userQuery.or(`id.eq.${targetId},auth_user_id.eq.${targetId}`);
                    }
                } else if (userEmail) {
                    userQuery = userQuery.ilike('email', userEmail.trim());
                }

                const { data: userRow } = await userQuery.limit(1).maybeSingle();

                if (userRow) {
                    userPublicId = userRow.id;
                    userAuthId = userRow.auth_user_id || userRow.id;
                    if (userRow.email) userEmail = userRow.email;

                    const fName = userRow.first_name || '';
                    const lName = userRow.last_name || '';
                    const resolvedFull = (fName || lName) 
                        ? `${fName} ${lName}`.trim() 
                        : (userRow.display_name || propName || '');

                    let parsedTeams: string[] | null = null;
                    if (Array.isArray(userRow.teams) && userRow.teams.length > 0) {
                        parsedTeams = userRow.teams.filter((t: any) => typeof t === 'string' && t.trim() !== '');
                        if (parsedTeams.length === 0) parsedTeams = null;
                    } else if (typeof userRow.teams === 'string' && userRow.teams.trim() !== '') {
                        parsedTeams = [userRow.teams.trim()];
                    }

                    loadedIdentity = {
                        firstName: fName,
                        lastName: lName,
                        fullName: resolvedFull,
                        email: userRow.email || userEmail,
                        handedness: formatCatchHand(userRow.handedness || propCatchHand),
                        primarySport: userRow.primary_sport || propSport || null,
                        teams: parsedTeams,
                        gcNumber: userRow.gc_number ? `GC-${String(userRow.gc_number).padStart(4, '0')}` : (propGcNumber || null)
                    };
                }

                if (isMounted) setIdentity(loadedIdentity);

                // Collect all candidate user identifiers to query related tables
                const candidateUserIds = Array.from(new Set([
                    userPublicId,
                    userAuthId,
                    targetId
                ].filter(Boolean))) as string[];

                if (candidateUserIds.length === 0) {
                    if (isMounted) setLoading(false);
                    return;
                }

                const userOrFilter = candidateUserIds.map(uid => `user_id.eq.${uid}`).join(',');

                // 3. Fetch Active Contract directly from LIVE `contracts` table
                // contracts where user_id = auth user and status = 'active': name, objective, phase, start_date.
                let activeContract: ContractData | null = null;
                const { data: contractRow } = await supabase
                    .from('contracts')
                    .select('id, user_id, name, objective, phase, start_date, status')
                    .or(userOrFilter)
                    .eq('status', 'active')
                    .order('start_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (contractRow) {
                    activeContract = {
                        id: contractRow.id,
                        name: contractRow.name,
                        objective: contractRow.objective,
                        phase: contractRow.phase,
                        startDate: contractRow.start_date
                    };
                }

                if (isMounted) setContract(activeContract);

                // 4. Fetch Ice Exposures directly from LIVE `training_sessions` table
                // count of training_sessions where training_type = 'on_ice' and status = 'complete' and session_date >= contract.start_date.
                // Last ice = max session_date of those.
                let iceQuery = supabase
                    .from('training_sessions')
                    .select('session_date')
                    .or(userOrFilter)
                    .eq('training_type', 'on_ice')
                    .eq('status', 'complete');

                if (activeContract?.startDate) {
                    iceQuery = iceQuery.gte('session_date', activeContract.startDate);
                }

                const { data: iceSessions } = await iceQuery.order('session_date', { ascending: false });

                if (iceSessions && iceSessions.length > 0) {
                    if (isMounted) {
                        setIceExposures({
                            count: iceSessions.length,
                            lastIceDate: iceSessions[0].session_date
                        });
                    }
                } else {
                    if (isMounted) {
                        setIceExposures({ count: 0, lastIceDate: null });
                    }
                }

                // 5. Center Circle: today's state from LIVE `daily_morning_entries` for today.
                // Link chain: daily_users.email = users.email (or user id / name) → daily_sessions where session_date = today → daily_morning_entries.mood.
                // If any link is missing, show "Check in". Never show READY without an entry.
                let todayMorningMood: string | null = null;
                let todayMorningIntention: string | null = null;

                const targetEmail = loadedIdentity.email || userEmail;
                let dailyUserId: string | null = null;

                if (targetEmail) {
                    const { data: duByEmail } = await supabase
                        .from('daily_users')
                        .select('id')
                        .ilike('email', targetEmail.trim())
                        .maybeSingle();
                    if (duByEmail?.id) dailyUserId = duByEmail.id;
                }

                if (!dailyUserId) {
                    for (const candidateId of candidateUserIds) {
                        const { data: duById } = await supabase
                            .from('daily_users')
                            .select('id')
                            .eq('id', candidateId)
                            .maybeSingle();
                        if (duById?.id) {
                            dailyUserId = duById.id;
                            break;
                        }
                    }
                }

                if (!dailyUserId && loadedIdentity.fullName) {
                    const { data: duByName } = await supabase
                        .from('daily_users')
                        .select('id')
                        .ilike('name', loadedIdentity.fullName.trim())
                        .maybeSingle();
                    if (duByName?.id) dailyUserId = duByName.id;
                }

                if (dailyUserId) {
                    // Step B: Find daily_sessions row for today
                    const { data: dailySession } = await supabase
                        .from('daily_sessions')
                        .select('id')
                        .eq('user_id', dailyUserId)
                        .eq('session_date', todayStr)
                        .maybeSingle();

                    if (dailySession?.id) {
                        // Step C: Find daily_morning_entries row for this session
                        const { data: morningEntry } = await supabase
                            .from('daily_morning_entries')
                            .select('mood, intention')
                            .eq('session_id', dailySession.id)
                            .maybeSingle();

                        if (morningEntry && morningEntry.mood) {
                            todayMorningMood = morningEntry.mood;
                            todayMorningIntention = morningEntry.intention || null;
                        }
                    }
                }

                if (isMounted) {
                    setMorningState({
                        hasEntry: !!todayMorningMood,
                        mood: todayMorningMood ? String(todayMorningMood).toUpperCase() : null,
                        intention: todayMorningIntention
                    });
                }

                // 6. Focus / Next Test: from latest `missions` row for this contract (directive / blocks.coach_focus)
                // If none, hide the section; no hard-coded cues.
                let missionRows: any[] | null = null;
                if (activeContract?.id) {
                    const { data: mData } = await supabase
                        .from('missions')
                        .select('directive, blocks, created_at, mission_date')
                        .eq('contract_id', activeContract.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    missionRows = mData;
                }

                if (!missionRows || missionRows.length === 0) {
                    const { data: mDataUser } = await supabase
                        .from('missions')
                        .select('directive, blocks, created_at, mission_date')
                        .or(userOrFilter)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    missionRows = mDataUser;
                }

                if (missionRows && missionRows.length > 0) {
                    const m = missionRows[0];
                    let directiveVal: string | null = null;

                    if (m.directive && typeof m.directive === 'string' && m.directive.trim() !== '') {
                        directiveVal = m.directive.trim();
                    } else if (m.blocks && typeof m.blocks === 'object') {
                        const bFocus = (m.blocks as any).coach_focus || (m.blocks as any).directive;
                        if (typeof bFocus === 'string' && bFocus.trim() !== '') {
                            directiveVal = bFocus.trim();
                        }
                    }

                    if (isMounted) {
                        setFocusMission(directiveVal ? { directive: directiveVal } : null);
                    }
                } else {
                    if (isMounted) setFocusMission(null);
                }

                // 7. Next Ice: only planned training_sessions or missions with on_ice type in the future.
                // Coach lessons must never appear here. If none, hide it.
                const { data: futureIceSessions } = await supabase
                    .from('training_sessions')
                    .select('session_date, title')
                    .or(userOrFilter)
                    .eq('training_type', 'on_ice')
                    .neq('status', 'complete')
                    .gt('session_date', todayStr)
                    .order('session_date', { ascending: true })
                    .limit(1);

                if (futureIceSessions && futureIceSessions.length > 0) {
                    if (isMounted) {
                        setNextIce({
                            date: futureIceSessions[0].session_date,
                            title: futureIceSessions[0].title || 'On-Ice Session'
                        });
                    }
                } else if (activeContract?.id) {
                    // Check future planned missions for this contract with on_ice
                    const { data: futureMissions } = await supabase
                        .from('missions')
                        .select('mission_date, title, blocks')
                        .eq('contract_id', activeContract.id)
                        .gt('mission_date', todayStr)
                        .neq('status', 'completed')
                        .order('mission_date', { ascending: true })
                        .limit(3);

                    let foundIceMission: NextIceData | null = null;
                    if (futureMissions && futureMissions.length > 0) {
                        for (const fm of futureMissions) {
                            const tLower = (fm.title || '').toLowerCase();
                            const bStr = JSON.stringify(fm.blocks || {}).toLowerCase();
                            if (tLower.includes('ice') || tLower.includes('skate') || bStr.includes('on_ice')) {
                                foundIceMission = {
                                    date: fm.mission_date,
                                    title: fm.title || 'On-Ice Training'
                                };
                                break;
                            }
                        }
                    }

                    if (isMounted) setNextIce(foundIceMission);
                } else {
                    if (isMounted) setNextIce(null);
                }

            } catch (err) {
                console.error("[GoalieCard] Live fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchLiveAthleteCardData();

        return () => {
            isMounted = false;
        };
    }, [propUserId, propId, propName, propCatchHand, propSport, propGcNumber, todayStr]);

    if (pureIcon) {
        return (
            <div className={twMerge("flex items-center justify-center bg-muted rounded-2xl text-foreground border border-border shrink-0 shadow-inner", className)}>
                <div className="w-full h-full bg-[#00E676] flex items-center justify-center rounded-2xl text-black font-bold uppercase text-sm">
                    {propInitials || "GC"}
                </div>
            </div>
        );
    }

    if (isIncomplete) {
        return (
            <Link 
                href="/onboarding"
                className={twMerge(
                    "bg-[#0A0D14]/90 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col relative overflow-hidden group hover:border-[#00E676]/40 transition-all duration-300 min-h-[340px] md:min-h-[400px] select-none block cursor-pointer",
                    className
                )}
            >
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center space-y-4 h-full my-auto">
                    <div className="w-16 h-16 bg-[#00E676]/10 text-[#00E676] rounded-full flex items-center justify-center border border-[#00E676]/20 group-hover:bg-[#00E676]/20 transition-colors">
                        <Activity size={28} />
                    </div>
                    <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold text-white tracking-tight">Complete Athlete Profile</h3>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                            Set up your identity and primary sport to activate your Goalie Card.
                        </p>
                    </div>
                </div>
            </Link>
        );
    }

    // Phase Label (never derived from dates)
    const phaseLabel = formatPhaseLabel(contract?.phase);

    // Bottom Line Info (Zero hardcoded fallbacks)
    const primarySportDisplay = identity.primarySport ? (identity.primarySport.charAt(0).toUpperCase() + identity.primarySport.slice(1)) : "";
    const contractTitleDisplay = contract?.name || "";
    const sinceDateDisplay = contract?.startDate ? `Since ${formatDateDisplay(contract.startDate)}` : "";
    const bottomLineString = [primarySportDisplay, contractTitleDisplay, sinceDateDisplay].filter(Boolean).join(' · ');

    return (
        <div 
            className={twMerge(
                "w-full bg-[#0A0D14] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 min-h-[380px] md:min-h-[420px] text-white",
                className
            )}
        >
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-44 w-44 rounded-full bg-[#00E676]/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-44 w-44 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* TOP HEADER: IDENTITY (Who) & PHASE */}
            <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex flex-col min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none truncate">
                        {identity.fullName}
                    </h2>
                    
                    {/* Handedness & Sport */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mt-1.5">
                        {identity.handedness && (
                            <span>{identity.handedness}</span>
                        )}
                        {identity.handedness && primarySportDisplay && (
                            <span className="w-1 h-1 rounded-full bg-neutral-600" />
                        )}
                        {primarySportDisplay && (
                            <span>{primarySportDisplay}</span>
                        )}
                    </div>

                    {/* Team line ONLY if users.teams is non-empty */}
                    {identity.teams && identity.teams.length > 0 && (
                        <div className="text-xs font-medium text-[#00E676] tracking-wide mt-1 truncate">
                            {identity.teams.join(' · ')}
                        </div>
                    )}
                </div>

                {/* Phase Badge (Never derived from dates) */}
                {phaseLabel && (
                    <div className="shrink-0 flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-200">
                            {phaseLabel}
                        </span>
                    </div>
                )}
            </div>

            {/* CENTER ROW: STATE CIRCLE (Today's state or Check in) */}
            <div className="relative z-10 my-4 flex items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                    {/* Center State Circle */}
                    <div className="shrink-0">
                        {morningState.hasEntry ? (
                            <div className="w-16 h-16 rounded-full bg-[#00E676]/10 border-2 border-[#00E676] flex flex-col items-center justify-center text-center p-1 shadow-lg shadow-[#00E676]/10">
                                <span className="text-[10px] font-black text-[#00E676] uppercase tracking-wider leading-none">
                                    {morningState.mood}
                                </span>
                                <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                                    Today
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/training')}
                                className="w-16 h-16 rounded-full bg-white/5 hover:bg-[#00E676]/20 border-2 border-dashed border-white/20 hover:border-[#00E676] flex flex-col items-center justify-center text-center p-1 transition-all group/btn cursor-pointer"
                                title="Tap to check in today"
                            >
                                <Activity size={14} className="text-neutral-400 group-hover/btn:text-[#00E676] transition-colors" />
                                <span className="text-[9px] font-bold text-neutral-300 group-hover/btn:text-white uppercase tracking-wider mt-0.5 leading-none">
                                    Check in
                                </span>
                            </button>
                        )}
                    </div>

                    {/* State Context Description */}
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                            Today&apos;s Readiness
                        </span>
                        <p className="text-sm font-semibold text-white tracking-tight mt-0.5 truncate">
                            {morningState.hasEntry 
                                ? (morningState.intention ? `Intention: ${morningState.intention}` : `Status: ${morningState.mood}`)
                                : "No morning entry logged yet."}
                        </p>
                        {!morningState.hasEntry && (
                            <button 
                                onClick={() => router.push('/training')}
                                className="text-xs text-[#00E676] hover:underline font-bold text-left mt-0.5 flex items-center gap-1"
                            >
                                Complete check-in <ArrowRight size={10} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Ice Exposures Counter */}
                <div className="flex flex-col items-end shrink-0 pl-2 border-l border-white/5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                        Ice Exposures
                    </span>
                    <span className="text-2xl font-black text-white tracking-tight leading-tight">
                        {iceExposures.count}
                    </span>
                    {iceExposures.lastIceDate && (
                        <span className="text-[9px] text-neutral-400 font-medium">
                            Last: {formatShortDate(iceExposures.lastIceDate)}
                        </span>
                    )}
                </div>
            </div>

            {/* DYNAMIC SECTION: FOCUS / NEXT TEST (Hidden if none) */}
            {focusMission?.directive && (
                <div className="relative z-10 mb-3 bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] mt-1.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">
                            Focus & Directive
                        </span>
                        <p className="text-xs font-semibold text-neutral-200 leading-snug line-clamp-2 mt-0.5">
                            {focusMission.directive}
                        </p>
                    </div>
                </div>
            )}

            {/* DYNAMIC SECTION: NEXT ICE (Only future on_ice sessions; hidden if none) */}
            {nextIce && (
                <div className="relative z-10 mb-3 flex items-center justify-between text-xs bg-cyan-950/20 border border-cyan-500/20 rounded-xl px-3.5 py-2 text-cyan-200">
                    <div className="flex items-center gap-2 truncate">
                        <Snowflake size={14} className="text-cyan-400 shrink-0" />
                        <span className="font-semibold truncate">Next Ice: {nextIce.title}</span>
                    </div>
                    <span className="font-bold shrink-0 text-[10px] uppercase tracking-wider text-cyan-300 ml-2">
                        {formatShortDate(nextIce.date)}
                    </span>
                </div>
            )}

            {/* BOTTOM FOOTER: BOTTOM LINE & GC NUMBER */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-neutral-400 text-xs">
                <p className="m-0 text-[11px] font-medium text-neutral-300 tracking-tight truncate pr-2">
                    {bottomLineString}
                </p>
                {identity.gcNumber && (
                    <span className="shrink-0 text-[9px] font-mono text-neutral-500 font-bold uppercase tracking-widest">
                        {identity.gcNumber}
                    </span>
                )}
            </div>
        </div>
    );
}
