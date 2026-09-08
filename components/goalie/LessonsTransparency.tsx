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
    submitSessionTakeaways,
    getGoalieBookingProfile
} from "@/app/training/book/actions";

interface LessonsTransparencyProps {
    goalieProfileId: string | null;
    userEmail?: string;
    userRole?: string;
    goalieName?: string;
    rosterId?: string;
    paidSubmission?: any;
    rosterData?: any;
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
    goalieName,
    rosterId,
    paidSubmission,
    rosterData
}: LessonsTransparencyProps) {
    const [balance, setBalance] = useState<GoalieLessonBalance | null>(null);
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Lesson Log Modal State
    const [showLogModal, setShowLogModal] = useState(false);

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
            const profileRes = await getGoalieBookingProfile(goalieProfileId, userEmail);
            if (profileRes && profileRes.success) {
                if (profileRes.hasPaidAccess || profileRes.totalAllowance > 0) {
                    setBalance({
                        goalie_id: goalieProfileId,
                        email: profileRes.email || userEmail || '',
                        goalie_name: profileRes.goalieName || goalieName || 'Athlete',
                        lessons_earned: profileRes.totalAllowance,
                        lessons_delivered: profileRes.deliveredCount,
                        lessons_remaining: profileRes.lessonsRemaining
                    });
                } else {
                    setBalance(null);
                }
                setSessions(profileRes.existingSessions || []);
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
    }, [goalieProfileId, userEmail, rosterId, paidSubmission, rosterData]);

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
            <div className="w-full bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center min-h-[192px]">
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
    const hasNoPrivateTraining = !balance || balance.lessons_earned === 0;

    if (hasNoPrivateTraining) {
        return (
            <div className="flex flex-col justify-between p-6 h-full min-h-[192px] glass rounded-3xl relative overflow-hidden transition-all duration-300">
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,230,118,0.12), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }} />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="m-0 text-[8px] font-black uppercase tracking-[0.3em] text-foreground/35">Prep & Routine</p>
                        <span className="text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                            Active
                        </span>
                    </div>
                    <p className="m-0 mb-1 text-xl font-bold tracking-tight leading-tight text-foreground">
                        Self-Guided Preparation
                    </p>
                    <p className="m-0 text-xs text-muted-foreground font-medium leading-relaxed">
                        Manage your schedule, set your intentions, and review game film to keep sharpening your skills.
                    </p>
                </div>

                <div className="relative z-10 mt-4">
                    <Link 
                        href="/calendar"
                        className="bg-foreground text-background rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-foreground/90 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <ArrowRight size={12} />
                        View Calendar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col justify-between p-6 h-full min-h-[192px] glass rounded-3xl relative overflow-hidden transition-all duration-300">
                {/* Neon Glow Radial Gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,230,118,0.12), transparent 60%)', pointerEvents: 'none', borderRadius: '24px' }} />
                
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="m-0 text-[8px] font-black uppercase tracking-[0.3em] text-foreground/35">Private Training</p>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            {availableCount} Available to Book {bookedCount > 0 ? `(${bookedCount} Scheduled)` : ''}
                        </span>
                    </div>

                    <p className="m-0 mb-2 text-xl font-bold tracking-tight leading-tight text-foreground">
                        {availableCount > 0 ? "Schedule Your Next Session" : "Training Package Active"}
                    </p>

                    {/* 3 Stats Pills */}
                    <div className="grid grid-cols-3 gap-2.5 my-2.5">
                        <div className="bg-muted/70 border border-border rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                                Total Package
                            </span>
                            <span className="text-base font-black text-foreground">
                                {earnedCount}
                            </span>
                        </div>
                        <div className="bg-muted/70 border border-border rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                                Booked / Done
                            </span>
                            <span className="text-xs font-bold text-foreground truncate">
                                {bookedCount > 0 ? `${bookedCount} Booked • ${deliveredCount} Done` : `${deliveredCount} Done`}
                            </span>
                        </div>
                        <div className="bg-muted/70 border border-border rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                                Available
                            </span>
                            <span className={twMerge(
                                "text-base font-black transition-colors",
                                availableCount > 0 ? "text-[#00E676]" : "text-muted-foreground"
                            )}>
                                {availableCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions: Black Pill Button + Lesson Log Modal Button */}
                <div className="relative z-10 mt-3 flex items-center justify-between gap-3">
                    <Link
                        href="/training/book"
                        className="bg-foreground text-background rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-foreground/90 active:scale-95 transition-all shadow-md cursor-pointer whitespace-nowrap"
                    >
                        <ArrowRight size={12} />
                        Book Next Session
                    </Link>

                    {sessions.length > 0 && (
                        <button
                            onClick={() => setShowLogModal(true)}
                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer bg-muted/60 hover:bg-muted border border-border px-3 py-2 rounded-xl"
                        >
                            <Calendar size={12} />
                            <span>Lesson Log ({sessions.length})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* LESSON SCHEDULE & LOG MODAL */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                        <button 
                            onClick={() => setShowLogModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <Calendar size={18} className="text-emerald-500" />
                            <h3 className="text-lg font-bold text-white">Lesson Schedule & Log</h3>
                        </div>

                        <p className="text-xs text-zinc-400 mb-4">
                            Track upcoming sessions, add takeaways, or reschedule per the 24-hour notice policy.
                        </p>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                            {sessions.map((session, index) => {
                                const isPast = isPastSession(session.date);
                                const isCompleted = session.notes && session.notes.includes('[Session Completed');
                                const locked24h = !isPast && isWithin24Hours(session.date);

                                return (
                                    <div key={session.id || index} className="flex gap-3 relative group bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                                        <div className="mt-0.5">
                                            {isCompleted || isPast ? (
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                            ) : (
                                                <Clock size={16} className="text-sky-400 shrink-0" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex items-center justify-between flex-wrap gap-1">
                                                <span className="text-xs font-bold text-white font-mono">
                                                    {new Date(session.date).toLocaleDateString(undefined, { 
                                                        weekday: 'short',
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                                <span className={twMerge(
                                                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                                                    !isPast && !isCompleted 
                                                        ? "text-sky-400 bg-sky-950/50 border border-sky-800/60" 
                                                        : "text-emerald-400 bg-emerald-950/50 border border-emerald-800/60"
                                                )}>
                                                    {!isPast && !isCompleted ? "Upcoming" : "Completed"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                                <MapPin size={11} className="shrink-0" />
                                                <span className="truncate">{session.location || "Bell Memorial Park"}</span>
                                            </div>

                                            {session.notes && (
                                                <p className="text-xs text-zinc-300 bg-zinc-950/60 border-l-2 border-emerald-500/50 p-2 rounded-r-lg mt-1 leading-relaxed italic font-medium whitespace-pre-line">
                                                    "{session.notes}"
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 pt-1 flex-wrap">
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
                                                                : "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                                                        )}
                                                    >
                                                        <RefreshCw size={10} />
                                                        {locked24h && !isCoach ? "24h Lock (Policy)" : "Reschedule"}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setTakeawaySession(session);
                                                        setTakeawayText("");
                                                    }}
                                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-all"
                                                >
                                                    <FileText size={10} />
                                                    {session.notes && session.notes.includes('[Takeaways') ? "Edit Takeaways" : "+ Add Takeaway"}
                                                </button>

                                                {isCoach && !isCompleted && (
                                                    <button
                                                        onClick={() => handleMarkCompleted(session)}
                                                        disabled={completingSessionId === session.id}
                                                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white text-black flex items-center gap-1 hover:opacity-90 transition-all ml-auto"
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

                        <button
                            onClick={() => setShowLogModal(false)}
                            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

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
