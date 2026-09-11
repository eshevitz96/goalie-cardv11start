"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
    Users, 
    FileEdit, 
    CheckCircle2, 
    AlertCircle, 
    TrendingUp, 
    Calendar, 
    Clock, 
    MapPin, 
    ArrowLeft, 
    Sparkles, 
    Send, 
    Search, 
    MessageSquare, 
    CalendarCheck, 
    X,
    Lock,
    Shield,
    Check,
    Download
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { CoachScheduler } from "@/components/CoachScheduler";
import { submitSessionTakeaways, completeTrainingSessionAndNotify, requestCoachAccess, fetchCoachOSData } from "@/app/training/book/actions";

interface SessionWithAthlete {
    id: string;
    date: string;
    location: string;
    notes: string;
    session_number?: number;
    lesson_number?: number;
    goalie_id?: string;
    roster_id?: string;
    athlete_name: string;
    team?: string;
    email?: string;
    phone?: string;
    is_completed?: boolean;
    takeaways?: string;
}

interface AthleteRosterItem {
    id: string;
    goalie_name: string;
    team: string;
    grad_year?: string | number;
    email?: string;
    guardian_email?: string;
    phone?: string;
    lesson_count?: number;
    session_count?: number;
    completed_lessons?: number;
    remaining_lessons?: number;
    current_package?: string;
    package_status?: string;
    payment_status?: string;
    linked_user_id?: string;
    source?: string;
    stripe_billing_day?: string;
    stripe_sub_status?: string;
    stripe_sub_id?: string;
    is_pending?: boolean;
}

export default function CoachDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);
    const [userInitials, setUserInitials] = useState<string>("ES");
    const [userFullName, setUserFullName] = useState<string>("Coach Elliott");
    const [applicationSubmitted, setApplicationSubmitted] = useState(false);
    const [applicantNote, setApplicantNote] = useState("");
    const [submittingApp, setSubmittingApp] = useState(false);
    const [appError, setAppError] = useState<string | null>(null);
    const [coachId, setCoachId] = useState<string | null>(null);

    // Tab state: 'schedule' | 'athletes' | 'pending' | 'availability' | 'contracts'
    const [activeTab, setActiveTab] = useState<'schedule' | 'athletes' | 'pending' | 'availability' | 'contracts'>('schedule');

    // Data states
    const [sessions, setSessions] = useState<SessionWithAthlete[]>([]);
    const [athletes, setAthletes] = useState<AthleteRosterItem[]>([]);
    const [activeContracts, setActiveContracts] = useState<any[]>([]);

    // Filter states for schedule
    const [scheduleFilter, setScheduleFilter] = useState<'week' | 'march2026' | 'upcoming' | 'all'>('march2026');
    const [searchQuery, setSearchQuery] = useState("");

    // Takeaways modal state
    const [activeTakeawaySession, setActiveTakeawaySession] = useState<SessionWithAthlete | null>(null);
    const [takeawayText, setTakeawayText] = useState("");
    const [isSavingTakeaway, setIsSavingTakeaway] = useState(false);

    // Completion loading state
    const [completingId, setCompletingId] = useState<string | null>(null);

    // Compute week boundary dates (Monday 00:00 to Sunday 23:59)
    const { mondayStart, sundayEnd } = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
        const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const mon = new Date(today);
        mon.setDate(today.getDate() - daysSinceMon);
        mon.setHours(0, 0, 0, 0);

        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        sun.setHours(23, 59, 59, 999);

        return { mondayStart: mon, sundayEnd: sun };
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            let detectedInitials = "ES";
            let detectedName = "Coach Elliott";

            if (user) {
                setCurrentAuthUser(user);
                setCoachId(user.id);

                // Fetch user profile for display name & initials
                const [{ data: userData }, { data: profData }] = await Promise.all([
                    supabase
                        .from('users')
                        .select('first_name, last_name, display_name')
                        .eq('auth_user_id', user.id)
                        .maybeSingle(),
                    supabase
                        .from('profiles')
                        .select('goalie_name, full_name')
                        .eq('id', user.id)
                        .maybeSingle()
                ]);

                const rawName = userData?.display_name || 
                                (userData?.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : null) ||
                                profData?.full_name ||
                                profData?.goalie_name ||
                                user.user_metadata?.full_name ||
                                user.user_metadata?.name ||
                                user.user_metadata?.first_name ||
                                (user.email ? user.email.split('@')[0] : null);

                if (rawName) {
                    detectedName = rawName;
                    const parts = rawName.trim().split(/\s+/);
                    if (parts.length > 1) {
                        detectedInitials = ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase();
                    } else if (parts[0].length >= 2) {
                        detectedInitials = parts[0].slice(0, 2).toUpperCase();
                    } else {
                        detectedInitials = (parts[0][0] || 'C').toUpperCase();
                    }
                } else if (user.email) {
                    detectedName = user.email;
                    detectedInitials = user.email.slice(0, 2).toUpperCase();
                }
            }

            setUserInitials(detectedInitials);
            setUserFullName(detectedName);

            const res = await fetchCoachOSData(user?.id, user?.email || undefined);

            if (res.isAuthorized === false) {
                setIsAuthorized(false);
                setIsLoading(false);
                return;
            }

            setIsAuthorized(true);
            if (res.success && res.sessions && res.athletes) {
                setSessions(res.sessions);
                setAthletes(res.athletes);
                setActiveContracts(res.contracts || []);
            } else {
                // Client-side fallback if server action returned non-success
                const [{ data: clientRosters }, { data: clientSessions }] = await Promise.all([
                    supabase.from('roster_uploads').select('*').order('goalie_name', { ascending: true }),
                    supabase.from('sessions').select('*').order('date', { ascending: false })
                ]);

                if (clientSessions || clientRosters) {
                    const fallbackRosters = clientRosters || [];
                    const fallbackSessions = (clientSessions || []).map(sess => {
                        const matchRoster = fallbackRosters.find(r => r.id === sess.roster_id || (sess.notes && r.goalie_name && sess.notes.includes(r.goalie_name)));
                        return {
                            id: sess.id,
                            date: sess.date,
                            location: sess.location || "Field / Training Facility",
                            notes: sess.notes || "",
                            session_number: sess.session_number,
                            lesson_number: sess.lesson_number,
                            goalie_id: sess.goalie_id,
                            roster_id: sess.roster_id,
                            athlete_name: matchRoster?.goalie_name || (sess.notes ? sess.notes.split(' - ')[0] : "Athlete"),
                            team: matchRoster?.team || "Private Client",
                            email: matchRoster?.email || matchRoster?.guardian_email || "",
                            phone: matchRoster?.phone || "",
                            is_completed: sess.notes?.includes('[Session Completed') || (sess.date && new Date(sess.date).getTime() < Date.now())
                        };
                    });

                    const fallbackAthletes = fallbackRosters.map(r => ({
                        id: r.id,
                        goalie_name: r.goalie_name || "Athlete",
                        team: r.team || "Private Client",
                        grad_year: r.grad_year || "",
                        email: r.email || r.guardian_email || "",
                        guardian_email: r.guardian_email || "",
                        phone: r.phone || "",
                        lesson_count: r.lesson_count || 4,
                        session_count: r.session_count || 0,
                        completed_lessons: r.session_count || 0,
                        remaining_lessons: Math.max(0, (r.lesson_count || 4) - (r.session_count || 0)),
                        payment_status: 'paid',
                        is_pending: false,
                        source: 'Roster'
                    }));

                    setSessions(fallbackSessions);
                    setAthletes(fallbackAthletes);
                    if (res?.contracts) setActiveContracts(res.contracts);
                }
            }
        } catch (err) {
            console.error("Error loading CoachCard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    // Safe date parsing helper
    const parseSafeDate = (dateStr?: string | null): Date | null => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
        }
        const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (slashMatch) {
            return new Date(parseInt(slashMatch[3]), parseInt(slashMatch[1]) - 1, parseInt(slashMatch[2]));
        }
        return null;
    };

    // Filter sessions based on active filter and search query
    const filteredSessions = useMemo(() => {
        return sessions.filter(sess => {
            const parsedDate = parseSafeDate(sess.date);
            const sessTime = parsedDate ? parsedDate.getTime() : 0;
            const matchesSearch = !searchQuery || 
                                  sess.athlete_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (sess.team && sess.team.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                  (sess.location && sess.location.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (scheduleFilter === 'week') {
                return sessTime >= mondayStart.getTime() && sessTime <= sundayEnd.getTime();
            } else if (scheduleFilter === 'march2026') {
                return sessTime >= new Date(2026, 2, 1).getTime();
            } else if (scheduleFilter === 'upcoming') {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                return sessTime >= startOfToday.getTime();
            }
            return true;
        });
    }, [sessions, scheduleFilter, searchQuery, mondayStart, sundayEnd]);

    // Sessions count for this week specifically
    const weekSessionsCount = useMemo(() => {
        return sessions.filter(sess => {
            const parsed = parseSafeDate(sess.date);
            const sessTime = parsed ? parsed.getTime() : 0;
            return sessTime >= mondayStart.getTime() && sessTime <= sundayEnd.getTime();
        }).length;
    }, [sessions, mondayStart, sundayEnd]);

    // Sessions count for March 2026 - present
    const march2026Count = useMemo(() => {
        const march1 = new Date(2026, 2, 1).getTime();
        return sessions.filter(sess => {
            const parsed = parseSafeDate(sess.date);
            return parsed ? parsed.getTime() >= march1 : false;
        }).length;
    }, [sessions]);

    // Sessions count for upcoming
    const upcomingSessionsCount = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return sessions.filter(sess => {
            const parsed = parseSafeDate(sess.date);
            return parsed ? parsed.getTime() >= startOfToday.getTime() : false;
        }).length;
    }, [sessions]);

    // Completed sessions count
    const completedSessionsCount = useMemo(() => {
        return sessions.filter(s => s.is_completed).length;
    }, [sessions]);

    // Active vs Pending athletes (ensuring all non-pending athletes show in roster)
    const activeAthletes = useMemo(() => {
        return athletes.filter(a => !a.is_pending);
    }, [athletes]);

    const pendingAthletes = useMemo(() => {
        return athletes.filter(a => a.is_pending || a.payment_status === 'pending');
    }, [athletes]);

    // Handle session completion
    const handleCompleteSession = async (session: SessionWithAthlete) => {
        if (!confirm(`Mark training session with ${session.athlete_name} as completed?`)) return;

        setCompletingId(session.id);
        try {
            const res = await completeTrainingSessionAndNotify({
                sessionId: session.id,
                athleteName: session.athlete_name,
                clientEmail: session.email,
                coachNotes: session.takeaways || "Session wrapped on field."
            });

            if (res && res.error) {
                alert(`Error: ${res.error}`);
            } else {
                await fetchDashboardData();
            }
        } catch (err: any) {
            console.error("Error completing session:", err);
            alert("Failed to complete session.");
        } finally {
            setCompletingId(null);
        }
    };

    // Handle saving coach takeaways
    const handleSaveTakeaways = async () => {
        if (!activeTakeawaySession) return;
        setIsSavingTakeaway(true);
        try {
            const res = await submitSessionTakeaways({
                sessionId: activeTakeawaySession.id,
                takeaways: takeawayText,
                authorRole: 'coach',
                authorName: 'Coach',
                clientEmail: activeTakeawaySession.email
            });

            if (res && res.error) {
                alert(`Error: ${res.error}`);
            } else {
                setActiveTakeawaySession(null);
                setTakeawayText("");
                await fetchDashboardData();
            }
        } catch (err) {
            console.error("Error saving takeaways:", err);
            alert("Failed to save coach takeaways.");
        } finally {
            setIsSavingTakeaway(false);
        }
    };

    const currentMRR = activeContracts.reduce((sum, c) => sum + (c.price || 0), 0);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center animate-pulse">
                        <Sparkles className="text-[#00E676] animate-spin" size={24} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verifying Coach Authorization...</p>
                </div>
            </main>
        );
    }

    if (isAuthorized === false) {
        return (
            <main className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4 md:p-8">
                <div className="max-w-xl w-full bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Glow accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                            <Lock size={12} /> CoachOS Platform Access
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enrolled Coaches Only</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
                        GoalieCard <span className="text-[#00E676]">CoachOS</span>
                    </h1>
                    
                    <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                        Access to weekly private lesson dispatches, multi-athlete rosters, automated parent session takeaways, and recurring film contracts is strictly reserved for enrolled coaches.
                    </p>

                    {/* Features list */}
                    <div className="space-y-3 mb-8 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1 rounded-md bg-[#00E676]/10 text-[#00E676] mt-0.5">
                                <Check size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-200">Complete Athlete & Lesson Management</p>
                                <p className="text-[11px] text-zinc-500">Live roster tracking, lesson balance ledger, and automated parent notes.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-1 rounded-md bg-[#00E676]/10 text-[#00E676] mt-0.5">
                                <Check size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-200">Weekly Schedule & Slot Automation</p>
                                <p className="text-[11px] text-zinc-500">Real-time scheduling sync with 24-hr policy lock and one-click completion.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-1 rounded-md bg-[#00E676]/10 text-[#00E676] mt-0.5">
                                <Check size={14} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-zinc-200">Dual-Use: Coach & Train</p>
                                <p className="text-[11px] text-zinc-500">Maintain your personal Goalie Card while directing private clients on one account.</p>
                            </div>
                        </div>
                    </div>

                    {/* Application Form or Status */}
                    {applicationSubmitted ? (
                        <div className="bg-[#00E676]/10 border border-[#00E676]/30 rounded-2xl p-4 mb-6 text-center">
                            <CheckCircle2 className="text-[#00E676] mx-auto mb-2" size={24} />
                            <h4 className="text-sm font-bold text-white">Enrollment Request Received</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                                Your coach enrollment request has been routed to platform administration (<span className="text-[#00E676]">eshevitz96@gmail.com</span>). You will be notified once activated.
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 space-y-3">
                            <textarea
                                value={applicantNote}
                                onChange={(e) => setApplicantNote(e.target.value)}
                                placeholder="Optional: Enter coaching credentials, club/school affiliation, or notes..."
                                rows={2}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E676] transition-colors resize-none"
                            />
                            {appError && <p className="text-xs text-red-400">{appError}</p>}
                            <button
                                onClick={async () => {
                                    setSubmittingApp(true);
                                    setAppError(null);
                                    try {
                                        const email = currentAuthUser?.email || "unauthenticated-user";
                                        const res = await requestCoachAccess({
                                            userId: currentAuthUser?.id,
                                            userEmail: email,
                                            userName: currentAuthUser?.user_metadata?.full_name || email,
                                            experienceNotes: applicantNote
                                        });
                                        if (res && res.error) {
                                            setAppError(res.error);
                                        } else {
                                            setApplicationSubmitted(true);
                                        }
                                    } catch (e: any) {
                                        setAppError(e.message || "Failed to submit request.");
                                    } finally {
                                        setSubmittingApp(false);
                                    }
                                }}
                                disabled={submittingApp}
                                className="w-full py-3.5 px-4 rounded-xl bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#00E676]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submittingApp ? <Sparkles size={14} className="animate-spin" /> : <Shield size={14} />}
                                {submittingApp ? "Submitting Application..." : "Request CoachOS Enrollment"}
                            </button>
                        </div>
                    )}

                    {/* Return button */}
                    <Link
                        href="/dashboard"
                        className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={14} /> Return to Goalie Card
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-7xl mx-auto pb-24">
            {/* TOP HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">The Goalie Brand</span>
                        <span className="text-[10px] font-bold text-[#00E676] uppercase tracking-widest">Coaching Command Center</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        Coach<span className="text-[#00E676]">Card</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* PRIMARY ACTION: SWITCH TO MY GOALIE CARD */}
                    <Link 
                        href="/dashboard" 
                        className="bg-card hover:bg-muted border-2 border-[#00E676] text-[#00E676] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <ArrowLeft size={14} /> My Goalie Card
                    </Link>

                    <Link 
                        href="/calendar" 
                        className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border flex items-center gap-2"
                    >
                        <Calendar size={14} /> Full Calendar
                    </Link>

                    <a 
                        href="/api/coach/export-ical?scope=all" 
                        download="goaliecard-schedule.ics"
                        className="bg-card hover:bg-muted text-foreground border border-border hover:border-[#00E676] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                        title="Download .ics Calendar File for Apple Calendar, Google Calendar, or Outlook"
                    >
                        <Download size={14} className="text-[#00E676]" /> Export iCal (.ics)
                    </a>

                    <Link 
                        href="/coach/contracts" 
                        className="bg-[#00E676] hover:bg-[#00C853] text-black px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                    >
                        <FileEdit size={14} /> Contract Builder
                    </Link>

                    <div className="relative group z-50">
                        <button className="h-10 w-10 rounded-full bg-card flex items-center justify-center border-2 border-border hover:border-[#00E676] transition-colors shadow-xs">
                            <span className="font-bold text-sm text-foreground">{userInitials}</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right backdrop-blur-md">
                            <div className="px-3 py-2 border-b border-border mb-1">
                                <p className="text-xs font-bold text-foreground m-0 truncate">{userFullName}</p>
                                <p className="text-[11px] text-muted-foreground truncate m-0">{currentAuthUser?.email || "coach@thegoaliebrand.com"}</p>
                            </div>
                            <Link href="/dashboard" className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <ArrowLeft size={14} className="text-[#00E676]" /> Goalie Dashboard
                            </Link>
                            <Link href="/profile" className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <Users size={14} /> Account Profile
                            </Link>
                            <div className="h-px bg-border my-1" />
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-8 h-8 border-2 border-[#00E676] border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Your Coach Dashboard...</div>
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* TOP STATS CARDS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">This Week's Lessons</span>
                                <div className="p-2 bg-[#00E676]/10 text-[#00E676] rounded-lg">
                                    <CalendarCheck size={16} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-foreground">{weekSessionsCount}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">Booked private sessions</div>
                        </div>

                        <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Athletes</span>
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <Users size={16} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-foreground">{activeAthletes.length}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">Roster & private clients</div>
                        </div>

                        <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Completed Lessons</span>
                                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-foreground">{completedSessionsCount}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">Total delivered sessions</div>
                        </div>

                        <div className="bg-card border border-border rounded-[24px] p-5 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">March 2026 – Present</span>
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                    <TrendingUp size={16} />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-foreground">{march2026Count}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">Delivered & booked lessons</div>
                        </div>
                    </div>

                    {/* MAIN NAVIGATION TABS */}
                    <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === 'schedule' 
                                    ? "bg-[#00E676] text-black shadow-sm" 
                                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Calendar size={14} /> Weekly Lessons & Schedule
                            <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                activeTab === 'schedule' ? "bg-black/20 text-black" : "bg-background text-foreground"
                            )}>
                                {sessions.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('athletes')}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === 'athletes' 
                                    ? "bg-[#00E676] text-black shadow-sm" 
                                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Users size={14} /> My Athletes ({activeAthletes.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('pending')}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap border",
                                activeTab === 'pending' 
                                    ? "bg-amber-400 text-black border-amber-400 shadow-sm" 
                                    : pendingAthletes.length > 0 
                                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20" 
                                        : "bg-muted/60 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Clock size={14} /> Pending Inquiries
                            <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                activeTab === 'pending' ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-300 font-black"
                            )}>
                                {pendingAthletes.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('availability')}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === 'availability' 
                                    ? "bg-[#00E676] text-black shadow-sm" 
                                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Clock size={14} /> Availability Manager
                        </button>

                        <button
                            onClick={() => setActiveTab('contracts')}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
                                activeTab === 'contracts' 
                                    ? "bg-[#00E676] text-black shadow-sm" 
                                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Sparkles size={14} /> Tiers & Contracts ({activeContracts.length})
                        </button>
                    </div>

                    {/* TAB CONTENT: 1. SCHEDULE & THIS WEEK'S LESSONS */}
                    {activeTab === 'schedule' && (
                        <div className="space-y-6">
                            {/* Filter and Search Bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-2xl p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Filter:</span>
                                    <button
                                        onClick={() => setScheduleFilter('week')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                            scheduleFilter === 'week' 
                                                ? "bg-[#00E676] text-black" 
                                                : "bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        This Week ({weekSessionsCount})
                                    </button>
                                    <button
                                        onClick={() => setScheduleFilter('march2026')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                            scheduleFilter === 'march2026' 
                                                ? "bg-[#00E676] text-black" 
                                                : "bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        March 2026 – Present ({march2026Count})
                                    </button>
                                    <button
                                        onClick={() => setScheduleFilter('upcoming')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                            scheduleFilter === 'upcoming' 
                                                ? "bg-[#00E676] text-black" 
                                                : "bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        All Upcoming ({upcomingSessionsCount})
                                    </button>
                                    <button
                                        onClick={() => setScheduleFilter('all')}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                                            scheduleFilter === 'all' 
                                                ? "bg-[#00E676] text-black" 
                                                : "bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Full History ({sessions.length})
                                    </button>

                                    <a
                                        href={`/api/coach/export-ical?scope=${scheduleFilter}`}
                                        download={`goaliecard-schedule-${scheduleFilter}.ics`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-card hover:bg-muted text-foreground border border-border hover:border-[#00E676] transition-colors shadow-xs"
                                        title="Export current filtered sessions to iCal (.ics)"
                                    >
                                        <Download size={13} className="text-[#00E676]" />
                                        <span>Export .ics</span>
                                    </a>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search athlete, team, facility..."
                                        className="w-full bg-muted/60 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#00E676]"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* SESSIONS LIST */}
                            {filteredSessions.length === 0 ? (
                                <div className="bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                                    <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Calendar size={24} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-1">No Booked Lessons Found</h3>
                                    <p className="text-muted-foreground text-xs max-w-sm mb-6">
                                        {scheduleFilter === 'week' 
                                            ? "No private training sessions are booked for this active week yet." 
                                            : "No sessions match the selected filter criteria."}
                                    </p>
                                    <button 
                                        onClick={() => setActiveTab('availability')}
                                        className="bg-[#00E676] hover:bg-[#00C853] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Add Coach Availability Slots
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredSessions.map((sess) => {
                                        const sessDate = new Date(sess.date);
                                        const isToday = new Date().toDateString() === sessDate.toDateString();

                                        return (
                                            <div 
                                                key={sess.id}
                                                className={clsx(
                                                    "bg-card border rounded-[22px] p-5 flex flex-col justify-between transition-all hover:shadow-md",
                                                    isToday ? "border-[#00E676] ring-1 ring-[#00E676]/30" : "border-border"
                                                )}
                                            >
                                                <div>
                                                    {/* Top row: Date badge & Status */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2.5 py-1 bg-muted rounded-lg text-xs font-bold text-foreground flex items-center gap-1.5">
                                                                <Calendar size={12} className="text-[#00E676]" />
                                                                {sessDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            {isToday && (
                                                                <span className="bg-[#00E676] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                                                    Today
                                                                </span>
                                                            )}
                                                        </div>

                                                        {sess.is_completed ? (
                                                            <span className="bg-green-500/10 text-green-500 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Completed
                                                            </span>
                                                        ) : (
                                                            <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <Clock size={10} /> Confirmed
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Athlete & Location Info */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-lg font-bold text-foreground leading-snug">
                                                                {sess.athlete_name}
                                                            </h4>
                                                            {(sess.session_number || sess.lesson_number) && (
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded font-mono">
                                                                    {[
                                                                        sess.session_number ? `S${sess.session_number}` : '',
                                                                        sess.lesson_number ? `L${sess.lesson_number}` : ''
                                                                    ].filter(Boolean).join(', ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                                                            {sess.team || "Private Client"}
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5 truncate">
                                                                <MapPin size={13} className="text-muted-foreground shrink-0" />
                                                                <span className="truncate">{sess.location}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <Clock size={13} className="text-muted-foreground shrink-0" />
                                                                <span>{sessDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Coach Takeaways Banner (if present) */}
                                                    {sess.takeaways && (
                                                        <div className="bg-muted/50 border border-border/80 rounded-xl p-3 mb-4">
                                                            <div className="text-[10px] font-bold text-[#00E676] uppercase tracking-wider mb-1 flex items-center gap-1">
                                                                <MessageSquare size={11} /> Coach Takeaways
                                                            </div>
                                                            <p className="text-xs text-foreground/90 italic leading-relaxed line-clamp-2">
                                                                "{sess.takeaways}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 pt-3 border-t border-border/60">
                                                    <button
                                                        onClick={() => {
                                                            setActiveTakeawaySession(sess);
                                                            setTakeawayText(sess.takeaways || "");
                                                        }}
                                                        className="flex-1 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                                    >
                                                        <MessageSquare size={13} /> {sess.takeaways ? "Edit Takeaways" : "Add Takeaways"}
                                                    </button>

                                                    {!sess.is_completed && (
                                                        <button
                                                            onClick={() => handleCompleteSession(sess)}
                                                            disabled={completingId === sess.id}
                                                            className="bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={13} /> {completingId === sess.id ? "Wrapping..." : "Complete"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 2. MY ATHLETES & ROSTER */}
                    {activeTab === 'athletes' && (
                        <div className="space-y-8">
                                {/* 1. ACTIVE ATHLETES & CLIENTS */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <h3 className="text-lg font-bold">Assigned Athletes & Clients</h3>
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
                                                    {activeAthletes.length} Active
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Active training roster, package allowances, and 2026 lesson counts</p>
                                        </div>
                                    </div>

                                    {activeAthletes.length === 0 ? (
                                        <div className="bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                                            <Users size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                                            <h3 className="text-base font-bold">No Active Athletes</h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                                Enrolled athletes will show here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {activeAthletes.map((athlete) => {
                                                const remaining = athlete.remaining_lessons !== undefined ? athlete.remaining_lessons : Math.max(0, (athlete.lesson_count || 4) - (athlete.completed_lessons || 0));
                                                const isPaused = athlete.stripe_sub_status === 'Paused in Stripe';
                                                const isActiveStripe = athlete.stripe_sub_status === 'Active Auto-Renew';

                                                return (
                                                    <div key={athlete.id} className="bg-card border border-border rounded-[22px] p-5 flex flex-col justify-between hover:border-[#00E676]/50 transition-colors shadow-sm">
                                                        <div>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h4 className="font-bold text-base text-foreground leading-tight">{athlete.goalie_name}</h4>
                                                                        {isPaused ? (
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
                                                                                <span>⏸️</span> Paused in Stripe
                                                                            </span>
                                                                        ) : isActiveStripe ? (
                                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                                                                                <span>⚡</span> Auto-Renew
                                                                            </span>
                                                                        ) : athlete.payment_status ? (
                                                                            <span className={clsx(
                                                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                                                athlete.payment_status === 'paid' || athlete.payment_status === 'enrolled' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                                            )}>
                                                                                {athlete.payment_status}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                                        {athlete.team || "Private Client"} {athlete.grad_year ? `• '` + String(athlete.grad_year).slice(-2) : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border shrink-0 text-foreground">
                                                                    {athlete.goalie_name.charAt(0)}
                                                                </div>
                                                            </div>

                                                            {/* Stripe Billing & Status Notice */}
                                                            {athlete.stripe_billing_day ? (
                                                                <div className={clsx(
                                                                    "p-2.5 rounded-xl border text-[11px] mb-3 flex items-center justify-between",
                                                                    isPaused ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                                                )}>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span>🗓️</span>
                                                                        <span className="font-semibold">{athlete.stripe_billing_day}</span>
                                                                    </div>
                                                                    {isPaused && (
                                                                        <span className="text-[10px] text-amber-400/80 font-mono font-medium">Invoicing Draft</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="p-2.5 rounded-xl border border-border/40 bg-muted/30 text-[11px] mb-3 flex items-center gap-1.5 text-muted-foreground">
                                                                    <span>💳</span>
                                                                    <span>Direct / Offline Package</span>
                                                                </div>
                                                            )}

                                                            <div className="space-y-2 py-3 border-y border-border/50 my-3 text-xs">
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>2026 Total Lessons:</span>
                                                                    <span className="font-black text-foreground">{athlete.session_count || 0}</span>
                                                                </div>
                                                                {athlete.current_package && (
                                                                    <div className="flex justify-between text-muted-foreground">
                                                                        <span>Current Package:</span>
                                                                        <span className="font-semibold text-foreground font-mono">{athlete.current_package}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between items-center text-muted-foreground">
                                                                    <span>Package Status:</span>
                                                                    <span className={clsx(
                                                                        "font-black px-2 py-0.5 rounded-md text-[11px]",
                                                                        remaining > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                                                    )}>
                                                                        {athlete.package_status ? athlete.package_status : (remaining > 0 ? `In progress — ${remaining} left` : 'Complete')}
                                                                    </span>
                                                                </div>
                                                                {athlete.email && (
                                                                    <div className="flex justify-between text-muted-foreground truncate pt-1">
                                                                        <span>Email:</span>
                                                                        <span className="font-semibold text-foreground truncate max-w-[160px]">{athlete.email}</span>
                                                                    </div>
                                                                )}
                                                                {athlete.phone && (
                                                                    <div className="flex justify-between text-muted-foreground">
                                                                        <span>Phone:</span>
                                                                        <span className="font-semibold text-foreground">{athlete.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 pt-1">
                                                            <Link
                                                                href={`/calendar`}
                                                                className="w-full bg-muted hover:bg-muted/80 text-foreground text-xs font-bold py-2 rounded-xl text-center transition-colors border border-border/50"
                                                            >
                                                                View Schedule
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* 2. PENDING INQUIRIES & INVITES */}
                                {pendingAthletes.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-border/60">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="text-lg font-bold text-amber-400">Pending Inquiries & Invites</h3>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                        {pendingAthletes.length} Pending
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Athletes with pending invitations or awaiting private training confirmation</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingAthletes.map((athlete) => (
                                                <div key={athlete.id} className="bg-card border border-amber-500/30 rounded-[22px] p-5 flex flex-col justify-between shadow-sm bg-gradient-to-b from-amber-500/[0.04] to-transparent">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-base text-foreground leading-tight">{athlete.goalie_name}</h4>
                                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                                        ⏳ Pending
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    {athlete.team || "Private Client"} {athlete.grad_year ? `• '` + String(athlete.grad_year).slice(-2) : ''}
                                                                </div>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/20 shrink-0">
                                                                {athlete.goalie_name.charAt(0)}
                                                            </div>
                                                        </div>

                                                        <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] mb-3 text-amber-300">
                                                            <span>Private training invitation pending confirmation.</span>
                                                        </div>

                                                        <div className="space-y-2 py-3 border-y border-border/50 my-3 text-xs">
                                                            {athlete.email && (
                                                                <div className="flex justify-between text-muted-foreground truncate">
                                                                    <span>Email:</span>
                                                                    <span className="font-semibold text-foreground truncate max-w-[160px]">{athlete.email}</span>
                                                                </div>
                                                            )}
                                                            {athlete.phone && (
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>Phone:</span>
                                                                    <span className="font-semibold text-foreground">{athlete.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <a
                                                            href={`mailto:${athlete.email}`}
                                                            className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold py-2 rounded-xl text-center transition-colors"
                                                        >
                                                            Send Email Follow-Up
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    {/* TAB CONTENT: 2B. DEDICATED PENDING TAB */}
                    {activeTab === 'pending' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-lg font-bold text-amber-400">Pending Inquiries & Invites</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                            {pendingAthletes.length} Pending
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Prospective goalies with outstanding private training invitations or pending registration forms</p>
                                </div>
                            </div>

                            {pendingAthletes.length === 0 ? (
                                <div className="bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3 opacity-80" />
                                    <h3 className="text-base font-bold">No Pending Inquiries</h3>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                        All clients are actively enrolled or registered.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pendingAthletes.map((athlete) => (
                                        <div key={athlete.id} className="bg-card border border-amber-500/30 rounded-[22px] p-5 flex flex-col justify-between shadow-sm bg-gradient-to-b from-amber-500/[0.04] to-transparent">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-base text-foreground leading-tight">{athlete.goalie_name}</h4>
                                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                                ⏳ Pending
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {athlete.team || "Private Client"} {athlete.grad_year ? `• '` + String(athlete.grad_year).slice(-2) : ''}
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/20 shrink-0">
                                                        {athlete.goalie_name.charAt(0)}
                                                    </div>
                                                </div>

                                                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] mb-3 text-amber-300">
                                                    <span>Private training invitation pending confirmation.</span>
                                                </div>

                                                <div className="space-y-2 py-3 border-y border-border/50 my-3 text-xs">
                                                    {athlete.email && (
                                                        <div className="flex justify-between text-muted-foreground truncate">
                                                            <span>Email:</span>
                                                            <span className="font-semibold text-foreground truncate max-w-[160px]">{athlete.email}</span>
                                                        </div>
                                                    )}
                                                    {athlete.phone && (
                                                        <div className="flex justify-between text-muted-foreground">
                                                            <span>Phone:</span>
                                                            <span className="font-semibold text-foreground">{athlete.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <a
                                                    href={`mailto:${athlete.email}`}
                                                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold py-2 rounded-xl text-center transition-colors"
                                                >
                                                    Send Email Follow-Up
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: 3. AVAILABILITY SCHEDULER */}
                    {activeTab === 'availability' && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-[24px] p-6">
                                <CoachScheduler />
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: 4. TIERS & CONTRACTS */}
                    {activeTab === 'contracts' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">Active Subscriptions</h3>
                                    <p className="text-xs text-muted-foreground">Recurring client tiers and film review contracts</p>
                                </div>
                                <Link 
                                    href="/coach/contracts" 
                                    className="bg-[#00E676] hover:bg-[#00C853] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <FileEdit size={14} /> Contract Builder
                                </Link>
                            </div>

                            {activeContracts.length === 0 ? (
                                <div className="bg-card border border-border rounded-[24px] p-12 text-center flex flex-col items-center">
                                    <Users size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                                    <h3 className="text-base font-bold">No Active Subscriptions Yet</h3>
                                    <p className="text-muted-foreground text-xs max-w-sm mt-1 mb-4">
                                        Use the Contract Builder to create recurring subscription tiers for private training or film reviews.
                                    </p>
                                    <Link
                                        href="/coach/contracts"
                                        className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-border"
                                    >
                                        Create New Contract Tier
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeContracts.map((contract) => (
                                        <div key={contract.contract_id || contract.id} className="bg-card border border-border rounded-[20px] p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="font-bold text-base text-foreground">{contract.athlete_name}</div>
                                                    <div className="text-xs font-bold text-[#00E676] uppercase tracking-wider mt-0.5">{contract.tier_name}</div>
                                                </div>
                                                <div className="px-2.5 py-1 rounded-full bg-[#00E676]/10 text-[#00E676] text-[10px] font-bold uppercase tracking-wider border border-[#00E676]/25">
                                                    Active Plan
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* COACH TAKEAWAYS MODAL */}
            {activeTakeawaySession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card border border-border rounded-[24px] max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <MessageSquare size={18} className="text-[#00E676]" />
                                    Session Takeaways & Coach Notes
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Athlete: <strong className="text-foreground">{activeTakeawaySession.athlete_name}</strong> • {new Date(activeTakeawaySession.date).toLocaleDateString()}
                                </p>
                            </div>
                            <button 
                                onClick={() => setActiveTakeawaySession(null)}
                                className="text-muted-foreground hover:text-foreground p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                What worked well & what should the goalie focus on next?
                            </label>
                            <textarea
                                value={takeawayText}
                                onChange={(e) => setTakeawayText(e.target.value)}
                                placeholder="e.g. Explosive low saves looked sharp today. Focus on maintaining high hands when stepping off hip angle..."
                                rows={5}
                                className="w-full bg-muted/60 border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-[#00E676] leading-relaxed resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setActiveTakeawaySession(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTakeaways}
                                disabled={isSavingTakeaway || !takeawayText.trim()}
                                className="bg-[#00E676] hover:bg-[#00C853] text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Send size={13} /> {isSavingTakeaway ? "Saving..." : "Save & Sync to Goalie Card"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
