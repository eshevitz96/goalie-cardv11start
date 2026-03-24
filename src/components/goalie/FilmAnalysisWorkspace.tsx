"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, ChevronRight, ChevronLeft, MapPin, Target as TargetIcon, 
  CheckCircle, Clock, Video, Save, Brain, Info, AlertCircle, Activity,
  Maximize2, ArrowRight, Shield, Target, Plus, Zap, Repeat, Trash2, Camera,
  MessageCircle, PlusCircle, LayoutList, Film, X
} from 'lucide-react';
import { GameAnalysisSurface } from './GameAnalysisSurface';
import { GameReport } from './GameReport';
import { SupportedSport, ShotEvent, ShotResult, ShotType } from '@/types/goalie-v11';
import { Button } from '@/components/ui/Button';
import { getSportTerms } from '@/utils/sport-language';

interface Clip {
  id: string;
  timestamp: number;
  type: 'save' | 'goal' | 'clear' | 'miss' | 'shot_on_cage';
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
  const [sessionType, setSessionType] = useState<'clips' | 'full_game' | null>(initialClips.length > 0 ? 'clips' : null);
  const [opponentName, setOpponentName] = useState('Unknown Opponent');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeClip = activeClipIndex !== null ? clips[activeClipIndex] : null;
  const terms = getSportTerms(sport);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        timestamp: Math.round(currentTime),
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
    clip.status = 'plotted';
    setClips(updatedClips);
  };

  const toggleClipType = (index: number) => {
    const updatedClips = [...clips];
    const clip = updatedClips[index];
    clip.type = clip.type === 'save' ? 'goal' : 'save';
    setClips(updatedClips);
  };

  // 1. Session Type Selection Screen
  if (!sessionType) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] gap-8 p-12 bg-background border border-border/30 rounded-[3rem] text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Video size={40} className="text-primary" />
            </div>
            <div className="max-w-md">
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mb-4">Select Session Type</h2>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">Choose how you want to breakdown this film today.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
                <button 
                    onClick={() => setSessionType('full_game')}
                    className="group bg-card/40 border border-border/30 rounded-[2.5rem] p-10 hover:border-primary/50 transition-all text-left flex flex-col gap-6"
                >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                        <LayoutList size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2">Full Game Report</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-loose">Chart every shot and generate a seasonal aggregate report.</p>
                    </div>
                </button>
 
                <button 
                    onClick={() => setSessionType('clips')}
                    className="group bg-card/40 border border-border/30 rounded-[2.5rem] p-10 hover:border-primary/50 transition-all text-left flex flex-col gap-6"
                >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                        <Film size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2">Individual Clips</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-loose">Annotate specific high-performance moments and highlights.</p>
                    </div>
                </button>
            </div>
        </div>
    );
  }

  // 2. Final Report Screen
  if (showReport) {
      return (
        <div className="p-4 md:p-8 h-full overflow-y-auto bg-background animate-in fade-in duration-500">
          <GameReport 
            sport={sport}
            opponent={opponentName}
            date={gameDate}
            shots={clips.filter(c => c.status === 'plotted').map(c => ({
                id: c.id, gameId: associatedEventId, sport, result: (c.type === 'goal' ? 'goal' : 'save') as ShotResult,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[.25em] flex items-center gap-2 shadow-2xl">
                <Brain size={12} /> Coach OS Session Active
            </div>
            <div className="flex items-center gap-3">
                <input 
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    className="bg-transparent border-none outline-none text-xl font-black tracking-tighter text-foreground hover:bg-white/5 px-2 rounded-lg focus:bg-white/10 transition-colors w-auto min-w-[120px]"
                />
                <input 
                    type="date"
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    className="bg-card/50 border border-border/40 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Link Event:</span>
            <select 
                value={associatedEventId}
                onChange={(e) => setAssociatedEventId(e.target.value)}
                className="bg-card/50 border border-border/40 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
                <option value="">Create from Session</option>
                {events.map((e: { id: string, name: string }) => <option key={e.id} value={e.id} className="bg-background">{e.name}</option>)}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Video & Plotting Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* VIDEO PLAYER with Controls */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-xl border border-border/50 bg-card group">
              <video 
                ref={videoRef}
                src={videoUrl} 
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onClick={() => setIsPlaying(!isPlaying)}
                muted
              />

              {/* Master Playback Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                 <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black hover:scale-105 transition-transform"
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
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black">
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

            {/* PLOTTING MAPS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`bg-card/40 border border-border/30 rounded-[2.5rem] p-8 pb-8 transition-all duration-300 relative ${plotStep === 'field' ? 'ring-2 ring-primary/40 border-primary/40' : 'opacity-80'}`}>
                    <div className="text-center mb-6">
                        <span className={`text-[11px] font-black uppercase tracking-[.5em] ${plotStep === 'field' ? 'text-primary' : 'text-foreground/40'}`}>ZONE</span>
                    </div>
                    <div className="w-full flex items-center justify-center">
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

                <div className={`bg-card/40 border border-border/30 rounded-[2.5rem] p-8 pb-8 transition-all duration-300 relative ${plotStep === 'net' ? 'ring-2 ring-primary/40 border-primary/40' : 'opacity-80'}`}>
                    <div className="text-center mb-6">
                        <span className={`text-[11px] font-black uppercase tracking-[.5em] ${plotStep === 'net' ? 'text-primary' : 'text-foreground/40'}`}>NET</span>
                    </div>
                    <div className="w-full flex items-center justify-center">
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
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-xl px-3 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <Plus size={12} />
                        <span>Chart Shot</span>
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {clips.map((clip, i) => (
                        <div key={clip.id} className="flex flex-col gap-2 p-1">
                            <button 
                                onClick={() => jumpToClip(i)}
                                className={`w-full rounded-2xl p-4 transition-all border text-left flex items-center gap-4 ${
                                    activeClipIndex === i ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : clip.status === 'plotted' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-white/5 border-border/40 text-foreground/80 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex flex-col flex-1 gap-1">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${activeClipIndex === i ? 'opacity-70' : 'text-muted-foreground'}`}>Clip {i + 1}</span>
                                            <span className={`text-[9px] font-mono ${activeClipIndex === i ? 'opacity-70' : 'text-muted-foreground'}`}>0:{clip.timestamp.toString().padStart(2, '0')}</span>
                                            {clip.status === 'plotted' && <CheckCircle size={10} className={activeClipIndex === i ? 'text-primary-foreground' : 'text-emerald-500'} />}
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setClips(clips.filter((_, idx) => idx !== i)); 
                                                if(activeClipIndex === i) setActiveClipIndex(null); 
                                            }}
                                            className={`transition-colors p-1 rounded-full ${activeClipIndex === i ? 'text-primary-foreground hover:bg-black/20' : 'text-muted-foreground hover:bg-white/10 hover:text-white'}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest truncate">{clip.type}</span>
                                </div>
                            </button>
                            
                            <div className="flex gap-2 px-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleClipType(i); }}
                                    className={`flex-1 py-1 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all ${
                                        clip.type === 'save' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 'bg-muted border-border/20 text-muted-foreground'
                                    }`}
                                >
                                    Save
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleClipType(i); }}
                                    className={`flex-1 py-1 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-all ${
                                        clip.type === 'goal' ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-muted border-border/20 text-muted-foreground'
                                    }`}
                                >
                                    Goal
                                </button>
                                <select
                                    value={clip.period || 1}
                                    onChange={(e) => {
                                        const updated = [...clips];
                                        updated[i].period = parseInt(e.target.value);
                                        setClips(updated);
                                    }}
                                    className="bg-secondary/50 border border-border/20 rounded-lg text-[8px] font-bold px-1"
                                >
                                    {sport === 'soccer' ? (
                                        <>
                                            <option value="1">H1</option><option value="2">H2</option>
                                            <option value="3">ET1</option><option value="4">ET2</option>
                                            <option value="5">PKs</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="1">{terms.period[0]}1</option>
                                            <option value="2">{terms.period[0]}2</option>
                                            <option value="3">{terms.period[0]}3</option>
                                            {sport.includes('lacrosse') && <option value="4">{terms.period[0]}4</option>}
                                            <option value="5">OT</option>
                                        </>
                                    )}
                                </select>
                                <select
                                    value={clip.shotType || 'standard'}
                                    onChange={(e) => {
                                        const updated = [...clips];
                                        updated[i].shotType = e.target.value;
                                        setClips(updated);
                                    }}
                                    className="flex-1 bg-secondary/50 border border-border/20 rounded-lg text-[8px] font-bold px-1"
                                >
                                    <option value="standard">Type</option>
                                    {sport.includes('hockey') ? (
                                        <>
                                            <option value="wrist">Wrist</option>
                                            <option value="slap">Slap</option>
                                            <option value="snap">Snap</option>
                                            <option value="backhand">Backhand</option>
                                            <option value="tip">Tip</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="overhand">Overhand</option>
                                            <option value="sidearm">Sidearm</option>
                                            <option value="underhand">Underhand</option>
                                            <option value="bounce">Bounce</option>
                                            <option value="behind-back">BTB</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border/30">
                    <Button 
                        disabled={!clips.every(c => c.status === 'plotted')}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all ${
                            clips.every(c => c.status === 'plotted') ? 'bg-foreground text-background' : 'bg-muted opacity-50'
                        }`}
                        onClick={() => setShowReport(true)}
                    >
                        View Game Report
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
    </div>
  );
}
