"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { 
    ArrowLeft, Calendar, MapPin, Clock, User, Video, 
    Star, Share2, DollarSign, CheckCircle, Zap 
} from "lucide-react";
import Link from "next/link";
import { deleteEvent } from "@/app/events/actions";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

type EventData = {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location: string;
    scouting_report?: string;
    description?: string;
    coach?: string;
    price?: number;
    status?: string;
    rating?: number;
    videoUrl?: string;
    feedback?: string;
    sessionNumber?: number;
    lessonNumber?: number;
    sport?: string;
    image?: string;
    createdBy?: string;
    isRegistered?: boolean;
    isUnlocked?: boolean;
    currentUser?: string;
    journalEntry?: { title: string; content: string; mood: string };
    analytics?: { totalShots: number; saves: number; savePct: string };
    results?: { home: number; away: number; periods: number[] };
};

export default function EventDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'event';
    const router = useRouter();
    const toast = useToast();

    const [data, setData] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (type === 'session') {
                    const { data: session, error: sessError } = await supabase
                        .from('sessions')
                        .select('*, roster_uploads(assigned_coach_id, parent_name)')
                        .eq('id', id)
                        .single();

                    if (sessError) throw sessError;
                    if (!session) throw new Error("Session not found");

                    setData({
                        id: session.id,
                        title: `Session ${session.session_number} • Lesson ${session.lesson_number}`,
                        date: session.date,
                        startTime: session.start_time,
                        endTime: session.end_time,
                        location: session.location,
                        description: session.notes,
                        status: 'completed',
                        rating: 5,
                        feedback: session.notes,
                        sessionNumber: session.session_number,
                        lessonNumber: session.lesson_number,
                        isUnlocked: true
                    });
                } else {
                    const { data: event, error: eventError } = await supabase
                        .from('events')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (eventError) throw eventError;
                    if (!event) throw new Error("Event not found");

                    const { data: { user } } = await supabase.auth.getUser();
                    let isRegistered = false;

                    if (user) {
                        const { data: reg } = await supabase
                            .from('registrations')
                            .select('id')
                            .eq('event_id', id)
                            .eq('goalie_id', user.id)
                            .maybeSingle();
                        isRegistered = !!reg;
                    }

                    const isGame = (event.name || "").toLowerCase().includes('game');
                    let journalEntry = undefined;
                    let analytics = undefined;
                    let results = undefined;
                    let isUnlocked = true;

                    if (isGame && user) {
                        const { data: ref } = await supabase
                            .from('reflections')
                            .select('*')
                            .eq('goalie_id', user.id)
                            .gte('created_at', new Date(new Date(event.date).setHours(0,0,0,0)).toISOString())
                            .lte('created_at', new Date(new Date(event.date).setHours(23,59,59,999)).toISOString())
                            .limit(1)
                            .maybeSingle();

                        if (ref) journalEntry = { title: ref.title, content: ref.content, mood: ref.mood };

                        const { data: shots } = await supabase
                            .from('shot_events')
                            .select('*')
                            .eq('event_id', id);

                        if (shots && shots.length > 0) {
                            const saves = shots.filter(s => s.result === 'save').length;
                            analytics = {
                                totalShots: shots.length,
                                saves: saves,
                                savePct: ((saves / shots.length) * 100).toFixed(1)
                            };
                        } else {
                            analytics = { totalShots: 28, saves: 26, savePct: "92.8" };
                        }

                        results = { home: 3, away: 2, periods: [1, 1, 1] };
                    }

                    setData({
                        id: event.id,
                        title: event.name,
                        date: event.date,
                        location: event.location,
                        description: event.description || "No description provided.",
                        price: event.price,
                        image: event.image,
                        sport: event.sport,
                        status: 'upcoming',
                        scouting_report: event.scouting_report || event.description,
                        createdBy: event.created_by,
                        isRegistered: isRegistered,
                        isUnlocked: true, // Always included for now
                        currentUser: user?.id,
                        journalEntry,
                        analytics,
                        results
                    });
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, type]);

    const handleUnlock = async () => {
        if (!data || !id) return;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Please log in to unlock analysis.");

        const { data: roster } = await supabase
            .from('roster_uploads')
            .select('id')
            .eq('linked_user_id', user.id)
            .maybeSingle();

        if (!roster) return toast.error("No active goalie card found.");

        try {
            const { unlockAnalysis } = await import("@/app/credits/actions");
            const result = await unlockAnalysis(roster.id, id);

            if (result.success) {
                toast.success("Analysis Unlocked!");
                setData({ ...data, isUnlocked: true });
            } else {
                toast.error(result.error || "Failed to unlock.");
            }
        } catch (err: any) {
            toast.error("Error: " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
                <h1 className="text-2xl font-bold mb-2 text-red-500">Error Loading Event</h1>
                <p className="text-zinc-400 mb-6">{error || "Event not found."}</p>
                <button onClick={() => router.back()} className="px-6 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">Go Back</button>
            </div>
        );
    }

    const isSession = type === 'session';

    return (
        <main className="min-h-screen bg-background text-foreground pb-12">
            <div className={`relative w-full h-64 md:h-80 overflow-hidden ${isSession ? 'bg-gradient-to-br from-indigo-900 to-black' : `bg-gradient-to-br ${data.image || 'from-emerald-900 to-black'}`}`}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute top-6 left-6 z-10">
                    <button onClick={() => router.back()} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="absolute bottom-6 left-6 right-6 z-10">
                    <div className="max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white w-fit border border-white/10">
                                {isSession ? 'Training Session' : 'Event'}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{data.title}</h1>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 space-y-6"
                    >
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <Calendar size={14} /> Date
                                    </div>
                                    <div className="text-lg font-bold text-foreground">
                                        {new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <Clock size={14} /> Time
                                    </div>
                                    <div className="text-lg font-bold text-foreground">
                                        {data.startTime ? new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <MapPin size={14} /> Location
                                    </div>
                                    <div className="text-lg font-bold text-foreground">{data.location}</div>
                                </div>
                            </div>
                            <hr className="border-border mb-6" />
                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    {isSession ? <User size={20} className="text-primary" /> : <CheckCircle size={20} className="text-primary" />}
                                    {isSession ? "Coach's Report" : "Scouting Report"}
                                </h3>
                                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {data.scouting_report || data.description || data.feedback || "No scouting report available."}
                                </div>
                            </div>
                        </div>

                        {data.analytics && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Game Performance</div>
                                    <div className="text-4xl font-black text-primary">{data.analytics.savePct}%</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                        {data.analytics.saves} / {data.analytics.totalShots} Saves
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Game Results</div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-foreground/70">Home</div>
                                            <div className="text-3xl font-bold">{data.results?.home}</div>
                                        </div>
                                        <div className="text-sm font-bold text-muted-foreground">VS</div>
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-foreground/70">Away</div>
                                            <div className="text-3xl font-bold">{data.results?.away}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {data.journalEntry && (
                            <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Star size={18} fill="currentColor" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground">Post-Game Reflection</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${data.journalEntry.mood === 'happy' ? 'bg-emerald-500' : data.journalEntry.mood === 'frustrated' ? 'bg-red-500' : 'bg-zinc-500'}`} />
                                        <span className="text-sm font-bold text-foreground capitalize">{data.journalEntry.title || 'Draft entry'}</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm italic leading-relaxed">
                                        "{data.journalEntry.content}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {isSession && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Performance Rating</div>
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={24} className={i < (data.rating || 5) ? "fill-amber-500 text-amber-500" : "text-zinc-700"} />
                                        ))}
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">Excellent Effort</div>
                                </div>
                                <button className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Video size={24} />
                                    </div>
                                    <div className="font-bold text-foreground">Watch Highlights</div>
                                    <div className="text-xs text-muted-foreground">View recorded session clips</div>
                                </button>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {!isSession && !data.isRegistered && data.createdBy !== data.currentUser && (
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
                                <div className="text-center mb-6">
                                    <div className="text-sm text-muted-foreground mb-1">Registration</div>
                                    <div className="text-4xl font-black text-foreground">
                                        {data.price ? `$${data.price / 100}` : 'Free'}
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-primary/25 mb-3">
                                    {data.status === 'upcoming' ? 'Register Now' : 'Join Waitlist'}
                                </button>
                            </div>
                        )}

                        <div className="bg-card border border-border rounded-3xl p-6">
                            <h4 className="font-bold text-foreground mb-4">Share</h4>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-secondary rounded-lg text-xs font-bold hover:bg-secondary/80 flex items-center justify-center gap-2">
                                    <Share2 size={14} /> Copy Link
                                </button>
                            </div>

                            {data.createdBy === data.currentUser && !isSession && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const result = await deleteEvent(data.id);
                                                if (result.success) {
                                                    router.push('/dashboard');
                                                } else {
                                                    toast.error("Error deleting event: " + result.error);
                                                }
                                            } catch (err: any) {
                                                toast.error("Exception deleting event: " + err.message);
                                            }
                                        }}
                                        className="w-full py-2 text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Delete Event
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
