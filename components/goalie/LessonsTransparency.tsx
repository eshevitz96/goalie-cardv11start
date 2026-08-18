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
    Sparkles,
    ArrowRight
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

    const [activeTab, setActiveTab] = useState<'training' | 'history' | 'missions'>('training');

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
            <div className="w-full bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="animate-spin text-muted-foreground/60" size={24} />
                <span className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-wider">Syncing Lesson Data...</span>
            </div>
        );
    }

    const hasActiveLessons = balance !== null && balance.lessons_remaining > 0;
    const remainingCount = balance?.lessons_remaining ?? 0;
    const earnedCount = balance?.lessons_earned ?? 0;
    const deliveredCount = balance?.lessons_delivered ?? 0;

    // Shift to neutral color if remaining balance is low (<= 1)
    const isLowBalance = remainingCount <= 1;

    // Check if they have zero history of private training
    const hasNoPrivateTraining = balance === null || (balance.lessons_earned === 0 && sessions.length === 0);

    // If hasNoPrivateTraining is true, we ONLY show the Self-Guided Missions section
    // because private training is only visible to connected users.
    if (hasNoPrivateTraining) {
        return (
            <div className="w-full h-[320px] glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <div className="flex justify-between items-start mb-4 shrink-0">
                    <div className="w-full">
                        <button className="w-full flex justify-between items-center group cursor-default">
                            <div className="flex flex-col items-start">
                                <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none flex items-center gap-2">
                                    Self-Guided Missions
                                </h3>
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground">
                                Active
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-6">
                        Use the Coach Engine to generate personalized daily training missions to keep sharpening your skills.
                    </p>

                    <Link 
                        href="/workout"
                        className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl hover:border-foreground/40 hover:scale-[1.01] active:scale-[0.99] transition-all group shadow-sm cursor-pointer shrink-0"
                    >
                        <div className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                                <Sparkles size={10} className="text-muted-foreground" />
                                Today's Mission
                            </span>
                            <h4 className="text-sm font-sans font-black uppercase text-foreground tracking-wider truncate">
                                Generate Training Card
                            </h4>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-foreground text-background px-3 py-2 rounded-xl transition-all whitespace-nowrap ml-2 shadow-sm">
                            Start
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[320px] glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col gap-2">
            {/* Top Glow Accent */}
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
                        {/* Remaining Badge */}
                        {hasActiveLessons ? (
                            <div className={twMerge(
                                "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300",
                                isLowBalance 
                                    ? "bg-muted border-border text-muted-foreground" 
                                    : "bg-foreground text-background border-transparent"
                            )}>
                                {remainingCount} {remainingCount === 1 ? 'Lesson' : 'Lessons'} Left
                            </div>
                        ) : (
                            <div className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-muted border border-border text-muted-foreground italic hidden sm:block">
                                No Active Lessons
                            </div>
                        )}
                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                            {activeTab === 'training' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </div>
                </button>

                {activeTab === 'training' && (
                    <div className="mt-4 flex-1 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto">
                        {/* Lesson Count Details Grid */}
                        <div className="grid grid-cols-3 gap-3 h-full pb-2">
                            <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                    Purchased
                                </span>
                                <span className="text-base font-black text-foreground">
                                    {balance !== null ? earnedCount : "—"}
                                </span>
                            </div>
                            <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                    Completed
                                </span>
                                <span className="text-base font-black text-foreground">
                                    {sessions.length > 0 ? deliveredCount : "—"}
                                </span>
                            </div>
                            <div className="bg-muted border border-border rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                    Remaining
                                </span>
                                <span className={twMerge(
                                    "text-base font-black transition-colors",
                                    hasActiveLessons 
                                        ? (isLowBalance ? "text-muted-foreground" : "text-[#006747]") 
                                        : "text-muted-foreground"
                                )}>
                                    {balance !== null ? remainingCount : "—"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-border/60 w-full shrink-0" />

            {/* ACCORDION 2: LESSON LOG */}
            <div className="flex flex-col flex-shrink-0 min-h-0 overflow-hidden" style={{ flex: activeTab === 'history' ? '1 1 0%' : 'none' }}>
                <button 
                    onClick={() => setActiveTab(activeTab === 'history' ? 'training' : 'history')}
                    className="flex justify-between items-center w-full text-left group transition-colors py-2 shrink-0"
                >
                    <h3 className="text-lg font-sans font-bold text-foreground tracking-tight leading-none group-hover:text-foreground/80 transition-colors flex items-center gap-2">
                        Lesson Log <span className="text-xs font-bold text-muted-foreground ml-1">({sessions.length})</span>
                    </h3>
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {activeTab === 'history' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </button>

                {activeTab === 'history' && (
                    <div className="mt-3 flex-1 animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto pr-1 pb-2">
                        {sessions.length > 0 ? (
                            <div className="space-y-4">
                                {sessions.map((session, index) => (
                                    <div key={session.id || index} className="flex gap-4 relative group">
                                        {/* Timeline Connector Line */}
                                        {index < sessions.length - 1 && (
                                            <div className="absolute top-3 bottom-0 left-2 w-px bg-border group-hover:bg-border/80 transition-colors" />
                                        )}
                                        
                                        {/* Timeline Node Icon */}
                                        <div className="w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-1 relative z-10 transition-colors group-hover:border-foreground/30">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-foreground/50 transition-colors" />
                                        </div>
                                        
                                        {/* Session Details */}
                                        <div className="flex-1 space-y-1 pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-muted-foreground" />
                                                    <span className="text-[10px] font-bold text-foreground font-mono">
                                                        {new Date(session.date).toLocaleDateString(undefined, { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                                {session.lesson_number !== undefined && (
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md font-mono">
                                                        Lesson {session.lesson_number}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                                                <MapPin size={10} />
                                                <span>{session.location || "Unknown Location"}</span>
                                            </div>
                                            {session.notes && (
                                                <p className="text-xs text-foreground/80 bg-muted border-l-2 border-border p-2.5 rounded-r-xl mt-1 leading-relaxed italic font-medium whitespace-pre-line">
                                                    "{session.notes}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-muted border border-border rounded-xl p-6 text-center h-full flex flex-col justify-center">
                                <p className="text-xs font-medium text-muted-foreground italic">No past lessons recorded.</p>
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
                        <Link 
                            href="/workout"
                            className="flex items-center justify-between p-3.5 bg-muted border border-border rounded-2xl hover:border-border/80 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                        >
                            <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">
                                    Today's Mission
                                </span>
                                <h4 className="text-xs font-sans font-black uppercase text-foreground tracking-wider truncate">
                                    Daily Coach Engine Card
                                </h4>
                            </div>
                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-foreground/10 border border-border text-foreground px-3 py-1.5 rounded-xl group-hover:bg-foreground group-hover:text-background transition-all whitespace-nowrap ml-2">
                                View Card <ArrowRight size={10} />
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
