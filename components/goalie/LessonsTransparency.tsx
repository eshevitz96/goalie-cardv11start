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
    Sparkles
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface LessonsTransparencyProps {
    goalieProfileId: string | null;
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
}

export function LessonsTransparency({ goalieProfileId }: LessonsTransparencyProps) {
    const [balance, setBalance] = useState<GoalieLessonBalance | null>(null);
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Collapsible states
    const [showHistory, setShowHistory] = useState(false);
    const [showDailyMission, setShowDailyMission] = useState(false);

    useEffect(() => {
        if (!goalieProfileId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
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

                // 2. Fetch history strictly filtering by goalie_id (no roster_id fallback)
                const { data: sessionsData, error: sessionsErr } = await supabase
                    .from("sessions")
                    .select("id, date, location, notes, session_number, lesson_number")
                    .eq("goalie_id", goalieProfileId)
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

        fetchData();
    }, [goalieProfileId]);

    if (loading) {
        return (
            <div className="w-full bg-[#1C1C1E] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="animate-spin text-white/30" size={24} />
                <span className="text-xs text-white/40 mt-2 font-bold uppercase tracking-wider">Syncing Lesson Data...</span>
            </div>
        );
    }

    const hasActiveLessons = balance !== null && balance.lessons_remaining > 0;
    const remainingCount = balance?.lessons_remaining ?? 0;
    const earnedCount = balance?.lessons_earned ?? 0;
    const deliveredCount = balance?.lessons_delivered ?? 0;

    // Shift to neutral color if remaining balance is low (<= 1)
    const isLowBalance = remainingCount <= 1;

    return (
        <div className="w-full glass rounded-3xl p-6 space-y-6 relative overflow-hidden">
            {/* Top Glow Accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {/* Card Header */}
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#006747] block mb-1">
                        Private Training
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-none">
                        Lessons Transparency
                    </h3>
                </div>
                
                {/* Remaining Badge */}
                {hasActiveLessons ? (
                    <div className={twMerge(
                        "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300",
                        isLowBalance 
                            ? "bg-zinc-850 border-zinc-700 text-zinc-400" 
                            : "bg-[#006747]/15 border-[#006747]/30 text-emerald-400"
                    )}>
                        {remainingCount} {remainingCount === 1 ? 'Lesson' : 'Lessons'} Left
                    </div>
                ) : (
                    <div className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-800/30 text-zinc-500 italic">
                        No Active Lessons
                    </div>
                )}
            </div>

            {/* Lesson Count Details Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/20 border border-white/[0.03] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/35 mb-1">
                        Purchased
                    </span>
                    <span className="text-base font-black text-white">
                        {balance !== null ? earnedCount : "—"}
                    </span>
                </div>
                <div className="bg-black/20 border border-white/[0.03] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/35 mb-1">
                        Completed
                    </span>
                    <span className="text-base font-black text-white">
                        {sessions.length > 0 ? deliveredCount : "—"}
                    </span>
                </div>
                <div className="bg-black/20 border border-white/[0.03] rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/35 mb-1">
                        Remaining
                    </span>
                    <span className={twMerge(
                        "text-base font-black transition-colors",
                        hasActiveLessons 
                            ? (isLowBalance ? "text-zinc-400" : "text-emerald-400") 
                            : "text-zinc-500"
                    )}>
                        {balance !== null ? remainingCount : "—"}
                    </span>
                </div>
            </div>

            {/* Expandable Lesson History Log */}
            {sessions.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <span>Lesson Log ({sessions.length})</span>
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {showHistory && (
                        <div className="mt-4 space-y-4 max-h-[320px] overflow-y-auto pr-1">
                            {sessions.map((session, index) => (
                                <div key={session.id || index} className="flex gap-4 relative group">
                                    {/* Timeline Connector Line */}
                                    {index < sessions.length - 1 && (
                                        <div className="absolute top-3 bottom-0 left-2 w-px bg-white/5 group-hover:bg-white/10 transition-colors" />
                                    )}
                                    
                                    {/* Timeline Node Icon */}
                                    <div className="w-4 h-4 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-1 relative z-10 transition-colors group-hover:border-zinc-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-zinc-400 transition-colors" />
                                    </div>
                                    
                                    {/* Session Details */}
                                    <div className="flex-1 space-y-1 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={12} className="text-zinc-500" />
                                                <span className="text-[10px] font-bold text-zinc-400 font-mono">
                                                    {new Date(session.date).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                            </div>
                                            {session.lesson_number !== undefined && (
                                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md font-mono">
                                                    Lesson {session.lesson_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium">
                                            <MapPin size={10} />
                                            <span>{session.location || "Unknown Location"}</span>
                                        </div>
                                        {session.notes && (
                                            <p className="text-xs text-zinc-450 bg-black/20 border-l border-zinc-700/60 p-2.5 rounded-r-xl mt-1 leading-relaxed italic font-medium whitespace-pre-line">
                                                "{session.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Collapsed / Secondary Self-Guided Missions Toggle */}
            <div className="border-t border-white/5 pt-4">
                <button
                    onClick={() => setShowDailyMission(!showDailyMission)}
                    className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                    <span className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-zinc-500" />
                        Self-Guided Training Missions
                    </span>
                    {showDailyMission ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showDailyMission && (
                    <div className="mt-3">
                        <Link 
                            href="/workout"
                            className="flex items-center justify-between p-3.5 bg-black/20 border border-white/5 rounded-2xl hover:border-white/10 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#006747] block mb-0.5">
                                    Today's Mission
                                </span>
                                <h4 className="text-xs font-black uppercase text-white tracking-wider truncate">
                                    Daily Coach Engine Card
                                </h4>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-[#006747]/10 border border-[#006747]/20 text-[#006747] px-2.5 py-1.5 rounded-xl group-hover:bg-[#006747] group-hover:text-white transition-all whitespace-nowrap ml-2">
                                View Card
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
