import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/context/ToastContext';
import { X, Video, Plus, Link as LinkIcon, Play, Film, Target, Shield, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface HighlightsSectionProps {
    rosterId: string;
    onSelectEvent?: (eventId: string) => void;
    gridCols?: number;
    hideHeader?: boolean;
}

export function HighlightsSection({ rosterId, onSelectEvent, gridCols = 2, hideHeader = false }: HighlightsSectionProps) {
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
    const [url, setUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [clips, setClips] = useState<any[]>([]);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    // 1. Fetch Shot Events as Highlights (The Clip Library)
    useEffect(() => {
        if (!rosterId) return;
        
        const fetchClips = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('shot_events')
                .select('*, events(name, date)')
                .eq('roster_id', rosterId)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                setClips(data);
            }
            setLoading(false);
        };

        fetchClips();
        // Subscribe to real-time updates for instant sync after plotting
        const channel = supabase.channel(`public:shot_events:roster_id=eq.${rosterId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shot_events' }, fetchClips)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [rosterId]);

    const handleSubmit = async () => {
        setLoading(true);
        // Manual highlight logic (legacy link support)
        if (uploadMode === 'link') {
            if (!url) return;
            const { error } = await supabase.from('highlights').insert({ roster_id: rosterId, url, description: "Goalie Highlight" });
            setLoading(false);
            if (error) toast.error(error.message); else { toast.success("Added!"); setShowModal(false); setUrl(''); }
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {!hideHeader ? (
                <div className="bg-card/40 border border-white/5 rounded-[2rem] p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Film size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Elite Clip Library</h3>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[.25em] mt-1">
                                    {clips.length} Sync'd High-Perf Assets
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-xl group"
                        >
                            <Plus size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>

                    {loading && clips.length === 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : clips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-8 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                            <Video size={32} className="text-muted-foreground/20 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">
                                No charted clips yet.<br />Upload a game to populate your library.
                            </p>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-4`}>
                            {clips.slice(0, onSelectEvent ? clips.length : 4).map((clip) => (
                                <motion.div 
                                    key={clip.id} 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="group relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
                                    onClick={() => {
                                        if (onSelectEvent && clip.event_id) {
                                            onSelectEvent(clip.event_id);
                                        } else {
                                            setActiveVideo(clip.film_url);
                                        }
                                    }}
                                >
                                    {/* Thumbnail Mask */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                    
                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            clip.result === 'save' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                            {clip.result}
                                        </div>
                                    </div>

                                    {/* Play Trigger or Drill-down Trigger */}
                                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl">
                                            {onSelectEvent ? <ExternalLink size={20} /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                                        </div>
                                    </div>

                                    {/* Clipping Meta */}
                                    <div className="absolute bottom-3 left-3 right-3 z-20">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                                                {clip.events?.name || 'Manual Session'}
                                            </p>
                                            <div className="flex items-center gap-2 text-[8px] font-bold text-white/40 uppercase tracking-widest">
                                                <Clock size={8} /> {Math.floor(clip.clip_start)}s • {clip.shot_type}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {clips.length > 4 && !onSelectEvent && (
                        <Button 
                            variant="ghost" 
                            className="w-full mt-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all border border-transparent hover:border-white/5 rounded-2xl"
                        >
                            View Full Video Intelligence Database <ExternalLink size={12} />
                        </Button>
                    )}
                </div>
            ) : (
                /* Pure Grid for Full Library View */
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${gridCols} gap-6 px-1`}>
                    {clips.map((clip) => (
                        <motion.div 
                            key={clip.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl cursor-pointer"
                            onClick={() => {
                                if (onSelectEvent && clip.event_id) {
                                    onSelectEvent(clip.event_id);
                                } else {
                                    setActiveVideo(clip.film_url);
                                }
                            }}
                        >
                            {/* Thumbnail Mask */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 left-4 z-20">
                                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[.2em] border ${
                                    clip.result === 'save' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                    {clip.result}
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                                    <ExternalLink size={24} />
                                </div>
                            </div>

                            <div className="absolute bottom-5 left-6 right-6 z-20">
                                <p className="text-[11px] font-black text-white uppercase tracking-[.25em] mb-1 truncate">
                                    {clip.events?.name || 'Manual Session'}
                                </p>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                    <Clock size={10} /> {Math.floor(clip.clip_start)}s • {clip.shot_type}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Video Overlay Portal */}
            <AnimatePresence>
                {activeVideo && (
                    <div className="fixed inset-0 z-[1000] bg-background/95 backdrop-blur-3xl flex items-center justify-center p-4">
                        <button 
                            onClick={() => setActiveVideo(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-2xl"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black">
                            <video src={activeVideo} controls autoPlay className="w-full h-full" />
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Legacy Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] p-10 shadow-3xl">
                             <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white">External Link</h3>
                                <button onClick={() => setShowModal(false)}><X size={20} className="text-white/40" /></button>
                             </div>
                             <input 
                                value={url} onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white mb-6 focus:border-primary/50 outline-none transition-all"
                             />
                             <Button onClick={handleSubmit} className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl">Add Highlight</Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
