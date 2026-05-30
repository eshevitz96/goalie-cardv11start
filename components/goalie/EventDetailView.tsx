"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Play, Pause, ChevronRight, ChevronLeft, Calendar, 
  MapPin, Target, Shield, Film, BarChart3, MessageCircle, 
  ExternalLink, Plus, LayoutList, Info, Activity
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { GameAnalysisSurface } from "./GameAnalysisSurface";
import { GameReport } from "./GameReport";
import { SupportedSport, ShotEvent, ShotType } from "@/types/goalie-v11";
import { getSportTerms } from "@/utils/sport-language";

interface EventDetailViewProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    sport: SupportedSport;
    onAddClips?: (eventId: string) => void;
}

export function EventDetailView({ isOpen, onClose, eventId, sport, onAddClips }: EventDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'video' | 'report' | 'journal'>('video');
    const [shots, setShots] = useState<ShotEvent[]>([]);
    const [activeShotIndex, setActiveShotIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [eventData, setEventData] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const terms = getSportTerms(sport);

    const activeShot = shots[activeShotIndex];

    useEffect(() => {
        if (!isOpen || !eventId) return;

        const loadEventData = async () => {
            const { fetchShotEvents, fetchRosterEvent } = await import('@/app/actions');
            const [eventRes, shotsRes] = await Promise.all([
                fetchRosterEvent(eventId),
                fetchShotEvents(eventId)
            ]);

            if (eventRes.success) setEventData(eventRes.event);
            if (shotsRes.success && shotsRes.shots) {
                setShots(shotsRes.shots);
                if (shotsRes.shots.length > 0) setActiveShotIndex(0);
            }
        };

        loadEventData();
    }, [isOpen, eventId]);

    // Autoplay logic
    useEffect(() => {
        if (videoRef.current && activeShot && isPlaying) {
            videoRef.current.currentTime = activeShot.clipStart || 0;
            videoRef.current.play().catch(() => setIsPlaying(false));

            const duration = (activeShot.clipEnd || (activeShot.clipStart || 0) + 5) - (activeShot.clipStart || 0);
            const timer = setTimeout(() => {
                if (activeShotIndex < shots.length - 1) {
                    setActiveShotIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false);
                }
            }, duration * 1000);

            return () => clearTimeout(timer);
        }
    }, [activeShot, isPlaying]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[600] bg-background/95 backdrop-blur-3xl overflow-y-auto">
                <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col p-6 lg:p-12">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                    {eventData?.type || 'Event'} Intelligence
                                </div>
                                {eventData?.date && (
                                    <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> {new Date(eventData.date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase">
                                {eventData?.name || 'Loading Event...'}
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button 
                                onClick={() => onAddClips?.(eventId)}
                                className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                            >
                                <Plus size={16} /> Add Clips to Thread
                            </Button>
                            <button onClick={onClose} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
                        
                        {/* LEFT: Video & Map (The Replay Core) */}
                        <div className="lg:col-span-8 space-y-8">
                            
                            {/* Tabs Navigation */}
                            <div className="flex gap-8 border-b border-white/5 pb-4">
                                {['video', 'report', 'journal'].map((tab) => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`text-[10px] font-black uppercase tracking-[.3em] transition-all relative ${
                                            activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {tab}
                                        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary" />}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'video' ? (
                                <div className="grid grid-cols-1 gap-8">
                                    {/* Video Player */}
                                    <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/5 shadow-3xl relative group">
                                        {activeShot?.filmUrl ? (
                                            <video 
                                                ref={videoRef}
                                                src={activeShot.filmUrl}
                                                className="w-full h-full object-contain"
                                                controls={false}
                                                muted
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                                <Film size={48} className="opacity-20" />
                                                <p className="text-[10px] uppercase font-black tracking-widest opacity-40 text-center">No video linked for this sequence</p>
                                            </div>
                                        )}
                                        
                                        {/* Playback Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
                                            >
                                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                            </button>
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Clip {activeShotIndex + 1} of {shots.length}</p>
                                                <h3 className="text-xl font-black uppercase tracking-tight text-white">{activeShot?.result} — {activeShot?.shotType}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shot Plots Next to Video (Instrumentalist Style) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-96">
                                        <div className="bg-card rounded-[2.5rem] p-8 border border-white/5 flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-[.4em] text-muted-foreground mb-6 flex items-center gap-2">
                                                <MapPin size={12} /> Origin Distribution
                                            </span>
                                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                                <GameAnalysisSurface 
                                                    sport={sport}
                                                    view="field"
                                                    shots={activeShot ? [activeShot] : []}
                                                    interactive={false}
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-card rounded-[2.5rem] p-8 border border-white/5 flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-[.4em] text-muted-foreground mb-6 flex items-center gap-2">
                                                <Target size={12} /> Target Context
                                            </span>
                                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                                <GameAnalysisSurface 
                                                    sport={sport}
                                                    view="net"
                                                    shots={activeShot ? [activeShot] : []}
                                                    interactive={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'report' ? (
                                <div className="bg-card rounded-[3rem] p-12 border border-white/5">
                                    <GameReport 
                                        sport={sport}
                                        opponent={eventData?.name || 'Opponent'}
                                        date={eventData?.date || ''}
                                        shots={shots}
                                        stats={{
                                            totalShots: shots.length,
                                            saves: shots.filter(s => s.result === 'save' || s.result === 'clear').length,
                                            goalsAgainst: shots.filter(s => s.result === 'goal').length,
                                            savePercentage: shots.length > 0 ? (shots.filter(s => s.result === 'save' || s.result === 'clear').length / shots.length).toFixed(3).replace('0.', '.') : '.000'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="bg-card rounded-[3rem] p-12 border border-white/5 space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[.5em] text-primary">Athlete Journal</h3>
                                        <p className="text-xl font-bold text-foreground leading-relaxed">
                                            {eventData?.journal_entry || 'No reflection recorded for this session.'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Readiness Score</span>
                                            <div className="text-2xl font-black text-foreground">{eventData?.readiness_score || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Soreness</span>
                                            <div className="text-2xl font-black text-foreground">{eventData?.soreness_level || '—'}/10</div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Sleep Quality</span>
                                            <div className="text-2xl font-black text-foreground">{eventData?.sleep_hours || '—'} HRS</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Clip List & Meta */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            
                            {/* Sequence Timeline */}
                            <div className="bg-card rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden max-h-[800px]">
                                <div className="p-8 border-b border-white/5 bg-foreground/[0.02]">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                                        <LayoutList size={16} /> Shot Sequence
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{shots.length} Technical Tags</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {shots.map((shot, idx) => (
                                        <div key={shot.id} 
                                            onClick={() => setActiveShotIndex(idx)}
                                            className={`p-5 rounded-2xl cursor-pointer transition-all border group relative ${
                                                activeShotIndex === idx 
                                                ? 'bg-foreground border-foreground text-background shadow-xl' 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest opacity-60`}>#{idx + 1} • {shot.result}</span>
                                                {shot.filmUrl && <Film size={12} className={activeShotIndex === idx ? 'text-background' : 'text-primary'} />}
                                            </div>
                                            <div className="text-sm font-black uppercase tracking-tighter truncate mb-2">{shot.shotType}</div>
                                            <div className="flex items-center gap-4 text-[9px] font-bold opacity-40">
                                                <span className="flex items-center gap-1"><MapPin size={10} /> X:{Math.round(shot.originX)}, Y:{Math.round(shot.originY)}</span>
                                            </div>
                                            {activeShotIndex === idx && (
                                                <div className="absolute top-1/2 -right-1 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronLeft size={20} className="text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="p-8 bg-foreground/[0.02] border-t border-white/5">
                                    <Button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-full py-6 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                    >
                                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                        {isPlaying ? 'Pause Autoplay' : 'Autoplay Session'}
                                    </Button>
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-primary" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Technical Context</h4>
                                </div>
                                <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-widest leading-relaxed">
                                    Click any shot to jump directly to that technical segment. Enable autoplay to run through the entire thread with automated plot sync.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatePresence>
    );
}
