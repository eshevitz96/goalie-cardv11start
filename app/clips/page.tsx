"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, Film, ArrowLeft, Play, Target, Clock, Calendar, 
    Filter, Share2, Download, CheckCircle, Shield, Zap
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/utils/supabase/client";

export default function SeasonClipsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVideos() {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .not('video_url', 'is', null)
                .order('date', { ascending: false });

            if (!error && data) {
                setVideos(data);
            }
            setLoading(false);
        }
        fetchVideos();
    }, []);

    const filteredVideos = videos.filter(v => {
        const matchesSearch = (v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             v.location?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (activeFilter === "ALL") return matchesSearch;
        if (activeFilter === "GAMES") return matchesSearch && v.type === 'game';
        if (activeFilter === "SESSIONS") return matchesSearch && (v.type === 'practice' || v.type === 'session');
        return matchesSearch;
    });

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white pb-20">
            {/* V11 Top Nav Bar (Technical) */}
            <nav className="fixed top-0 inset-x-0 h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 z-50 px-8 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">Return to Hub</span>
                </Link>

                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black italic uppercase tracking-[0.2em] text-primary">Status: Secure</p>
                    <p className="text-sm font-black italic tracking-tighter opacity-40 uppercase">Performance_Lib.V11</p>
                </div>
            </nav>

            <div className="max-w-[1400px] mx-auto pt-32 px-8">
                {/* Header Stats Strip */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div className="space-y-2">
                        <h1 className="text-8xl font-black italic tracking-tighter leading-none uppercase">
                            SEASON <span className="text-primary tracking-tighter">CLIPS</span>
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground tracking-tight max-w-md">Encrypted repository of tactical performance data and multi-angle game footage.</p>
                    </div>

                    <div className="flex gap-12 border-l border-white/10 pl-12 h-20 items-center">
                        <div>
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-muted-foreground/40 mb-1">CAPACITY</p>
                            <p className="text-3xl font-black italic tracking-tighter uppercase">{filteredVideos.length}/--</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black italic uppercase tracking-widest text-muted-foreground/40 mb-1">ARCHIVE</p>
                            <p className="text-3xl font-black italic tracking-tighter uppercase">ONLINE</p>
                        </div>
                    </div>
                </div>

                {/* Tactical Search & Filter Control */}
                <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between bg-secondary/20 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="QUERY ARCHIVE BY OPPONENT, DATE, OR LOCATION..."
                            className="w-full bg-transparent border-none py-6 pl-16 pr-8 text-xs font-black italic tracking-widest uppercase focus:outline-none placeholder:text-muted-foreground/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 p-1 bg-background/50 rounded-2xl mr-2">
                        {['ALL', 'GAMES', 'SESSIONS', 'SCOUT'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={clsx(
                                    "px-8 py-3 rounded-xl text-[10px] font-black italic uppercase tracking-[0.2em] transition-all",
                                    activeFilter === tab 
                                        ? "bg-foreground text-background shadow-lg" 
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* High-Definition Grid */}
                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredVideos.map((video, idx) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative aspect-[4/5] bg-secondary/10 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl"
                            >
                                {/* Video Thumbnail Placeholder with Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center opacity-40 group-hover:scale-105 transition-transform duration-700">
                                    <Film size={48} className="text-white/10" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="bg-background/80 backdrop-blur-md border-white/10 text-[10px] font-black italic py-1 px-4 uppercase tracking-widest">
                                            {video.type || 'RAW_INTEL'}
                                        </Badge>
                                        <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <Play size={18} fill="currentColor" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black italic text-primary uppercase tracking-[0.2em]">
                                                {new Date(video.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </p>
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                                                {video.name}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Target size={14} className="text-muted-foreground" />
                                                <span className="text-[10px] font-black italic uppercase text-muted-foreground">{video.location || 'Remote'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-black italic uppercase text-muted-foreground">Synchronized</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-[50vh] flex flex-col items-center justify-center space-y-8 bg-secondary/10 rounded-[3rem] border border-dashed border-white/5 backdrop-blur-sm">
                        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                            <Film size={32} className="text-muted-foreground/30" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black italic uppercase tracking-widest text-muted-foreground">Archive Empty</h3>
                            <p className="text-sm font-medium text-muted-foreground/40 uppercase">No tactical signatures match the current query.</p>
                        </div>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="px-10 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black italic uppercase tracking-[0.2em] hover:scale-105 transition-all"
                        >
                            Reset Frequency
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
