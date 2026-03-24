"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, Zap, ChevronRight, Activity, Check, CheckCircle, ThumbsUp, ThumbsDown, User, Flame, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
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
    onRecommendationReady?: (rec: any) => void, // Kept to not break existing signature
    goalieName?: string,
    isGameday?: boolean,
    nextEvent?: any, // { title: string, date: string, type: string }
    gradYear?: string | number,
    stats?: { gaa?: string, sv?: string, games?: number },
    v11Title?: string,
    customMessage?: string,
    variant?: 'full' | 'compact'
}) {
    const [plan, setPlan] = useState<PracticePlan | null>(null);
    const [currentGreeting, setCurrentGreeting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Get Context from Hook
    const { textContext, activeMood, seasonGoal, loading: contextLoading } = useAiContext(rosterId || null, overrideText, lastMood, nextEvent);


    useEffect(() => {

        if (contextLoading) return;

        // Check cache with mood-specificity
        const cacheKey = `ai_plan_v3_${rosterId}_${activeMood}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { plan: cachedPlan, greeting: cachedGreeting, timestamp } = JSON.parse(cached);
                const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
                if (hoursSince < 1) {
                    setPlan(cachedPlan);
                    setCurrentGreeting(cachedGreeting || "Morning, Goalie");
                    setLoading(false);
                    if (onRecommendationReady) onRecommendationReady(cachedPlan);
                    return;
                }
            } catch (_) { /* Corrupt cache */ }
        }
 
        setLoading(true);
 
        // Derive Season Stage
        const getSeasonStage = () => {
            const now = new Date();
            const month = now.getMonth();
            const s = sport?.toLowerCase() || 'hockey';
            
            if (s.includes('hockey')) {
                if (month >= 8 && month <= 9) return 'pre-season';
                if (month >= 10 || month <= 1) return 'in-season';
                if (month >= 2 && month <= 3) return 'playoffs';
                return 'off-season';
            }
            if (s.includes('lacrosse')) {
                if (month === 1) return 'pre-season';
                if (month >= 2 && month <= 4) return 'in-season';
                if (month === 5) return 'playoffs';
                return 'off-season';
            }
            return 'in-season';
        };

        // Derive Career Stage
        const getCareerStage = () => {
            if (!gradYear) return 'high-school';
            const year = typeof gradYear === 'string' ? parseInt(gradYear) : gradYear;
            const now = new Date();
            const currentYear = now.getFullYear();
            const diff = year - currentYear;
            
            if (diff > 4) return 'youth';
            if (diff >= 0) return 'high-school';
            return 'college-pro';
        };

        const seasonStage = getSeasonStage();
        const careerStage = getCareerStage();

        // Generate a fresh plan
        setTimeout(() => {
            const rawName = goalieName ? goalieName.split(' ')[0] : 'Goalie';
            const name = (rawName.toLowerCase() === 'boys' || rawName.toLowerCase() === 'girls') ? 'Goalie' : rawName;
            const hour = new Date().getHours();
            const timeGreeting = hour < 12 ? "Morning," : hour < 17 ? "Afternoon," : "Evening,";
            
            const options = activeMood === 'frustrated' || activeMood === 'anxious' 
                ? ["Reset,", "Deep breath,", "Steady,", "Next one,", "Focus,"]
                : (activeMood === 'happy' || activeMood === 'confident'
                    ? ["Let's work,", "Keep going,", "Stay dialed,", "Locked in,", "Ready,"]
                    : [timeGreeting, "Ready,", "Consistency,", "Let's go,", "Focus,"]);
            
            const selectedGreeting = `${options[Math.floor(Math.random() * options.length)]} ${name}`;
            const generatedPlan = determineRecommendation(textContext, activeMood, sport, isGameday, "", seasonStage, careerStage, stats);
            
            setCurrentGreeting(selectedGreeting);
            setPlan(generatedPlan);
            setLoading(false);
            if (onRecommendationReady) onRecommendationReady(generatedPlan);
            // Cache for 24 hours (with mood context)
            localStorage.setItem(cacheKey, JSON.stringify({ plan: generatedPlan, greeting: selectedGreeting, timestamp: Date.now() }));
        }, 1200);

    }, [contextLoading, textContext, activeMood, sport, isGameday, onRecommendationReady, rosterId]);

    // UI state
    const [expandedArea, setExpandedArea] = useState<'warmup' | 'main' | 'mental' | null>(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [showProtocol, setShowProtocol] = useState(false);
    const [isLiveLocal, setIsLiveLocal] = useState(false);
    const [isFolded, setIsFolded] = useState(true);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0); // 0: warmup, 1: main, 2: mental

    // LIVE GAME MODE
    if (isLive || isLiveLocal) {
        return <LiveModeView onExit={() => { setIsLiveLocal(false); if (onExit) onExit(); }} onComplete={onComplete} />;
    }

    const handleLogAndComplete = () => {
        if (!plan) return;
        if (onLogAction) {
            onLogAction(isGameday ? "Log Game Report" : "Log Training");
        }
        if (onComplete) {
            onComplete(plan.focus);
        }
    };

    const handleStartSession = (startIndex: number = 0) => {
        setCurrentPhaseIndex(startIndex);
        setSessionActive(true);
    };

    const handleNextPhase = () => {
        if (currentPhaseIndex < 2) {
            setCurrentPhaseIndex(currentPhaseIndex + 1);
        } else {
            setSessionActive(false);
            handleLogAndComplete();
        }
    };

    if (loading) {
        return (
            <div className="w-full h-40 rounded-3xl bg-card border border-border p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/20" />
                <div className="h-4 w-32 bg-muted rounded-full" />
            </div>
        );
    }

    // ACTIVE MODE UI (Sequential Timer)
    if (sessionActive && plan) {
        const phases: DrillDef[] = [
            plan.warmup || { name: "Warmup", duration: "5 mins", type: "physical" },
            plan.main || { name: "Directional Review", duration: "10 mins", type: "mental" },
            plan.mental || { name: "Reset", duration: "5 mins", type: "mental" }
        ];
        const activeDrill = phases[currentPhaseIndex];

        return (
            <ActiveDrillTimer
                drillName={activeDrill.name}
                duration={activeDrill.duration}
                onExit={() => setSessionActive(false)}
                onNext={handleNextPhase}
                isLastPhase={currentPhaseIndex === 2}
            />
        );
    }

    if (!plan) return null;

    const renderDrillCard = (id: 'warmup' | 'main' | 'mental', index: number, title: string, drill: DrillDef, icon: any, colorClass: string) => {
        const isExpanded = expandedArea === id;

        return (
            <div className="group relative overflow-hidden rounded-2xl bg-card border border-border transition-all hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <button
                    type="button"
                    onClick={() => setExpandedArea(isExpanded ? null : id)}
                    className={`w-full text-left bg-background/50 p-4 md:p-5 flex items-center justify-between gap-4 backdrop-blur-sm transition-all hover:bg-background/80 ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
                >
                    <div className="flex items-center gap-4 w-full">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                            {icon}
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                                {title}
                            </span>
                            <h3 className="text-lg font-black text-foreground tracking-tight leading-none mb-1">
                                {drill.name}
                            </h3>
                            <p className="text-xs text-foreground/70 font-medium">
                                {drill.duration}
                            </p>
                        </div>
                    </div>

                </button>

                {/* Inline Protocol Expansion */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="bg-muted/30 border-t border-border/50 overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Activity size={14} /> Protocol Steps
                                    </h4>

                                    <ul className="space-y-2 mb-4">
                                        {drill.steps?.map((step: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm text-foreground bg-background p-3 rounded-lg border border-border/40 leading-relaxed">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <span>{step}</span>
                                            </li>
                                        )) || (
                                                <li className="text-sm text-muted-foreground italic p-4 text-center">
                                                    Follow coach instructions for this drill.
                                                </li>
                                            )}
                                    </ul>

                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartSession(index);
                                        }}
                                        className="w-full bg-foreground text-background hover:scale-[1.01] font-bold flex items-center justify-center gap-2 h-auto"
                                    >
                                        <Zap size={16} /> Start Phase Timer
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

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
                            onClick={() => handleStartSession(0)}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 relative"
        >
            <div className="flex flex-col gap-1 relative">
                <div className="flex items-center gap-2 mb-2 translate-y-1">
                    <Brain size={14} className="text-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-[.2em] text-foreground opacity-70">Coach OS</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter leading-tight mb-4 text-balance">
                    {currentGreeting}
                </h1>
                <p className="text-xl font-medium text-muted-foreground tracking-tight leading-relaxed max-w-2xl mb-8">
                    {customMessage || plan.reason}
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                    {!isGameday ? (
                        !showProtocol ? (
                            <Button
                                onClick={() => setShowProtocol(true)}
                                className="bg-primary text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all text-sm flex items-center gap-2 h-auto shadow-xl shadow-primary/20"
                            >
                                <Zap size={16} fill="currentColor" /> Start Training
                            </Button>
                        ) : null
                    ) : (
                        <Button
                            onClick={() => setIsLiveLocal(true)}
                            className="bg-red-500 text-white font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all text-sm flex items-center gap-2 h-auto shadow-xl shadow-red-500/20"
                        >
                            <Flame size={16} fill="currentColor" /> Enter Live Mode
                        </Button>
                    )}
                    <Button
                        onClick={() => handleLogAndComplete()}
                        className="bg-foreground text-background font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all text-sm flex items-center gap-2 h-auto shadow-xl shadow-foreground/5"
                    >
                        <Check size={16} /> {isGameday ? "Log Game Report" : "Log Training"}
                    </Button>
                </div>

                {/* Training Protocol Cards Re-added */}
                {!isGameday && showProtocol && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/10 animate-in fade-in slide-in-from-top-4 duration-500">
                        {plan.warmup && renderDrillCard('warmup', 0, "Warmup", plan.warmup, <Activity className="text-blue-500" />, "bg-blue-500/10 text-blue-500")}
                        {plan.main && renderDrillCard('main', 1, "Main Logic", plan.main, <Target className="text-primary" />, "bg-primary/10 text-primary")}
                        {plan.mental && renderDrillCard('mental', 2, "Mental Reset", plan.mental, <Brain className="text-purple-500" />, "bg-purple-500/10 text-purple-500")}
                    </div>
                )}
            </div>
        </motion.div >
    );
}
