"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Zap, ChevronRight, ChevronLeft, Activity, Check, CheckCircle, ThumbsUp, ThumbsDown, User, Flame, ArrowRight, ChevronDown, ChevronUp, Play, X, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { v11Engine } from "@/lib/v11-engine";
import { GoalieContext } from "@/types/goalie-v11";
import { determineRecommendation, PracticePlan, DrillDef } from "@/lib/expert-engine";
import { Button } from "@/components/ui/Button";
import { useAiContext } from "@/hooks/useAiContext";
import { LiveModeView } from "./goalie/LiveModeView";
import { ActiveDrillTimer } from "./goalie/ActiveDrillTimer";

export function AiCoachRecommendation({
    lastMood, recentGames, rosterId, overrideText, sport, isLive, onExit, onComplete, onLogAction, onRecommendationReady, goalieName, isGameday, nextEvent, gradYear, stats,
    v11Title, customMessage, variant = 'full'
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, overrideText?: string, sport?: string, isLive?: boolean,
    onExit?: () => void, onComplete?: (planFocus?: string) => void,
    onLogAction?: (actionName: string) => void,
    onRecommendationReady?: (rec: any) => void,
    goalieName?: string,
    isGameday?: boolean,
    nextEvent?: any,
    gradYear?: string | number,
    stats?: { gaa?: string, sv?: string, games?: number },
    v11Title?: string,
    customMessage?: string,
    variant?: 'full' | 'compact'
}) {
    const router = useRouter();
    const [plan, setPlan] = useState<PracticePlan | null>(null);
    const [currentGreeting, setCurrentGreeting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { textContext, activeMood, loading: contextLoading } = useAiContext(rosterId || null, overrideText, lastMood, nextEvent);

    useEffect(() => {
        if (contextLoading) return;

        const cacheKey = `ai_plan_v4_${rosterId}_${activeMood}_${sport}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { plan: cachedPlan, greeting: cachedGreeting, timestamp } = JSON.parse(cached);
                const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
                if (hoursSince < 1) {
                    setPlan(cachedPlan);
                    setCurrentGreeting(cachedGreeting || "Morning, Goalie");
                    setLoading(false);
                    return;
                }
            } catch (_) { }
        }

        setLoading(true);

        setTimeout(() => {
            const rawName = goalieName ? goalieName.split(' ')[0] : 'Goalie';
            const name = (rawName.toLowerCase() === 'boys' || rawName.toLowerCase() === 'girls') ? 'Goalie' : rawName;
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? "Morning," : hour < 17 ? "Afternoon," : "Evening,";
            
            const options = activeMood === 'frustrated' || activeMood === 'anxious' 
                ? ["Reset,", "Deep breath,", "Steady,", "Next one,", "Focus,"]
                : ["Let's work,", "Keep going,", "Stay dialed,", "Locked in,", "Ready,"];
            
            const selectedGreeting = `${options[Math.floor(Math.random() * options.length)]} ${name}`;
            const generatedPlan = determineRecommendation(textContext, activeMood, sport, isGameday, "", "in-season", "high-school", stats);
            
            setCurrentGreeting(selectedGreeting);
            setPlan(generatedPlan);
            setLoading(false);
            localStorage.setItem(cacheKey, JSON.stringify({ plan: generatedPlan, greeting: selectedGreeting, timestamp: Date.now() }));
        }, 1200);

    }, [contextLoading, textContext, activeMood, sport, isGameday, rosterId]);

    const [sessionActive, setSessionActive] = useState(false);
    const [showMentalModal, setShowMentalModal] = useState(false);
    const [showProtocolDetail, setShowProtocolDetail] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [isLiveLocal, setIsLiveLocal] = useState(false);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0); 
    const [breathSettings, setBreathSettings] = useState({ duration: '10 MIN', technique: '4-4-4' });
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [showProtocolCompletion, setShowProtocolCompletion] = useState(false);
    const [completionSlide, setCompletionSlide] = useState(0);

    const daysArr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const now = new Date("2026-03-28T14:25:39.000Z");
    const todayIdx = (now.getDay() + 6) % 7;
    
    const currentWeekInfo = useMemo(() => {
        const start = new Date(now);
        const day = now.getDay(); // 0 is Sunday
        // If today is Sunday (0), we want to go back 6 days to Monday.
        // If today is Monday (1), we want to stay at 0 offset.
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        start.setDate(diff);
        
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}`;
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push({ 
                day: daysArr[i], 
                date: d.getDate(), 
                isToday: d.toDateString() === now.toDateString(),
                isPast: d < now && d.toDateString() !== now.toDateString()
            });
        }
        return { label, days };
    }, [now]);

    const [classesTaken, setClassesTaken] = useState(0);
    const [lastTrainingDate, setLastTrainingDate] = useState<string | null>(null);
    const [dayStreak, setDayStreak] = useState(2);

    useEffect(() => {
        const savedClasses = localStorage.getItem(`classes_${rosterId}`);
        const savedLastDate = localStorage.getItem(`last_training_${rosterId}`);
        if (savedClasses) setClassesTaken(parseInt(savedClasses));
        if (savedLastDate) {
            setLastTrainingDate(savedLastDate);
            const last = new Date(savedLastDate);
            const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) setTrainingComplete(true);
            if (diffDays <= 1) setDayStreak(diffDays === 0 ? 2 : 1);
            else setDayStreak(0);
        }
    }, [rosterId]);

    const handleLogAndComplete = () => {
        const newClasses = classesTaken + 1;
        setClassesTaken(newClasses);
        setLastTrainingDate(now.toISOString());
        setTrainingComplete(true);
        localStorage.setItem(`classes_${rosterId}`, newClasses.toString());
        localStorage.setItem(`last_training_${rosterId}`, now.toISOString());
        if (onLogAction) onLogAction('Complete Daily Protocol');
        if (onComplete) onComplete(plan?.focus);
    };

    const handleStartSession = (startIndex: number = 0) => {
        setCurrentPhaseIndex(startIndex);
        setSessionActive(true);
        setShowProtocolDetail(false);
    };

    const handleNextPhase = () => {
        if (currentPhaseIndex < 2) {
            setCurrentPhaseIndex(prev => prev + 1);
        } else {
            setSessionActive(false);
            setShowProtocolCompletion(true);
            setCompletionSlide(0);
            handleLogAndComplete();
        }
    };

    const openProtocolDetail = (protocolData: any) => {
        setSelectedProtocol(protocolData);
        setShowMentalModal(true);
    };

    if (isLive || isLiveLocal) {
        return <LiveModeView onExit={() => { setIsLiveLocal(false); if (onExit) onExit(); }} onComplete={onComplete} />;
    }

    if (showStreakModal) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 sm:p-12 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-[env(safe-area-inset-left)]"
            >
                <div className="w-full max-w-sm bg-[#080808] border border-white/5 rounded-[3.25rem] p-8 flex flex-col gap-10 shadow-[0_20px_100px_rgba(0,0,0,0.8)] relative group">
                    <button 
                        onClick={() => setShowStreakModal(false)}
                        className="absolute -top-12 right-0 md:-right-12 text-white/20 hover:text-white uppercase text-[8px] font-bold tracking-[.4em] transition-colors [-webkit-tap-highlight-color:transparent]"
                    >
                        Close [ESC]
                    </button>

                    {/* Week Navigation */}
                    <div className="flex items-center justify-between px-2">
                        <button className="text-white/30 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                        <span className="text-[10px] font-medium text-white/50 uppercase tracking-[.45em]">{currentWeekInfo.label}</span>
                        <button className="text-white/30 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                    </div>

                    {/* Date Selector Row */}
                    <div className="grid grid-cols-7 gap-2 text-center pb-2">
                        {currentWeekInfo.days.map((d, i) => (
                            <div key={i} className="flex flex-col gap-4 items-center">
                                <span className="text-[10px] font-medium text-white/40 uppercase">{d.day}</span>
                                <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-[11px] font-bold transition-all ${
                                    d.isToday ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 
                                    d.isPast ? 'bg-white/[0.08] text-white/90' : 
                                    'text-white/20'
                                }`}>
                                    {d.date}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-[0.5px] bg-white/5 w-full -my-2" />

                    {/* Main Performance Metrics */}
                    <div className="flex gap-16 py-4">
                        <div className="space-y-1">
                            <h2 className="text-[5.5rem] font-medium tracking-tighter leading-none text-white">{dayStreak}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[.35em] text-white/40">Day Streak</p>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-[5.5rem] font-medium tracking-tighter leading-none text-white">1</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[.35em] text-white/40">Week Streak</p>
                        </div>
                    </div>

                    <div className="h-[0.5px] bg-white/5 w-full -my-2" />

                    {/* Performance Breakdown Grid */}
                    <div className="grid grid-cols-4 gap-6 py-2">
                        {[
                            { val: dayStreak.toString(), label: "Best Day Streak" },
                            { val: classesTaken.toString(), label: "Classes Taken" },
                            { val: (classesTaken * 14).toString(), label: "Minutes Practiced" },
                            { val: "1", label: "Best Week Streak" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-2.5">
                                <span className="text-2xl font-medium text-white leading-none">{stat.val}</span>
                                <span className="text-[7.5px] font-bold uppercase tracking-[.15em] text-white/30 leading-tight">
                                    {stat.label.split(' ').map((word, wi) => (
                                        <span key={wi} className="block">{word}</span>
                                    ))}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Secondary Navigation Hint */}
                    <div className="flex justify-center pt-2">
                        <ChevronUp className="text-white/10" size={20} />
                    </div>
                </div>
            </motion.div>
        );
    }

    if (showProtocolCompletion) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="fixed inset-0 z-[120] bg-[#080808] text-white flex flex-col items-center justify-between p-8 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+2rem)] overflow-hidden"
            >
                {/* Protocol Header (Persistent) */}
                <div className="w-full max-w-sm flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src="/flower-logo.png" className="w-6 h-6 opacity-80" alt="Logo" style={{ filter: 'invert(1)' }} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">March 2026</span>
                            <span className="text-sm font-semibold tracking-tight">Daily Practice</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowProtocolCompletion(false)}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Progress Bar (Persistent) */}
                <div className="w-full max-w-sm space-y-1 my-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                        <span>1/31</span>
                    </div>
                    <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '15%' }}
                            className="h-full bg-white/60"
                        />
                    </div>
                </div>

                {/* Main Slide Content */}
                <AnimatePresence mode="wait">
                    {completionSlide === 0 && (
                        <motion.div 
                            key="slide0"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
                        >
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold tracking-tight text-white">Session Complete</h3>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[.4em]">Analytics Profile Updated</p>
                            </div>
                            
                            <div className="relative">
                                <h2 className="text-[9.5rem] font-medium tracking-tighter leading-none text-white">{classesTaken}</h2>
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[.6em] text-white/20">Classes Taken</span>
                            </div>
                        </motion.div>
                    )}

                    {completionSlide === 1 && (
                        <motion.div 
                            key="slide1"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex-1 flex flex-col items-center justify-center w-full max-w-sm"
                        >
                            <div className="grid grid-cols-2 gap-x-12 gap-y-16 w-full px-4">
                                {[
                                    { val: dayStreak.toString(), label: "Day Streak" },
                                    { val: classesTaken.toString(), label: "Sessions" },
                                    { val: "1", label: "Best Streak" },
                                    { val: (classesTaken * 14).toString(), label: "Minutes" }
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-6xl font-medium tracking-tighter text-white">{stat.val}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-[.25em] text-white/30">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {completionSlide === 2 && (
                        <motion.div 
                            key="slide2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-12"
                        >
                            {(() => {
                                const goalieCtx: GoalieContext = {
                                    userId: rosterId || 'anonymous',
                                    sport: (sport?.toLowerCase() as any) || 'hockey',
                                    schedule: { 
                                        nextEventDate: now, 
                                        nextEventType: isGameday ? 'game' : 'none', 
                                        lastEventDate: now, 
                                        seasonPhase: 'in-season' 
                                    },
                                    readiness: { sorenessLevel: 3, sleepQuality: 8 },
                                    priorities: [], struggles: [], 
                                    lastCompleted: { stats_logging: lastTrainingDate || now.toISOString() } as any, 
                                    pendingCoachFeedbackCount: 0, 
                                    unchartedVideosCount: 0
                                };

                                const idxData = v11Engine.calculateGoalieIndex(goalieCtx, true);
                                
                                return (
                                    <>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-bold uppercase tracking-[.6em] text-white/20">Analysis Complete</span>
                                            <h3 className="text-xl font-semibold uppercase tracking-tight leading-none">Elite Index</h3>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[9.5rem] font-medium text-white tracking-tighter leading-none tabular-nums">{idxData.total.toFixed(0)}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current Rank</span>
                                        </div>

                                        <div className="w-full max-w-sm space-y-6 pt-10 border-t border-white/5">
                                            <span className="text-[8px] font-bold uppercase tracking-[.4em] text-white/20 block mb-6 px-1">How to rank up</span>
                                            <div className="grid grid-cols-1 gap-1 pb-10">
                                                {[
                                                    { label: "Daily Journal Entry", pts: "5", status: "READY" },
                                                    { label: "Chart Performance", pts: "15", status: "NEW FILM" },
                                                    { label: "7-Day Active Streak", pts: "10", status: "ACTIVE" }
                                                ].map((guide, i) => (
                                                    <div key={i} className="grid grid-cols-[1fr_auto] items-center p-4 py-3 bg-white/[0.01] border border-white/5 rounded-2xl">
                                                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                                                            <span className="text-[9px] font-medium text-white/90 uppercase tracking-widest leading-none truncate">{guide.label}</span>
                                                            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">{guide.status}</span>
                                                        </div>
                                                        <div className="w-14 flex justify-end items-baseline gap-1.5 shrink-0">
                                                            <span className="text-white font-bold text-[11px] tracking-tight">{guide.pts}</span>
                                                            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">PTS</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Controls (Persistent) */}
                <div className="w-full max-w-sm flex flex-col items-center gap-8">
                    {/* Dots */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${completionSlide === i ? 'bg-white w-4' : 'bg-white/20'}`} />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 w-full">
                        <button className="flex-1 h-16 rounded-full border border-white/10 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/5">
                            Share
                        </button>
                        <button 
                            onClick={() => {
                                if (completionSlide < 2) setCompletionSlide(prev => prev + 1);
                                else setShowProtocolCompletion(false);
                            }}
                            className="flex-1 h-16 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                        >
                            {completionSlide < 2 ? 'Next' : 'Done'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (showMentalModal) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="fixed inset-0 z-[110] bg-black text-white p-6 md:p-12 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-y-auto"
            >
                {/* Minimal Header HUD — REFINED INSTRUMENTAL */}
                <div className="w-full flex justify-between items-start mb-12 md:mb-16">
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none mb-1 text-white">
                            {selectedProtocol?.name || "Mental Reset"}
                        </h1>
                        <span className="text-[12px] font-black tracking-[.2em] text-white/60">15 MIN</span>
                    </div>
                    <button 
                        onClick={() => setShowMentalModal(false)}
                        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <X size={20} className="text-white/60" />
                    </button>
                </div>

                <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center space-y-8 md:space-y-12 items-center text-center py-4">
                    
                    <div className="flex flex-col items-center gap-4 w-full">
                        {/* Centered Eyebrow above Visuals */}
                        <span className="text-[10px] font-black uppercase tracking-[.49em] text-white/40">Protocol Sequence</span>

                        {/* Tactical Phase Grid — VISUAL + INSTRUCTIONAL */}
                        <div className="grid grid-cols-3 gap-6 w-full py-6 border-y border-white/10">
                        {/* 01: Visual Stillness */}
                        <div className="flex flex-col items-center gap-6 px-4">
                            <span className="text-[10px] font-black text-primary/40 tracking-[.5em]">01 VISUAL</span>
                            <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center relative">
                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                <motion.div 
                                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.1, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 border border-white/20 rounded-full"
                                />
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-xs font-black uppercase tracking-widest block text-white">Still Gaze</span>
                                <p className="text-[7.5px] font-bold text-white/40 uppercase tracking-[.2em] leading-relaxed max-w-[100px] mx-auto">
                                    Fixate on center. Still the optic nerve.
                                </p>
                            </div>
                        </div>

                        {/* 02: Breath (Technique-Aware Visual) */}
                        <div className="flex flex-col items-center gap-6 px-4">
                            <span className="text-[10px] font-black text-primary/40 tracking-[.5em]">02 BREATH</span>
                            <div className="w-16 h-16 relative flex items-center justify-center">
                                {plan?.focus?.toLowerCase().includes('box') ? (
                                    <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
                                        <rect x="10" y="10" width="80" height="80" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.05" />
                                        <motion.rect
                                            x="10" y="10" width="80" height="80"
                                            fill="none" stroke="white" strokeWidth="2"
                                            strokeDasharray="320"
                                            animate={{ strokeDashoffset: [320, 0] }}
                                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                        />
                                    </svg>
                                ) : (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <motion.div 
                                            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.2, 0.6] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-10 h-10 rounded-full border border-white/40"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-xs font-black uppercase tracking-widest block text-white">Rhythm</span>
                                <p className="text-[7.5px] font-bold text-white/40 uppercase tracking-[.2em] leading-relaxed max-w-[100px] mx-auto">
                                    Controlled cycle. Optimal heart rate.
                                </p>
                            </div>
                        </div>

                        {/* 03: Lock In / Terminal */}
                        <div className="flex flex-col items-center gap-6 px-4">
                            <span className="text-[10px] font-black text-primary/40 tracking-[.5em]">03 LOCK IN</span>
                            <div className="w-16 h-16 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden bg-white/[0.02]">
                                <motion.div 
                                    animate={{ y: [-20, 20] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                                    className="w-full h-[1px] bg-primary/40 shadow-[0_0_10px_var(--primary)]"
                                />
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-xs font-black uppercase tracking-widest block text-white">Terminal</span>
                                <p className="text-[7.5px] font-bold text-white/40 uppercase tracking-[.2em] leading-relaxed max-w-[100px] mx-auto">
                                    Clear field. Prepare for tracking.
                                </p>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Primary Engagement Action — Spaced for Visibility */}
                    <div className="flex flex-col items-center gap-6 pt-2 pb-6 md:pb-0">
                        <button 
                            onClick={() => { 
                                setShowMentalModal(false); 
                                handleStartSession(0);
                                if (onLogAction) onLogAction(`Start Protocol: ${selectedProtocol?.name || 'Daily'}`); 
                            }}
                            className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white text-black flex items-center justify-center group hover:scale-[1.08] transition-all shadow-[0_0_80px_rgba(255,255,255,0.15)] active:scale-95 duration-500"
                        >
                            <Play fill="currentColor" size={40} className="ml-2 group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[.6em]">Begin Protocol</p>
                            <span className="text-[8px] text-white/20 uppercase tracking-[.4em] font-bold">Lvl. 1 Calibration</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-[400px] rounded-[2.5rem] bg-card border border-border p-12 flex flex-col items-center justify-center gap-6">
                <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[.4em] text-muted-foreground">Synchronizing Protocol...</p>
            </div>
        );
    }

    if (sessionActive && plan) {
        const phases: DrillDef[] = [
            { name: "Breathwork & Reset", duration: "5 MIN", type: "mental", steps: ["Deep nasal inhale", "Hold for 4", "Slow exhale"] },
            plan.main || { name: "Performance Drill", duration: "10 MIN", type: "physical" },
            plan.mental || { name: "Mental Review", duration: "5 MIN", type: "mental" }
        ];
        const activeDrill = phases[currentPhaseIndex];

        return (
            <ActiveDrillTimer
                drillName={activeDrill.name}
                duration={activeDrill.duration || '5 MIN'}
                onExit={() => setSessionActive(false)}
                onNext={handleNextPhase}
                isLastPhase={currentPhaseIndex === 2}
                currentStep={currentPhaseIndex + 1}
                totalSteps={3}
            />
        );
    }

    if (!plan) return null;

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full relative"
            >
                <div className="flex flex-col gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Brain size={16} className="text-primary" />
                            </div>
                            <p className="text-sm font-medium text-foreground tracking-tight leading-snug">
                                <span className="text-primary font-bold mr-1">Coach Recommendation:</span>
                                {customMessage || plan.reason}
                            </p>
                        </div>
                        <Button
                            onClick={() => openProtocolDetail({ name: plan.main?.name || "Recommended Protocol", goal: plan.reason })}
                            className="bg-foreground text-background font-black px-4 py-1.5 rounded-xl hover:scale-105 transition-all text-xs flex items-center gap-2 h-auto shrink-0"
                        >
                            <Zap size={14} /> Log Training
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >

            {/* Primary Protocol Block - COMPACT INSTRUMENTAL */}
            <div className="w-full bg-transparent text-foreground py-10 relative overflow-hidden rounded-none">
                
                {/* 1. TOP: Calendar Streak (Instrumental Alignment) */}
                <div 
                    onClick={() => setShowStreakModal(true)}
                    className="flex items-center justify-between mb-10 relative z-10 font-bold uppercase tracking-[.45em] cursor-pointer group"
                >
                    <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] relative">
                        {/* 
                            Streak Range Pill - Highly Precise Alignment
                            Day pitch = w-8 (2rem) + gap-2 (0.5rem) = 2.5rem.
                        */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 h-8 bg-foreground/[0.08] rounded-full z-0 transition-all duration-500" 
                            style={{ 
                                left: `calc(${todayIdx > 1 ? todayIdx - 2 : 0} * 2.5rem - 0.4rem)`,
                                width: `calc(${(todayIdx > 1 ? 2 : 0)} * 2.5rem + 2.8rem)` 
                            }}
                        />
                        
                        {daysArr.map((day, i) => {
                            const isToday = i === todayIdx;
                            return (
                                <div key={i} className="relative flex flex-col items-center w-8 text-center z-10 transition-colors">
                                    <span className={`text-[11px] w-full block ${isToday ? 'text-foreground font-black' : 'text-foreground/30 font-bold'}`}>{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. GREETING BLOCK */}
                <div className="relative z-10 mb-10 px-1">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2 leading-none">
                        Hey, {goalieName?.split(' ')[0] || 'Elliott'}
                    </h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.3em] mt-3">
                        Align your physical readiness with your mental focus.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
