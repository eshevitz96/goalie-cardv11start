"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Video, Filter, Search, ChevronRight, Play, 
    Calendar, Target, Activity, Shield, ArrowLeft,
    Clock, Tag, Share2, Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

interface ShotClip {
    id: string;
    event_id: string;
    result: string;
    shot_type: string;
    period: number;
    timestamp_seconds: number;
    created_at: string;
    event_name?: string;
    video_url?: string;
    speed?: string; // Mocked metadata
    has_traffic?: boolean;
}

export default function SeasonClipsPage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [clips, setClips] = useState<ShotClip[]>([]);
    const [filter, setFilter] = useState<'all' | 'save' | 'goal'>('all');
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchClips();
    }, []);

    const fetchClips = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch shot events with event names
            const { data, error } = await supabase
                .from('shot_events')
                .select('*, events(name)')
                .eq('goalie_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setClips(data?.map(s => ({
                id: s.id,
                event_id: s.event_id,
                result: s.result,
                shot_type: s.shot_type || 'unspecified',
                period: s.period,
                timestamp_seconds: s.timestamp_seconds || 0,
                created_at: s.created_at,
                event_name: s.events?.name || 'Unknown Game',
                video_url: 'https://example.com/mock-video.mp4',
                has_traffic: s.has_traffic
            })) || []);

        } catch (err: any) {
            toast.error("Error loading clips: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredClips = clips.filter(c => {
        const matchesFilter = filter === 'all' || c.result === filter;
        const matchesSearch = c.event_name?.toLowerCase().includes(search.toLowerCase()) || 
                             c.shot_type?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground pb-20">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto px-6 pt-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex flex-col gap-2">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[.2em] hover:text-primary transition-colors mb-2">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </button>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase flex items-center gap-4">
                            Season Video Database
                            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">{clips.length} Clips</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by event or type..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold uppercase tracking-widest outline-none focus:border-primary transition-all w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'all' ? 'bg-primary text-black border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                        All Clips
                    </button>
                    <button 
                        onClick={() => setFilter('save')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'save' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                        Saves Only
                    </button>
                    <button 
                        onClick={() => setFilter('goal')}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filter === 'goal' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                        Goals Against
                    </button>
                </div>

                {/* Clips Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredClips.map((clip, idx) => (
                            <motion.div
                                key={clip.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:border-primary/50 transition-all cursor-pointer"
                            >
                                {/* Thumbnail Mockup */}
                                <div className="relative aspect-video bg-black overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-10">
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black">
                                            <Play size={20} fill="currentColor" />
                                        </div>
                                    </div>
                                    
                                    {/* Outcome Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[.2em] border ${clip.result === 'save' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                            {clip.result}
                                        </span>
                                    </div>

                                    {/* Stats Badge */}
                                    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1">
                                        <div className="text-[8px] font-bold text-white/50 uppercase tracking-widest">{new Date(clip.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-5">
                                    <h3 className="text-xs font-black uppercase tracking-tight text-foreground truncate mb-1">{clip.event_name}</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {clip.period}P</span>
                                            <span className="flex items-center gap-1"><Tag size={12} /> {clip.shot_type}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><Star size={14} /></button>
                                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"><Share2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredClips.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30">
                            <Video size={48} className="mb-4" />
                            <h3 className="text-lg font-black uppercase tracking-tighter">No Clips Found</h3>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1">Adjust filters or search criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
