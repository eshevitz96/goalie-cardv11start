"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Clock, User, Video, Star, Share2, DollarSign, CheckCircle } from "lucide-react";
import Link from "next/link";

type EventData = {
    id: string;
    title: string;
    date: string; // ISO or date string
    startTime?: string;
    endTime?: string;
    location: string;
    description?: string;
    coach?: string;
    price?: number;
    status?: string;
    // Session specific
    rating?: number;
    videoUrl?: string;
    feedback?: string;
    sessionNumber?: number;
    lessonNumber?: number;
    sport?: string;
    image?: string;
};

export default function EventDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'event'; // 'event' or 'session'
    const router = useRouter();

    const [data, setData] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchData();
    }, [id, type]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'session') {
                // Fetch from Sessions
                const { data: session, error } = await supabase
                    .from('sessions')
                    .select('*, roster_uploads(assigned_coach_id, parent_name)') // join to get coach/parent info if needed
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!session) throw new Error("Session not found");

                // Get Coach Name if possible
                let coachName = "Assigned Coach";
                // logic to fetch coach name if needed, or just use what we have
                // For now, simpler is better. Sessions usually imply a relationship.

                setData({
                    id: session.id,
                    title: `Session ${session.session_number} • Lesson ${session.lesson_number}`,
                    date: session.date,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    location: session.location,
                    description: session.notes, // Notes as description
                    coach: "Coach", // Could fetch, but maybe generic for now
                    status: 'completed',
                    rating: 5, // Default for now, schema doesn't seem to have rating yet? Or it was hardcoded in UI?
                    // In PostGameReport, rating was hardcoded to 5 or passed in props. 
                    // Viewing file `PostGameReport.tsx`, rating is in FeedbackItem interface. 
                    // `src/app/goalie/page.tsx` hardcoded rating: 5.
                    videoUrl: undefined, // Schema doesn't show video url in session directly yet?
                    feedback: session.notes,
                    sessionNumber: session.session_number,
                    lessonNumber: session.lesson_number
                });

            } else {
                // Fetch from Events
                const { data: event, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!event) throw new Error("Event not found");

                setData({
                    id: event.id,
                    title: event.name,
                    date: event.date,
                    location: event.location,
                    description: event.description || "No description provided.",
                    price: event.price,
                    image: event.image,
                    sport: event.sport,
                    status: 'upcoming' // Logic to check registration?
                });
            }
        } catch (err: any) {
            console.error("Error fetching details:", err);
            setError(err.message);
        } finally {
            setLoading(false);
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
            {/* Header / Hero */}
            <div className={`relative w-full h-48 md:h-64 overflow-hidden ${isSession ? 'bg-gradient-to-br from-indigo-900 to-black' : `bg-gradient-to-br ${data.image || 'from-emerald-900 to-black'}`}`}>
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

            <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-2 space-y-6"
                    >
                        {/* Info Card */}
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            {/* Decorative glow */}
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

                            {/* Description / Notes */}
                            <div>
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    {isSession ? <User size={20} className="text-primary" /> : <CheckCircle size={20} className="text-primary" />}
                                    {isSession ? "Coach's Report" : "Event Details"}
                                </h3>
                                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {data.description || data.feedback || "No additional details available."}
                                </div>
                            </div>
                        </div>

                        {/* Session Specifics (Video / Rating) */}
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

                    {/* Sidebar Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {!isSession && (
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
                                <p className="text-center text-xs text-muted-foreground">
                                    Secure your spot today.
                                </p>
                            </div>
                        )}

                        <div className="bg-card border border-border rounded-3xl p-6">
                            <h4 className="font-bold text-foreground mb-4">Share</h4>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-secondary rounded-lg text-xs font-bold hover:bg-secondary/80 flex items-center justify-center gap-2">
                                    <Share2 size={14} /> Copy Link
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </main>
    );
}
