"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Zap, ChevronRight, ChevronLeft, Activity, Check, CheckCircle, ThumbsUp, ThumbsDown, User, Flame, ArrowRight, ChevronDown, ChevronUp, Play, X, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { v11Engine } from "@/lib/v11-engine";
import { GoalieContext } from "@/types/goalie-v11";
import { determineRecommendation, PracticePlan } from "@/lib/expert-engine";
import { Button } from "@/components/ui/Button";
import { useAiContext } from "@/hooks/useAiContext";
import { LiveModeView } from "./goalie/LiveModeView";
import { IntegratedTrainingTimer } from "./goalie/IntegratedTrainingTimer";
import { MentalResetModal } from "./goalie/MentalResetModal";
import { startProtocolSession } from "@/app/actions";
import { getRecommendedDrills } from "@/lib/data/drills";
import { StreakTimeline } from "./goalie/protocol/StreakTimeline";
import { ProtocolCard } from "./goalie/protocol/ProtocolCard";
import { StreakDetailModal } from "./goalie/protocol/StreakDetailModal";

export function AiCoachRecommendation({
    lastMood, recentGames, rosterId, userId, overrideText, sport, isLive, onExit, onComplete, onLogAction, onRecommendationReady, goalieName, isGameday, nextEvent, gradYear, stats,
    v11Title, customMessage, variant = 'full', performanceSnapshot, streak = 0
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, userId?: string | null, overrideText?: string, sport?: string, isLive?: boolean,
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
    variant?: 'full' | 'compact',
    performanceSnapshot?: any,
    streak?: number
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
            const generatedPlan = determineRecommendation(
                textContext, 
                activeMood, 
                sport, 
                isGameday, 
                "", 
                "in-season", 
                "high-school", 
                stats,
                performanceSnapshot ? {
                    stability: performanceSnapshot.stability_score,
                    execution: performanceSnapshot.execution_score,
                    readiness: performanceSnapshot.readiness_score
                 } : undefined
            );
            
            setCurrentGreeting(selectedGreeting);
            setPlan(generatedPlan);
            setLoading(false);
            localStorage.setItem(cacheKey, JSON.stringify({ plan: generatedPlan, greeting: selectedGreeting, timestamp: Date.now() }));
        }, 1200);

    }, [contextLoading, textContext, activeMood, sport, isGameday, rosterId, performanceSnapshot]);

    const [sessionActive, setSessionActive] = useState(false);
    const [showMentalModal, setShowMentalModal] = useState(false);
    const [showProtocolDetail, setShowProtocolDetail] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const [isLiveLocal, setIsLiveLocal] = useState(false);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0); 
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [showProtocolCompletion, setShowProtocolCompletion] = useState(false);
    const [completionSlide, setCompletionSlide] = useState(0);
    const [protocolSessionId, setProtocolSessionId] = useState<string | null>(null);
    const [latestSnapshot, setLatestSnapshot] = useState<any>(null);

    const now = new Date("2026-03-28T14:25:39.000Z");
    const [lastTrainingDate, setLastTrainingDate] = useState<string | null>(null);

    // Derived Drills
    const alternativeDrills = useMemo(() => getRecommendedDrills(2), []);

    const handleLogAndComplete = async (customSnapshot?: any) => {
        if (customSnapshot) setLatestSnapshot(customSnapshot);
        
        setLastTrainingDate(now.toISOString());
        setTrainingComplete(true);
        
        window.dispatchEvent(new CustomEvent('performance_refresh'));

        if (onLogAction) onLogAction('Complete Daily Protocol');
        if (onComplete) onComplete(plan?.focus);
    };

    const handleStartSession = async (startIndex: number = 0) => {
        if (rosterId) {
            const res = await startProtocolSession(rosterId, rosterId, 'v11-standard-protocol');
            if (res.success) setProtocolSessionId(res.sessionId);
        }
        
        setCurrentPhaseIndex(startIndex);
        setSessionActive(true);
        setShowProtocolDetail(false);
    };

    const openProtocolDetail = (protocolData: any) => {
        setSelectedProtocol(protocolData);
        setShowMentalModal(true);
    };

    if (isLive || isLiveLocal) {
        return <LiveModeView onExit={() => { setIsLiveLocal(false); if (onExit) onExit(); }} onComplete={onComplete} />;
    }

    if (showProtocolCompletion) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="fixed inset-0 z-[120] bg-[#080808] text-white flex flex-col items-center justify-between p-8 pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+2rem)] overflow-hidden"
            >
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
                                <h2 className="text-[9.5rem] font-medium tracking-tighter leading-none text-white">{streak}</h2>
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-[.6em] text-white/20">Current Streak</span>
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
                                    { val: streak.toString(), label: "Day Streak" },
                                    { val: "1", label: "Best Streak" },
                                    { val: "...", label: "Stability" },
                                    { val: "...", label: "Execution" }
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
                                            <span className="text-[9.5rem] font-medium text-white tracking-tighter leading-none tabular-nums">
                                                {latestSnapshot ? Math.round(latestSnapshot.score_after) : idxData.total.toFixed(0)}
                                            </span>
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

                <div className="w-full max-w-sm flex flex-col items-center gap-8">
                    <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${completionSlide === i ? 'bg-white w-4' : 'bg-white/20'}`} />
                        ))}
                    </div>

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

    if (showMentalModal && plan) {
        return (
            <MentalResetModal 
                isOpen={showMentalModal}
                onClose={() => setShowMentalModal(false)}
                drill={selectedProtocol || { 
                    name: "Neural Reset", 
                    duration: "5 MIN", 
                    type: "mental", 
                    steps: ["Box Breathing", "Gaze Tuning", "Neural Reset"] 
                }}
                snapshot={latestSnapshot}
                sessionId={protocolSessionId || undefined}
                userId={userId || undefined}
                onComplete={(snapshot) => {
                    handleLogAndComplete(snapshot);
                    setShowMentalModal(false);
                    setShowProtocolCompletion(true);
                }}
            />
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
        const phases = {
                warmup: plan.warmup || { name: "Breathwork & Reset", duration: "5 MIN", steps: ["Deep nasal inhale", "Hold for 4", "Slow exhale"] },
                main: plan.main || { name: "Performance Drill", duration: "10 MIN" },
                mental: plan.mental || { name: "Mental Review", duration: "5 MIN" }
        };

        return (
            <IntegratedTrainingTimer 
                isOpen={sessionActive}
                onClose={() => setSessionActive(false)}
                plan={phases}
                onComplete={(data) => {
                    handleLogAndComplete(data.snapshot);
                    setSessionActive(false);
                    setShowProtocolCompletion(true);
                }}
                snapshot={latestSnapshot}
                sessionId={protocolSessionId || undefined}
                userId={userId || undefined}
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
            <StreakDetailModal 
                isOpen={showStreakModal}
                onClose={() => setShowStreakModal(false)}
                streak={streak}
                rosterId={rosterId}
                performanceSnapshot={performanceSnapshot}
            />

            <div className="w-full bg-transparent text-foreground py-10 relative overflow-hidden rounded-none">
                
                <StreakTimeline 
                    streak={streak} 
                    onClick={() => setShowStreakModal(true)} 
                    className="mb-10"
                />

                <div className="relative z-10 mb-10 px-1">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2 leading-none">
                        Hey, {goalieName?.split(' ')[0] || 'Goalie'}
                    </h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[.3em] mt-3">
                        Align your physical readiness with your mental focus.
                    </p>
                </div>
 
                <ProtocolCard 
                    variant="hero"
                    title={plan.main?.name || plan.focus || "CORE FUNDAMENTALS"}
                    description={plan.reason}
                    duration={plan.main?.duration || "15 MIN"}
                    stages={["Warmup", "Main", "Mental"]}
                    onClick={() => openProtocolDetail({ 
                        name: plan.main?.name || plan.focus || "CORE FUNDAMENTALS",
                        goal: plan.reason
                    })}
                />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternativeDrills.map(drill => (
                    <ProtocolCard 
                        key={drill.id}
                        variant="minimal"
                        title={drill.name}
                        description={drill.category.toUpperCase()}
                        duration={drill.duration}
                        onClick={() => openProtocolDetail({
                            name: drill.name,
                            goal: drill.description
                        })}
                    />
                ))}
            </div>
        </motion.div>
    );
}
