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
    title: string | null;
    directive: string | null;
    category: string;
}

interface NextIceData {
    date: string;
    title: string;
}

function getTrainingCategory(title: string | null | undefined, directive: string | null | undefined): string {
    const text = `${title || ''} ${directive || ''}`.toLowerCase();
    if (text.includes('strength') || text.includes('squat') || text.includes('lift') || text.includes('power')) {
        return 'Strength Training';
    }
    if (text.includes('stick') && text.includes('puck')) {
        return 'Stick & Puck';
    }
    if (text.includes('on_ice') || text.includes('on-ice') || text.includes('ice session') || text.includes('skate')) {
        return 'On-Ice Training';
    }
    if (text.includes('cardio') || text.includes('hiit') || text.includes('conditioning')) {
        return 'Cardio & Conditioning';
    }
    if (text.includes('recovery') || text.includes('mobility') || text.includes('yoga') || text.includes('rest')) {
        return 'Rest & Recovery';
    }
    if (title && title.trim()) {
        return title.split('.')[0].trim();
    }
    return 'Strength Training';
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
    const [weeklyFocus, setWeeklyFocus] = useState<string | null>(null);
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

                // 2. Fetch User Identity directly from LIVE `profiles` table
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
                    .from('profiles')
                    .select('id, email, first_name, last_name, display_name, full_name, goalie_name, handedness, primary_sport, sport, teams, gc_number');

                if (targetId && targetId !== '00000000-0000-0000-0000-000000000000') {
                    if (userEmail) {
                        userQuery = userQuery.or(`id.eq.${targetId},email.ilike.${userEmail.trim()}`);
                    } else {
                        userQuery = userQuery.eq('id', targetId);
                    }
                } else if (userEmail) {
                    userQuery = userQuery.ilike('email', userEmail.trim());
                }

                const { data: userRow } = await userQuery.limit(1).maybeSingle();

                if (userRow) {
                    userPublicId = userRow.id;
                    userAuthId = userRow.id;
                    if (userRow.email) userEmail = userRow.email;

                    const fName = userRow.first_name || (userRow.full_name ? userRow.full_name.split(' ')[0] : '') || (userRow.goalie_name ? userRow.goalie_name.split(' ')[0] : '');
                    const lName = userRow.last_name || (userRow.full_name ? userRow.full_name.split(' ').slice(1).join(' ') : '') || (userRow.goalie_name ? userRow.goalie_name.split(' ').slice(1).join(' ') : '');
                    const resolvedFull = userRow.display_name || userRow.full_name || userRow.goalie_name || ((fName || lName) ? `${fName} ${lName}`.trim() : (propName || ''));

                    let parsedTeams: string[] | null = null;
                    if (Array.isArray(userRow.teams) && userRow.teams.length > 0) {
                        parsedTeams = userRow.teams.filter((t: any) => typeof t === 'string' && t.trim() !== '');
                        if (parsedTeams.length === 0) parsedTeams = null;
                    } else if (typeof userRow.teams === 'string' && (userRow.teams as string).trim() !== '') {
                        parsedTeams = [(userRow.teams as string).trim()];
                    }

                    loadedIdentity = {
                        firstName: fName,
                        lastName: lName,
                        fullName: resolvedFull,
                        email: userRow.email || userEmail,
                        handedness: formatCatchHand(userRow.handedness || propCatchHand),
                        primarySport: userRow.primary_sport || userRow.sport || propSport || null,
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

                // 5. Weekly Focus: from `weekly_intentions` for current week (if set)
                const now = new Date();
                const dayOfWeek = now.getDay();
                const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const mon = new Date(now);
                mon.setDate(now.getDate() - daysSinceMon);
                const monStr = mon.toISOString().slice(0, 10);

                const { data: weeklyIntentionRow } = await supabase
                    .from('weekly_intentions')
                    .select('intention_text')
                    .or(userOrFilter)
                    .eq('week_start_date', monStr)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (weeklyIntentionRow?.intention_text && weeklyIntentionRow.intention_text.trim() !== '') {
                    if (isMounted) setWeeklyFocus(weeklyIntentionRow.intention_text.trim());
                } else {
                    if (isMounted) setWeeklyFocus(null);
                }

                // 6. Today's Training / Directive: from latest `missions` row for today/contract
                let missionRows: any[] | null = null;
                if (activeContract?.id) {
                    const { data: mData } = await supabase
                        .from('missions')
                        .select('title, directive, blocks, created_at, mission_date')
                        .eq('contract_id', activeContract.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    missionRows = mData;
                }

                if (!missionRows || missionRows.length === 0) {
                    const { data: mDataUser } = await supabase
                        .from('missions')
                        .select('title, directive, blocks, created_at, mission_date')
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

                    const category = getTrainingCategory(m.title, directiveVal);

                    if (isMounted) {
                        setFocusMission({
                            title: m.title || null,
                            directive: directiveVal,
                            category: category
                        });
                    }
                } else {
                    if (isMounted) setFocusMission(null);
                }

                // 7. Next Ice: only planned training_sessions or missions with on_ice type in the future.
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
                    "bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group hover:border-primary/40 transition-all duration-300 min-h-[340px] md:min-h-[400px] select-none block cursor-pointer text-foreground",
                    className
                )}
            >
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center space-y-4 h-full my-auto">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <Activity size={28} />
                    </div>
                    <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Complete Athlete Profile</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Set up your identity and primary sport to activate your Goalie Card.
                        </p>
                    </div>
                </div>
            </Link>
        );
    }

    // Phase Label (never derived from dates)
    const phaseLabel = formatPhaseLabel(contract?.phase);

    // Primary Sport and Journey Date Display
    const primarySportDisplay = identity.primarySport ? (identity.primarySport.charAt(0).toUpperCase() + identity.primarySport.slice(1)) : "";
    const sinceDateDisplay = contract?.startDate ? `Since ${formatDateDisplay(contract.startDate)}` : (primarySportDisplay || "");
    const contractTitleDisplay = contract?.name || "";

    return (
        <div 
            className={twMerge(
                "w-full bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300 min-h-[350px] text-foreground",
                className
            )}
        >
            {/* TOP HEADER: IDENTITY */}
            <div className="relative z-10 flex flex-col min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight break-words">
                    {identity.fullName}
                </h2>
                
                {/* Handedness & Sport Subheader */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mt-1">
                    {identity.handedness && (
                        <span>{identity.handedness}</span>
                    )}
                    {identity.handedness && primarySportDisplay && (
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    )}
                    {primarySportDisplay && (
                        <span>{primarySportDisplay}</span>
                    )}
                </div>

                {/* Team line ONLY if users.teams is non-empty */}
                {identity.teams && identity.teams.length > 0 && (
                    <div className="text-xs font-bold text-primary tracking-wide mt-1 break-words">
                        {identity.teams.join(' · ')}
                    </div>
                )}
            </div>

            {/* MIDDLE CONTENT: WEEKLY FOCUS & TODAY'S TRAINING */}
            <div className="relative z-10 my-4 flex flex-col gap-3">
                {/* WEEKLY FOCUS WIDGET (Links to /calendar/week) */}
                {weeklyFocus && (
                    <Link 
                        href="/calendar/week"
                        className="group/card bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-primary/40 rounded-2xl p-3.5 transition-all duration-200 block cursor-pointer"
                    >
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground group-hover/card:text-foreground transition-colors">
                                    Focus for the Week
                                </span>
                            </div>
                            <ArrowRight size={12} className="text-muted-foreground group-hover/card:text-primary group-hover/card:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug break-words pl-3">
                            {weeklyFocus}
                        </p>
                    </Link>
                )}

                {/* TODAY'S TRAINING WIDGET (Links to /training) */}
                {focusMission && (
                    <Link 
                        href="/training"
                        className="group/card bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-primary/40 rounded-2xl p-3.5 transition-all duration-200 block cursor-pointer"
                    >
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground group-hover/card:text-foreground transition-colors">
                                    Today&apos;s Training
                                </span>
                            </div>
                            <ArrowRight size={12} className="text-muted-foreground group-hover/card:text-primary group-hover/card:translate-x-0.5 transition-all shrink-0" />
                        </div>
                        <div className="pl-3">
                            <p className="text-sm font-bold text-foreground tracking-tight">
                                {focusMission.category}
                            </p>
                            {focusMission.directive && (
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-1 leading-snug">
                                    {focusMission.directive}
                                </p>
                            )}
                        </div>
                    </Link>
                )}

                {/* NEXT ICE (Only future on_ice sessions; hidden if none) */}
                {nextIce && (
                    <div className="flex items-center justify-between text-xs bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3.5 py-2 text-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                            <Snowflake size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span className="font-semibold break-words">Next Ice: {nextIce.title}</span>
                        </div>
                        <span className="font-bold shrink-0 text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 ml-2">
                            {formatShortDate(nextIce.date)}
                        </span>
                    </div>
                )}
            </div>

            {/* BOTTOM FOOTER: JOURNEY START DATE on top row, PHASE & CONTRACT on row below */}
            <div className="relative z-10 pt-3 border-t border-border/60 flex flex-col gap-1 text-muted-foreground text-xs">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground/80 text-[11px]">{sinceDateDisplay}</span>
                    {identity.gcNumber && (
                        <span className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                            {identity.gcNumber}
                        </span>
                    )}
                </div>
                {(phaseLabel || contractTitleDisplay) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        {phaseLabel && (
                            <span className="font-medium text-primary shrink-0">{phaseLabel}</span>
                        )}
                        {phaseLabel && contractTitleDisplay && (
                            <span className="text-muted-foreground/40 shrink-0">·</span>
                        )}
                        {contractTitleDisplay && (
                            <span className="truncate">{contractTitleDisplay}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


