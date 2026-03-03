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
    lastMood, recentGames, rosterId, overrideText, sport, isLive, onExit, onComplete, onLogAction, onRecommendationReady, goalieName, isGameday, nextEvent
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, overrideText?: string, sport?: string, isLive?: boolean,
    onExit?: () => void, onComplete?: (planFocus?: string) => void,
    onLogAction?: (actionName: string) => void,
    onRecommendationReady?: (rec: any) => void, // Kept to not break existing signature
    goalieName?: string,
    isGameday?: boolean,
    nextEvent?: any // { title: string, date: string, type: string }
}) {
    const [plan, setPlan] = useState<PracticePlan | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Get Context from Hook
    const { textContext, activeMood, seasonGoal, loading: contextLoading } = useAiContext(rosterId || null, overrideText, lastMood, nextEvent);

    // Feedback State
    const [feedbackSelection, setFeedbackSelection] = useState<'positive' | 'negative' | null>(null);
    const handleFeedback = async (isPositive: boolean) => {
        setFeedbackSelection(isPositive ? 'positive' : 'negative');
    };

    useEffect(() => {
        setFeedbackSelection(null);

        if (contextLoading) return;

        // Check 24-hour cache
        const cacheKey = `ai_plan_${rosterId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { plan: cachedPlan, timestamp } = JSON.parse(cached);
                const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
                if (hoursSince < 24) {
                    setPlan(cachedPlan);
                    setLoading(false);
                    if (onRecommendationReady) onRecommendationReady(cachedPlan);
                    return;
                }
            } catch (_) { /* Corrupt cache, regenerate */ }
        }

        // Generate a fresh plan
        setTimeout(() => {
            const generatedPlan = determineRecommendation(textContext, activeMood, sport, isGameday, "");
            setPlan(generatedPlan);
            setLoading(false);
            if (onRecommendationReady) onRecommendationReady(generatedPlan);
            // Cache for 24 hours
            localStorage.setItem(cacheKey, JSON.stringify({ plan: generatedPlan, timestamp: Date.now() }));
        }, 1200);

    }, [contextLoading, textContext, activeMood, sport, isGameday, onRecommendationReady, rosterId]);

    // UI state
    const [expandedArea, setExpandedArea] = useState<'warmup' | 'main' | 'mental' | null>(null);
    const [sessionActive, setSessionActive] = useState(false);
    const [isFolded, setIsFolded] = useState(true);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0); // 0: warmup, 1: main, 2: mental

    // LIVE GAME MODE
    if (isLive) {
        return <LiveModeView onExit={onExit} onComplete={onComplete} />;
    }

    const handleLogAndComplete = () => {
        if (!plan) return;
        if (onLogAction) {
            onLogAction(`Completed Plan: ${plan.focus}`);
        }
        if (onComplete) {
            onComplete(plan.focus);
        } else {
            // Fallback scroll
            const element = document.getElementById('training-journal');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
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
        const phases: DrillDef[] = [plan.warmup, plan.main, plan.mental];
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

                    <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all ${isExpanded ? 'bg-primary text-black rotate-90' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                        <ChevronRight size={16} />
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 relative"
        >
            <div className="flex flex-col gap-1 mb-6 border-b border-border/50 pb-6 relative">
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-none mb-2">
                    {(activeMood === 'frustrated' || activeMood === 'anxious') ? "Hey," : "Let's work,"} {goalieName ? goalieName.split(' ')[0] : 'Goalie'}
                </h1>
                <p className="text-lg font-medium text-muted-foreground tracking-tight pr-24">
                    {plan.reason}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        onClick={() => handleStartSession(0)}
                        className="bg-foreground text-background font-black px-6 py-2 rounded-xl hover:scale-105 transition-all text-sm flex items-center gap-2 h-auto"
                    >
                        <Zap size={16} /> Start Full Session
                    </Button>
                    {isGameday && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-500 w-fit animate-pulse">
                            <Flame size={12} /> Game Day
                        </div>
                    )}
                    {seasonGoal && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary w-fit">
                            <Target size={12} /> Goal: {seasonGoal}
                        </div>
                    )}
                </div>

                <div className="absolute right-0 top-0 pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFolded(!isFolded)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 hover:bg-muted/50 transition-all font-bold text-[10px] uppercase tracking-wider"
                    >
                        {isFolded ? (
                            <>
                                <ChevronDown size={14} /> Show Plan
                            </>
                        ) : (
                            <>
                                <ChevronUp size={14} /> Collapse Plan
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {!isFolded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4">
                            {/* 1. WARMUP */}
                            {renderDrillCard(
                                'warmup',
                                0,
                                'Phase 1: Activation',
                                plan.warmup,
                                <Flame size={24} strokeWidth={1.5} />,
                                'bg-orange-500/10 text-orange-500'
                            )}

                            {/* 2. MAIN FOCUS */}
                            {renderDrillCard(
                                'main',
                                1,
                                `Phase 2: Main Focus - ${plan.focus}`,
                                plan.main,
                                <Zap size={24} strokeWidth={1.5} />,
                                'bg-primary/10 text-primary'
                            )}

                            {/* 3. MENTAL RESET */}
                            {renderDrillCard(
                                'mental',
                                2,
                                'Phase 3: Cooldown & Reflect',
                                plan.mental,
                                <Brain size={24} strokeWidth={1.5} />,
                                'bg-purple-500/10 text-purple-500'
                            )}
                        </div>

                        {/* Final Completion Action */}
                        <div className="mt-8">
                            <Button
                                onClick={handleLogAndComplete}
                                className="w-full py-6 md:py-8 bg-foreground text-background font-black rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 h-auto text-lg shadow-xl"
                            >
                                <CheckCircle size={24} />
                                <span>Finish Plan & Reflect</span>
                            </Button>
                            <p className="text-center text-xs text-muted-foreground mt-3 font-medium">
                                Completing the plan will unlock the Daily Journal
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle Feedback */}
            <div className="mt-8 flex flex-col items-center gap-2">
                {feedbackSelection ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs font-bold text-primary flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/20"
                    >
                        <Check size={14} /> Thank you for your feedback!
                    </motion.div>
                ) : (
                    <div className="flex gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(true)}
                            className="gap-2 hover:bg-muted transition-colors rounded-full text-xs font-bold tracking-wide border border-transparent hover:border-border"
                        >
                            <ThumbsUp size={14} /> Helpful
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(false)}
                            className="gap-2 hover:bg-muted transition-colors rounded-full text-xs font-bold tracking-wide border border-transparent hover:border-border"
                        >
                            <ThumbsDown size={14} /> Not Helpful
                        </Button>
                    </div>
                )}
            </div>
        </motion.div >
    );
}
