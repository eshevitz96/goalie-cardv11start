"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { 
    Loader2, 
    Calendar, 
    MapPin, 
    ChevronDown, 
    ChevronUp, 
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    Send,
    X
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { 
    INITIAL_TRAINING_SLOTS 
} from "@/constants/trainingAvailability";
import { 
    rescheduleTrainingSession, 
    completeTrainingSessionAndNotify, 
    submitSessionTakeaways 
} from "@/app/training/book/actions";

interface LessonsTransparencyProps {
    goalieProfileId: string | null;
    userEmail?: string;
    userRole?: string;
    goalieName?: string;
}

interface GoalieLessonBalance {
    goalie_id: string;
    email: string;
    goalie_name: string;
    lessons_earned: number;
    lessons_delivered: number;
    lessons_remaining: number;
}

interface SessionRecord {
    id: string;
    date: string;
    location: string;
    notes: string;
    session_number?: number;
    lesson_number?: number;
    start_time?: string;
}

export function LessonsTransparency({ 
    goalieProfileId,
    userEmail,
    userRole,
    goalieName
}: LessonsTransparencyProps) {
    const [balance, setBalance] = useState<GoalieLessonBalance | null>(null);
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'training' | 'history' | 'missions'>('training');

    // Rescheduling Modal State
    const [reschedulingSession, setReschedulingSession] = useState<SessionRecord | null>(null);
    const [selectedNewSlotId, setSelectedNewSlotId] = useState<string | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);
    const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

    // Takeaways Modal State
    const [takeawaySession, setTakeawaySession] = useState<SessionRecord | null>(null);
    const [takeawayText, setTakeawayText] = useState("");
    const [isSavingTakeaways, setIsSavingTakeaways] = useState(false);
    const [takeawaySuccess, setTakeawaySuccess] = useState(false);

    // Completion State for Coach
    const [completingSessionId, setCompletingSessionId] = useState<string | null>(null);

    const isCoach = userRole === 'coach' || userEmail === 'e@cmmncreators.com' || (typeof window !== 'undefined' && localStorage.getItem('gc_dev_mode') === 'true');

    const fetchData = async () => {
        if (!goalieProfileId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Fetch balance using exact column names
            const { data: balanceData, error: balanceErr } = await supabase
                .from("goalie_lesson_balance")
                .select("goalie_id, email, goalie_name, lessons_earned, lessons_delivered, lessons_remaining")
                .eq("goalie_id", goalieProfileId)
                .maybeSingle();

            if (balanceErr) {
                console.error("Error fetching goalie_lesson_balance:", balanceErr);
            } else if (balanceData) {
                setBalance(balanceData as GoalieLessonBalance);
            } else {
                setBalance(null);
            }

            // 2. Fetch history filtering by goalie_id or roster_id
            const { data: sessionsData, error: sessionsErr } = await supabase
                .from("sessions")
                .select("id, date, location, notes, session_number, lesson_number, start_time")
                .or(`goalie_id.eq.${goalieProfileId},roster_id.eq.${goalieProfileId}`)
                .order("date", { ascending: false });

            if (sessionsErr) {
                console.error("Error fetching sessions:", sessionsErr);
            } else if (sessionsData) {
                setSessions(sessionsData as SessionRecord[]);
            }
        } catch (err: any) {
            console.error("Unexpected error in LessonsTransparency:", err);
            setError(err.message || "Failed to load lessons transparency data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [goalieProfileId]);

    // Check if a session is within 24 hours
    const isWithin24Hours = (sessionDateStr: string) => {
        const sessionTime = new Date(sessionDateStr).getTime();
        const now = Date.now();
        const diffHours = (sessionTime - now) / (1000 * 60 * 60);
        return diffHours >= 0 && diffHours < 24;
    };

    const isPastSession = (sessionDateStr: string) => {
        return new Date(sessionDateStr).getTime() < Date.now();
    };

    // Handle Reschedule Action
    const handleConfirmReschedule = async () => {
        if (!reschedulingSession || !selectedNewSlotId) return;

        setIsRescheduling(true);
        setRescheduleError(null);

        const res = await rescheduleTrainingSession({
            sessionId: reschedulingSession.id,
            newSlotId: selectedNewSlotId,
            requestedBy: isCoach ? 'coach' : 'client',
            clientEmail: balance?.email || userEmail,
            athleteName: balance?.goalie_name || goalieName || "Athlete"
        });

        setIsRescheduling(false);

        if (res.error) {
            setRescheduleError(res.error);
        } else {
            setRescheduleSuccess(true);
            setTimeout(() => {
                setRescheduleSuccess(false);
                setReschedulingSession(null);
                setSelectedNewSlotId(null);
                fetchData();
            }, 1500);
        }
    };

    // Handle Submit Takeaways
    const handleSaveTakeaways = async () => {
        if (!takeawaySession || !takeawayText.trim()) return;

        setIsSavingTakeaways(true);
        const authorRole = isCoach ? 'coach' : 'parent';
        const authorName = isCoach ? 'Coach Elliott' : (balance?.goalie_name || goalieName || 'Athlete/Parent');

        const res = await submitSessionTakeaways({
            sessionId: takeawaySession.id,
            takeaways: takeawayText.trim(),
            authorRole,
            authorName,
            clientEmail: balance?.email || userEmail
        });

        setIsSavingTakeaways(false);
        if (res.success) {
            setTakeawaySuccess(true);
            setTimeout(() => {
                setTakeawaySuccess(false);
                setTakeawaySession(null);
                setTakeawayText("");
                fetchData();
            }, 1200);
        }
    };

    // Handle Coach Mark Completed
    const handleMarkCompleted = async (session: SessionRecord) => {
        setCompletingSessionId(session.id);
        await completeTrainingSessionAndNotify({
            sessionId: session.id,
            athleteName: balance?.goalie_name || goalieName || "Athlete",
            clientEmail: balance?.email || userEmail,
            coachNotes: "Completed on field with Coach Elliott."
        });
        setCompletingSessionId(null);
        fetchData();
    };

    if (loading) {
        return (
            <div className="w-full bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="animate-spin text-muted-foreground/60" size={24} />
                <span className="text-xs text-muted-foreground mt-2 font-bold tracking-wider">Syncing Lesson Data...</span>
            </div>
        );
    }

    const completedSessions = sessions.filter(s => isPastSession(s.date) || (s.notes && s.notes.includes('[Session Completed')));
    const upcomingSessions = sessions.filter(s => !isPastSession(s.date) && (!s.notes || !s.notes.includes('[Session Completed')));

    const earnedCount = balance?.lessons_earned ?? 0;
    const deliveredCount = balance?.lessons_delivered ?? completedSessions.length;
    const bookedCount = upcomingSessions.length;
    const availableCount = Math.max(0, (balance?.lessons_remaining ?? (earnedCount - deliveredCount)) - bookedCount);

    const hasActiveLessons = availableCount > 0 || (balance !== null && balance.lessons_earned > 0);
    const isLowBalance = availableCount <= 1;

    const hasNoPrivateTraining = !balance || balance.lessons_earned === 0;

    if (hasNoPrivateTraining) {
        return (
            <div className="w-full h-[320px] glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex justify-between items-start mb-4 shrink-0">
                    <div className="w-full">
                        <button className="w-full flex justify-between items-center group cursor-default">
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none flex items-center gap-2">
                                    Self-Guided Prep
                                </h3>
                            </div>
                            <div className="text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
                                Active
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-6">
                        Manage your schedule, set your intentions, and review your game film to keep sharpening your skills.
                    </p>

                    <div className="flex flex-col gap-2">
                        <Link 
                            href="/training/book"
                            className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl hover:border-emerald-500 hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-sm cursor-pointer"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-0.5">
                                    <Calendar size={10} className="text-emerald-500" />
                                    Private Training
                                </span>
                                <h4 className="text-xs font-sans font-bold text-foreground truncate">
                                    Schedule Your Sessions
                                </h4>
                            </div>
                            <span className="text-[9px] font-bold tracking-wider bg-foreground text-background px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1">
                                Book <ArrowRight size={10} />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full min-h-[320px] glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col gap-2">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                {/* ACCORDION 1: PRIVATE TRAINING */}
                <div className="flex flex-col flex-shrink-0 min-h-0 overflow-hidden" style={{ flex: activeTab === 'training' ? '1 1 0%' : 'none' }}>
                    <button 
                        onClick={() => setActiveTab(activeTab === 'training' ? 'missions' : 'training')}
                        className="flex justify-between items-center w-full text-left group transition-colors py-2 shrink-0"
                    >
                        <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none group-hover:text-foreground/80 transition-colors">
                            Private Training
                        </h3>
                        
                        <div className="flex items-center gap-3">
                            {hasActiveLessons ? (
                                <div className={twMerge(
                                    "text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300",
                                    isLowBalance 
                                        ? "bg-muted border-border text-muted-foreground" 
                                        : "bg-emerald-500 text-black font-extrabold border-transparent"
                                )}>
                                    {availableCount} Available to Book {bookedCount > 0 ? `(${bookedCount} Scheduled)` : ''}
                                </div>
                            ) : (
                                <div className="text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground italic hidden sm:block">
                                    Package Complete
                                </div>
                            )}
                            <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                {activeTab === 'training' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                    </button>

                    {activeTab === 'training' && (
                        <div className="mt-4 flex-1 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3 h-full pb-2">
                                <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-bold tracking-widest text-muted-foreground mb-1">
                                        Total Package
                                    </span>
                                    <span className="text-base font-bold text-foreground">
                                        {balance !== null ? earnedCount : (sessions.length > 0 ? earnedCount : "—")}
                                    </span>
                                </div>
                                <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-bold tracking-widest text-muted-foreground mb-1">
                                        Booked / Done
                                    </span>
                                    <span className="text-sm font-bold text-foreground truncate">
                                        {bookedCount > 0 ? `${bookedCount} Booked • ${deliveredCount} Done` : `${deliveredCount} Done`}
                                    </span>
                                </div>
                                <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-bold tracking-widest text-muted-foreground mb-1">
                                        Available to Book
                                    </span>
                                    <span className={twMerge(
                                        "text-base font-bold transition-colors",
                                        hasActiveLessons 
                                            ? (isLowBalance ? "text-amber-400" : "text-[#00E676]") 
                                            : "text-muted-foreground"
                                    )}>
                                        {availableCount}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3">
                                <Link
                                    href="/training/book"
                                    className="w-full py-2.5 px-4 rounded-xl bg-[#00E676] text-black font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                                >
                                    <Calendar size={13} /> Book Next Session <ArrowRight size={13} />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-border/60 w-full shrink-0" />

                {/* ACCORDION 2: LESSON LOG & RESCHEDULING */}
                <div className="flex flex-col flex-shrink-0 min-h-0 overflow-hidden" style={{ flex: activeTab === 'history' ? '1 1 0%' : 'none' }}>
                    <button 
                        onClick={() => setActiveTab(activeTab === 'history' ? 'training' : 'history')}
                        className="flex justify-between items-center w-full text-left group transition-colors py-2 shrink-0"
                    >
                        <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none group-hover:text-foreground/80 transition-colors flex items-center gap-2">
                            Lesson Schedule & Log <span className="text-xs font-bold text-muted-foreground ml-1">({sessions.length})</span>
                        </h3>
                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                            {activeTab === 'history' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </button>

                    {activeTab === 'history' && (
                        <div className="mt-3 flex-1 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto pr-1 pb-2">
                            {sessions.length > 0 ? (
                                <div className="space-y-4">
                                    {sessions.map((session, index) => {
                                        const isPast = isPastSession(session.date);
                                        const isCompleted = session.notes && session.notes.includes('[Session Completed');
                                        const locked24h = !isPast && isWithin24Hours(session.date);

                                        return (
                                            <div key={session.id || index} className="flex gap-3 relative group bg-muted/40 p-3.5 rounded-2xl border border-border/70">
                                                {/* Status Icon */}
                                                <div className="mt-0.5">
                                                    {isCompleted || isPast ? (
                                                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <Clock size={16} className="text-sky-400 shrink-0" />
                                                    )}
                                                </div>
                                                
                                                {/* Session Details */}
                                                <div className="flex-1 space-y-1.5 min-w-0">
                                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-foreground font-mono">
                                                                {new Date(session.date).toLocaleDateString(undefined, { 
                                                                    weekday: 'short',
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {!isPast && !isCompleted ? (
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded-md">
                                                                    Upcoming
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                        <MapPin size={11} className="shrink-0" />
                                                        <span className="truncate">{session.location || "Bell Memorial Park"}</span>
                                                    </div>

                                                    {session.notes && (
                                                        <p className="text-xs text-foreground/80 bg-background/50 border-l-2 border-emerald-500/50 p-2 rounded-r-lg mt-1 leading-relaxed italic font-medium whitespace-pre-line">
                                                            "{session.notes}"
                                                        </p>
                                                    )}

                                                    {/* Action Buttons: Reschedule & Takeaways */}
                                                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                                                        {/* Reschedule button for upcoming sessions */}
                                                        {!isPast && !isCompleted && (
                                                            <button
                                                                onClick={() => {
                                                                    setReschedulingSession(session);
                                                                    setSelectedNewSlotId(null);
                                                                    setRescheduleError(null);
                                                                }}
                                                                className={twMerge(
                                                                    "text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all",
                                                                    locked24h && !isCoach
                                                                        ? "bg-amber-950/30 border-amber-800/50 text-amber-400 hover:bg-amber-950/50"
                                                                        : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                                                                )}
                                                            >
                                                                <RefreshCw size={10} />
                                                                {locked24h && !isCoach ? "24h Lock (Policy)" : "Reschedule"}
                                                            </button>
                                                        )}

                                                        {/* Add Takeaways button */}
                                                        <button
                                                            onClick={() => {
                                                                setTakeawaySession(session);
                                                                setTakeawayText("");
                                                            }}
                                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-all"
                                                        >
                                                            <FileText size={10} />
                                                            {session.notes && session.notes.includes('[Takeaways') ? "View/Edit Takeaways" : "+ Add Takeaway"}
                                                        </button>

                                                        {/* Coach Mark Completed Action */}
                                                        {isCoach && !isCompleted && (
                                                            <button
                                                                onClick={() => handleMarkCompleted(session)}
                                                                disabled={completingSessionId === session.id}
                                                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-foreground text-background flex items-center gap-1 hover:opacity-90 transition-all ml-auto"
                                                            >
                                                                {completingSessionId === session.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                                                Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-muted border border-border rounded-xl p-6 text-center h-full flex flex-col justify-center">
                                    <p className="text-xs font-medium text-muted-foreground italic">No lessons scheduled yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-px bg-border/60 w-full shrink-0" />

                {/* ACCORDION 3: SELF-GUIDED TRAINING MISSIONS */}
                <div className="flex flex-col flex-shrink-0 min-h-0 overflow-hidden" style={{ flex: activeTab === 'missions' ? '1 1 0%' : 'none' }}>
                    <button 
                        onClick={() => setActiveTab(activeTab === 'missions' ? 'training' : 'missions')}
                        className="flex justify-between items-center w-full text-left group transition-colors py-2 shrink-0"
                    >
                        <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none group-hover:text-foreground/80 transition-colors flex items-center gap-2">
                            Self-Guided Missions
                        </h3>
                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                            {activeTab === 'missions' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </button>

                    {activeTab === 'missions' && (
                        <div className="mt-4 flex-1 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto pb-2 flex flex-col justify-center">
                            <a 
                                href="/calendar"
                                className="flex items-center justify-between p-3.5 bg-muted border border-border rounded-2xl hover:border-border/80 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                            >
                                <div className="min-w-0 flex-1">
                                    <span className="text-[8px] font-bold tracking-[0.2em] text-muted-foreground block mb-0.5">
                                        Calendar & Film
                                    </span>
                                    <h4 className="text-xs font-sans font-bold text-foreground tracking-wider truncate">
                                        Manage Your Schedule
                                    </h4>
                                </div>
                                <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider bg-foreground/10 border border-border text-foreground px-3 py-1.5 rounded-xl group-hover:bg-foreground group-hover:text-background transition-all whitespace-nowrap ml-2">
                                    View <ArrowRight size={10} />
                                </span>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* RESCHEDULING MODAL */}
            {reschedulingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                        <button 
                            onClick={() => setReschedulingSession(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw size={18} className="text-emerald-500" />
                            <h3 className="text-lg font-bold text-white">Reschedule Training Session</h3>
                        </div>

                        <p className="text-xs text-zinc-400 mb-4">
                            Current session: <span className="text-white font-semibold">{new Date(reschedulingSession.date).toLocaleDateString()}</span> at <span className="text-white font-semibold">{reschedulingSession.location}</span>
                        </p>

                        {/* 24-Hour Policy Warning if client is within 24h */}
                        {!isCoach && isWithin24Hours(reschedulingSession.date) ? (
                            <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-300">24-Hour Notice Policy</h4>
                                        <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                                            This session is scheduled within the next 24 hours. Per private training terms, online rescheduling is locked within 24 hours of session start time.
                                        </p>
                                        <p className="text-xs text-amber-200/80 mt-2 font-medium">
                                            Need an emergency adjustment? Contact Coach Elliott directly at <a href="mailto:e@cmmncreators.com" className="underline font-bold text-amber-300">e@cmmncreators.com</a>.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReschedulingSession(null)}
                                    className="w-full mt-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                                    Select New Available Slot:
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 max-h-[280px]">
                                    {INITIAL_TRAINING_SLOTS.map((slot) => {
                                        const isSelected = selectedNewSlotId === slot.id;
                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => setSelectedNewSlotId(slot.id)}
                                                className={twMerge(
                                                    "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                                                    isSelected 
                                                        ? "bg-emerald-500/15 border-emerald-500 text-white" 
                                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                                                )}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-white">
                                                        {new Date(slot.date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {slot.timeDisplay}
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                                        <MapPin size={10} /> {slot.location}
                                                    </p>
                                                </div>
                                                <div className={twMerge(
                                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                    isSelected ? "border-emerald-500 bg-emerald-500 text-black" : "border-zinc-700"
                                                )}>
                                                    {isSelected && <CheckCircle2 size={14} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {rescheduleError && (
                                    <p className="text-xs text-red-400 mb-3 bg-red-950/40 border border-red-800/60 p-2.5 rounded-xl">
                                        {rescheduleError}
                                    </p>
                                )}

                                {rescheduleSuccess ? (
                                    <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-center text-xs font-bold text-emerald-400">
                                        ✓ Session Rescheduled! Notification emails sent.
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setReschedulingSession(null)}
                                            className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={!selectedNewSlotId || isRescheduling}
                                            onClick={handleConfirmReschedule}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            {isRescheduling ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                            Confirm Move
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAKEAWAYS MODAL */}
            {takeawaySession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                        <button 
                            onClick={() => setTakeawaySession(null)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={18} className="text-emerald-500" />
                            <h3 className="text-lg font-bold text-white">Lesson Takeaways & Focus</h3>
                        </div>

                        <p className="text-xs text-zinc-400 mb-4">
                            Session on <span className="text-white font-semibold">{new Date(takeawaySession.date).toLocaleDateString()}</span> at <span className="text-white font-semibold">{takeawaySession.location}</span>
                        </p>

                        <textarea
                            value={takeawayText}
                            onChange={(e) => setTakeawayText(e.target.value)}
                            placeholder="What felt solid today? What drill or mechanic are you focusing on next (e.g., bounce shots, high hands, stance balance)?"
                            rows={5}
                            className="w-full p-3.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-2xl text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none mb-4 leading-relaxed"
                        />

                        {takeawaySuccess ? (
                            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-center text-xs font-bold text-emerald-400">
                                ✓ Takeaways saved and shared via email!
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTakeawaySession(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!takeawayText.trim() || isSavingTakeaways}
                                    onClick={handleSaveTakeaways}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                >
                                    {isSavingTakeaways ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    Save & Email
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
