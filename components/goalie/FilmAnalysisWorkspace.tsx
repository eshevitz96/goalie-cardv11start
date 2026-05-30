"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, ChevronRight, ChevronLeft, MapPin, Target as TargetIcon, 
  CheckCircle, Clock, Video, Save, Brain, Info, AlertCircle, Activity,
  Maximize2, ArrowRight, Shield, Target, Plus, Zap, Repeat, Trash2, Camera,
  MessageCircle, PlusCircle, LayoutList, Film, X, ChevronDown, Calendar
} from 'lucide-react';
import { GameAnalysisSurface } from './GameAnalysisSurface';
import { GameReport } from './GameReport';
import { SupportedSport, ShotEvent, ShotResult, ShotType } from '@/types/goalie-v11';
import { Button } from '@/components/ui/Button';
import { getSportTerms } from '@/utils/sport-language';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { GameFilmUpload } from './GameFilmUpload';
import { supabase } from '@/utils/supabase/client';

interface Clip {
  id: string;
  timestamp: number;
  type: ShotResult;
  status: 'pending' | 'plotted';
  plottedX?: number;
  plottedY?: number;
  netX?: number;
  netY?: number;
  period?: number;
  shotType?: string;
}

interface FilmAnalysisWorkspaceProps {
  sport: SupportedSport;
  videoUrl: string;
  initialClips?: Clip[];
  events?: { id: string; name: string; date?: string }[];
  initialEventId?: string;
  onComplete?: (sessionData: any) => void;
}

export function FilmAnalysisWorkspace({ 
  sport, 
  videoUrl, 
  initialClips = [], 
  events = [],
  initialEventId = '',
  onComplete 
}: FilmAnalysisWorkspaceProps) {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(initialClips.length > 0 ? 0 : null);
  const [plotStep, setPlotStep] = useState<'field' | 'net' | 'complete'>('field');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [associatedEventId, setAssociatedEventId] = useState(initialEventId || (events.length > 0 ? events[0].id : ''));
  const [clipComments, setClipComments] = useState<Record<string, string>>({});
  const [sessionType, setSessionType] = useState<'full_game' | 'clips' | null>('clips');
  const [opponentName, setOpponentName] = useState('Unknown Opponent');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingClip, setIsAddingClip] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeClip = activeClipIndex !== null ? clips[activeClipIndex] : null;

  // Multi-clip support
  const [videoUrls, setVideoUrls] = useState<string[]>(videoUrl.includes(',') ? videoUrl.split(',') : [videoUrl]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const currentVideoUrl = videoUrls[activeVideoIndex];

  const terms = getSportTerms(sport);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load existing data if resuming/appending
  useEffect(() => {
    if (associatedEventId && !associatedEventId.startsWith('m')) {
        const loadExisting = async () => {
            const { fetchShotEvents } = await import('@/app/actions');
            const res = await fetchShotEvents(associatedEventId);
            if (res.success && res.shots && res.shots.length > 0) {
                // Map shot_events to Clip logic
                const loadedClips: Clip[] = res.shots.map((s: any) => ({
                    id: s.id.toString(),
                    timestamp: s.clip_start || 0,
                    type: s.result,
                    status: 'plotted',
                    plottedX: s.origin_x,
                    plottedY: s.origin_y,
                    netX: s.target_x,
                    netY: s.target_y,
                    period: s.period,
                    shotType: s.shot_type,
                    isExisting: true
                }));
                setClips(prev => {
                    // Unique check to avoid duplication if initialClips also has them
                    const merged = [...prev];
                    loadedClips.forEach(c => {
                        if (!merged.some(m => m.id === c.id)) merged.push(c);
                    });
                    return merged;
                });
            }
        };
        loadExisting();
    }
  }, [associatedEventId]);

  // Sync Opponent & Date from Event
  useEffect(() => {
    if (associatedEventId) {
        const event = events.find(e => e.id === associatedEventId);
        if (event) {
            // Extract opponent from name (e.g. "Game: vs Rangers" -> "Rangers")
            const cleanName = event.name.replace(/Game:\s*vs\s*/i, '').replace(/Practice:\s*/i, '');
            setOpponentName(cleanName);
            if (event.date) {
                setGameDate(new Date(event.date).toISOString().split('T')[0]);
            }
        }
    }
  }, [associatedEventId, events]);

  const addManualClip = () => {
    const newId = `manual-${Date.now()}`;
    const newClip: Clip = {
        id: newId,
        timestamp: videoRef.current ? Math.round(videoRef.current.duration) : 0,
        type: 'save',
        status: 'pending'
    };
    setClips([...clips, newClip]);
    setActiveClipIndex(clips.length);
    setPlotStep('field');
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  // Sync Playback State
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Fallback if autoplay/play is blocked
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const jumpToClip = (index: number) => {
    setActiveClipIndex(index);
    setPlotStep('field');
    const clip = clips[index];
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, clip.timestamp - 6);
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = setTimeout(() => {
          if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
          }
      }, 8000);
    }
  };

  const handlePlotField = (x: number, y: number) => {
    if (activeClipIndex === null) return;
    const updatedClips = [...clips];
    const clip = updatedClips[activeClipIndex];
    clip.plottedX = x; clip.plottedY = y;
    setClips(updatedClips);
    if (plotStep === 'field') setPlotStep('net');
  };

  const handlePlotNet = (x: number, y: number) => {
    if (activeClipIndex === null) return;
    const updatedClips = [...clips];
    const clip = updatedClips[activeClipIndex];
    clip.netX = x; clip.netY = y;
    setClips(updatedClips);
    // Stay on net step until result is assigned
  };

  const handleResultAndNext = (newType: ShotResult) => {
    if (activeClipIndex === null) return;
    const updatedClips = [...clips];
    const clip = updatedClips[activeClipIndex];
    
    // Assign Result
    clip.type = newType;
    clip.status = 'plotted';
    setClips(updatedClips);
    
    // Auto Next
    if (activeClipIndex < clips.length - 1) {
        setTimeout(() => jumpToClip(activeClipIndex + 1), 300);
    } else {
        // All clips done, highlight the confirm button
        setPlotStep('complete');
    }
  };

  const setClipType = (index: number, newType: ShotResult) => {
    const updatedClips = [...clips];
    updatedClips[index].type = newType;
    setClips(updatedClips);
  };

  // 1. Session Type Selection - NOW INTEGRATED into Header to avoid "second page"
  // Defaulting sessionType to 'clips' to start immediately
  useEffect(() => {
    if (!sessionType) setSessionType('clips');
  }, [sessionType]);

  // 2. Final Report Screen
  if (showReport) {
      return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background animate-in fade-in duration-500">
          <GameReport 
            sport={sport}
            opponent={opponentName}
            date={gameDate}
            shots={clips.filter(c => c.status === 'plotted').map(c => ({
                id: c.id, gameId: associatedEventId, sport, result: c.type,
                shotType: (c.shotType || 'unspecified') as ShotType, originX: c.plottedX || 0, originY: c.plottedY || 0,
                targetX: c.netX, targetY: c.netY || 0,
                isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false,
                period: c.period || 1
            }))}
            stats={{
                totalShots: clips.length,
                saves: clips.filter(c => c.type === 'save').length,
                goalsAgainst: clips.filter(c => c.type === 'goal').length,
                savePercentage: `${Math.round((clips.filter(c => c.type === 'save').length / Math.max(1, clips.length)) * 100)}%`
            }}
          />
          <div className="flex justify-center mt-12 mb-20 px-8">
            <Button 
                onClick={() => onComplete?.({ clips, sport, associatedEventId, sessionType })}
                className="w-full max-w-sm py-4 bg-foreground text-background font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-lg hover:scale-[1.02] transition-all"
            >
                Confirm Analysis & Sync
            </Button>
          </div>
        </div>
      );
  }

  // 3. Main Analysis Interface
  return (
    <div className="flex flex-col gap-6 w-full bg-background pb-20 pt-6">
      
      {/* HEADER: Session Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mb-2">
        <div className="flex items-center gap-6">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[.25em] flex items-center gap-2 shadow-2xl text-muted-foreground whitespace-nowrap">
                <Activity size={12} className="text-muted-foreground/50" /> Draft Session Active
            </div>
            
            <div className="flex items-center gap-4">
                <input 
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    className="bg-transparent border-none outline-none text-2xl font-black tracking-tighter text-foreground hover:bg-white/5 px-2 rounded-lg focus:bg-white/10 transition-colors w-auto min-w-[100px]"
                    placeholder="Opponent"
                />
                
                <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} className="opacity-40" />
                    <input 
                        type="date"
                        value={gameDate}
                        onChange={(e) => setGameDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-muted-foreground focus:text-foreground transition-colors cursor-pointer"
                    />
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[.2em] whitespace-nowrap opacity-60">Link Event:</span>
            <div className="relative group">
                <select 
                    value={associatedEventId}
                    onChange={(e) => setAssociatedEventId(e.target.value)}
                    className="bg-card/80 border border-border/50 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-foreground focus:ring-1 focus:ring-primary/30 outline-none hover:border-primary/50 transition-all appearance-none pr-10 cursor-pointer shadow-xl"
                >
                    <option value="">No linked event</option>
                    {events.map((e: { id: string, name: string }) => (
                        <option key={e.id} value={e.id} className="bg-card text-foreground">{e.name}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
            </div>

            <Button 
                onClick={() => setIsAddingClip(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl flex items-center gap-2 shadow-xl hover:scale-[1.05] transition-all"
            >
                <Plus size={14} /> Add Film
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Video & Plotting Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* VIDEO PLAYER with Controls */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border border-border/50 bg-card group">
              <video 
                ref={videoRef}
                src={currentVideoUrl} 
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onClick={() => setIsPlaying(!isPlaying)}
                muted
              />

              {/* Playlist Overlay Controls if multiple */}
              {videoUrls.length > 1 && (
                <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                    <div className="px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                         <Film size={14} className="text-primary" /> CLIP {activeVideoIndex + 1} / {videoUrls.length}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveVideoIndex(Math.max(0, activeVideoIndex - 1)); }}
                            disabled={activeVideoIndex === 0}
                            className="w-10 h-10 bg-black/80 hover:bg-primary hover:text-white rounded-full border border-white/10 text-white disabled:opacity-30 transition-all flex items-center justify-center shadow-2xl"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActiveVideoIndex(Math.min(videoUrls.length - 1, activeVideoIndex + 1)); }}
                            disabled={activeVideoIndex === videoUrls.length - 1}
                            className="w-10 h-10 bg-black/80 hover:bg-primary hover:text-white rounded-full border border-white/10 text-white disabled:opacity-30 transition-all flex items-center justify-center shadow-2xl"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
              )}

              {/* Master Playback Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                 <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
                 >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-0.5" fill="currentColor" />}
                 </button>

                 <div className="flex-1 flex items-center gap-4">
                    <span className="text-[10px] font-mono font-bold text-white/50">{formatTime(currentTime)}</span>
                    <input 
                        type="range"
                        min="0"
                        max={videoRef.current?.duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={(e) => {
                            const time = parseFloat(e.target.value);
                            setCurrentTime(time);
                            if (videoRef.current) videoRef.current.currentTime = time;
                        }}
                        className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-[10px] font-mono font-bold text-white/50">{formatTime(videoRef.current?.duration || 0)}</span>
                 </div>
              </div>

              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="bg-zinc-900/80 border border-white/10 text-white font-mono text-[10px] px-4 py-2 rounded-full tracking-widest shadow-2xl">
                    {currentTime.toFixed(1)}s
                </div>
              </div>

              <AnimatePresence>
                {activeClip && plotStep !== 'complete' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 min-w-[240px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {plotStep === 'field' ? <MapPin size={16} /> : <TargetIcon size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 leading-none mb-0.5">Clip {clips.indexOf(activeClip) + 1}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {plotStep === 'field' ? 'Step 1: Plot Surface' : 'Step 2: Plot Net'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* COMMENT BOX */}
            {activeClip && (
                <div className="bg-card/30 rounded-3xl p-6 border border-border/30">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground flex items-center gap-2">
                            <MessageCircle size={14} /> Analyst Notes
                        </span>
                    </div>
                    <textarea 
                        value={clipComments[activeClip.id] || ''}
                        onChange={(e) => setClipComments({...clipComments, [activeClip.id]: e.target.value})}
                        placeholder="Add performance notes for this clip..." 
                        className="w-full bg-background/50 border border-border/30 rounded-2xl p-4 text-xs font-medium text-foreground min-h-[100px] outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30 focus:bg-background"
                    />
                </div>
            )}

            {/* UNIFIED PLOTTING COMMAND CENTER (Single Screen Interaction) */}
            <div className={`bg-card/40 border-2 rounded-[3.5rem] p-4 transition-all duration-300 ${plotStep === 'complete' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/30'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8">
                    {/* Step 1: Shot Origin (Surface) */}
                    <div className={`flex flex-col gap-6 transition-all ${plotStep === 'field' ? 'scale-105 active-ring' : 'opacity-60 scale-100'}`}>
                        <div className="flex items-center justify-between px-4">
                           <span className="text-[11px] font-black uppercase tracking-[.4em] text-white/50">1. Plot Origin</span>
                           {activeClip?.plottedX !== undefined && <CheckCircle size={16} className="text-emerald-500" />}
                        </div>
                        <div className="bg-black/20 rounded-[2.5rem] p-12 border border-white/5 flex items-center justify-center">
                            <GameAnalysisSurface 
                                sport={sport}
                                view="field"
                                interactive={true}
                                onPlotShot={handlePlotField}
                                shots={activeClip?.plottedX ? [{
                                    id: 't1', gameId: 't', sport, result: (activeClip.type === 'goal' ? 'goal' : 'save') as ShotResult, 
                                    shotType: 'wrist', originX: activeClip.plottedX, originY: activeClip.plottedY || 0,
                                    isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false, period: 1
                                }] : []}
                            />
                        </div>
                    </div>

                    {/* Step 2: Target (Net) */}
                    <div className={`flex flex-col gap-6 transition-all ${plotStep === 'net' ? 'scale-105 active-ring' : 'opacity-60 scale-100'}`}>
                        <div className="flex items-center justify-between px-4">
                           <span className="text-[11px] font-black uppercase tracking-[.4em] text-white/50">2. Plot Target</span>
                           {activeClip?.netX !== undefined && <CheckCircle size={16} className="text-emerald-500" />}
                        </div>
                        <div className="bg-black/20 rounded-[3rem] p-12 border border-white/5 flex items-center justify-center">
                            <GameAnalysisSurface 
                                sport={sport}
                                view="net"
                                interactive={true}
                                onPlotShot={handlePlotNet}
                                shots={activeClip?.netX ? [{
                                    id: 't2', gameId: 't', sport, result: (activeClip.type === 'goal' ? 'goal' : 'save') as ShotResult,
                                    shotType: 'wrist', originX: 0, originY: 0, targetX: activeClip.netX, targetY: activeClip.netY || 0,
                                    isShorthanded: false, isPowerPlay: false, hasTraffic: false, isOddManRush: false, period: 1
                                }] : []}
                            />
                        </div>
                    </div>
                </div>

                {/* Step 3: Result Selection (Action Bar) */}
                <div className="px-8 pb-12 flex flex-col items-center gap-8">
                     <div className="h-[1px] w-full bg-white/5" />
                     <div className="w-full max-w-2xl">
                        <div className="flex flex-col gap-6">
                            <span className="text-[10px] font-black uppercase tracking-[.5em] text-center text-white/40 mb-2">3. Assign Match Event & Progress</span>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <button 
                                    onClick={() => handleResultAndNext('save')}
                                    className={`py-6 md:py-10 rounded-[2.5rem] border-2 font-black uppercase tracking-[.2em] text-base transition-all flex flex-col items-center gap-4 active:scale-95 shadow-2xl ${
                                        activeClip?.type === 'save' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/5 border-white/10 text-emerald-500 hover:bg-emerald-500/10'
                                    }`}
                                >
                                    <Shield size={28} />
                                    Save
                                </button>
                                <button 
                                    onClick={() => handleResultAndNext('goal')}
                                    className={`py-6 md:py-10 rounded-[2.5rem] border-2 font-black uppercase tracking-[.2em] text-base transition-all flex flex-col items-center gap-4 active:scale-95 shadow-2xl ${
                                        activeClip?.type === 'goal' ? 'bg-red-500 text-white border-red-400' : 'bg-white/5 border-white/10 text-red-500 hover:bg-red-500/10'
                                    }`}
                                >
                                    <Plus size={28} className="rotate-45" />
                                    Goal
                                </button>
                                <button 
                                    onClick={() => handleResultAndNext('clear')}
                                    className={`col-span-2 md:col-span-1 py-6 md:py-10 rounded-[2.5rem] border-2 font-black uppercase tracking-[.2em] text-sm transition-all flex flex-col items-center gap-4 active:scale-95 shadow-2xl ${
                                        activeClip?.type === 'clear' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    <Repeat size={24} />
                                    Clear
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-card/50 border border-border/30 rounded-3xl flex flex-col min-h-[500px] overflow-hidden">
                <div className="p-6 border-b border-border/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Timeline</h3>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
                            {clips.filter(c => c.status === 'plotted').length} / {clips.length} Plotted
                        </p>
                    </div>
                    <Button 
                        onClick={addManualClip}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 rounded-xl px-3 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <Plus size={12} />
                        <span>Chart Shot</span>
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {clips.map((clip, i) => (
                        <div key={clip.id} className="space-y-3 p-1">
                            <button 
                                onClick={() => jumpToClip(i)}
                                className={`w-full rounded-2xl p-4 transition-all border text-left flex items-center justify-between group h-20 ${
                                    activeClipIndex === i 
                                        ? 'bg-foreground border-foreground text-background shadow-2xl scale-[1.02] z-10' 
                                        : clip.status === 'plotted' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                            : 'bg-muted/30 border-border/50 text-foreground/80 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-[.2em] ${activeClipIndex === i ? 'opacity-50' : 'text-muted-foreground'}`}>
                                            Clip {i + 1}
                                        </span>
                                        <span className={`text-[10px] font-mono font-bold ${activeClipIndex === i ? 'opacity-50' : 'text-muted-foreground'}`}>
                                            {formatTime(clip.timestamp)}
                                        </span>
                                    </div>
                                    <div className="text-sm font-black uppercase tracking-tighter truncate leading-none">
                                        {clip.type === 'save' ? 'Registered Save' : clip.type === 'goal' ? 'Goal Against' : clip.type === 'clear' ? 'Positional Clear' : 'Pending Detail'}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {clip.status === 'plotted' && <CheckCircle size={16} className={activeClipIndex === i ? 'text-background' : 'text-emerald-500'} />}
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setClips(clips.filter((_, idx) => idx !== i)); 
                                            if(activeClipIndex === i) setActiveClipIndex(null); 
                                        }}
                                        className={`transition-all p-1.5 rounded-full hover:scale-110 ${activeClipIndex === i ? 'text-background/40 hover:text-background hover:bg-background-foreground/10' : 'text-muted-foreground hover:bg-white/10 hover:text-red-500'}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </button>
                            
                             {/* Compact Timeline Info - No redundant buttons here anymore */}
                             <div className="flex gap-4 px-1 py-1 text-[9px] font-mono text-white/20 uppercase tracking-widest leading-none">
                                 <span>{activeClipIndex === i ? 'EDITING' : clip.status === 'plotted' ? 'TAGGED' : 'PENDING'}</span>
                                 <span>•</span>
                                 <span>{clip.period ? `P${clip.period}` : 'PREP'}</span>
                             </div>
                         </div>
                     ))}
                 </div>

                <div className="p-6 border-t border-border/30">
                    <Button 
                        disabled={!clips.every(c => c.status === 'plotted')}
                        className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            clips.every(c => c.status === 'plotted') ? 'bg-primary text-primary-foreground' : 'bg-muted opacity-50'
                        }`}
                        onClick={() => setShowReport(true)}
                    >
                        Confirm Analysis & Sync
                    </Button>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">Charting Protocol</h4>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-widest leading-loose">
                    Identify shooter's origin on the surface map, then record target location on the net perspective.
                </p>
            </div>
        </div>
      </div>
      {/* Add Clip Modal Overlay */}
      <AnimatePresence>
        {isAddingClip && (
          <div className="fixed inset-0 z-[600] bg-background/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setIsAddingClip(false)}
                  className="absolute -top-12 right-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="p-1">
                  <GameFilmUpload 
                    rosterId={associatedEventId} // Using eventId as generic grouping
                    sport={sport}
                    title="Add More Game Film"
                    onUploadComplete={(data) => {
                        const newUrls = data.url.split(',');
                        setVideoUrls(prev => {
                          const updated = [...prev, ...newUrls];
                          setActiveVideoIndex(prev.length);
                          return updated;
                        });
                        setIsAddingClip(false);
                    }}
                  />
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
