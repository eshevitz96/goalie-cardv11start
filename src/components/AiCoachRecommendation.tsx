"use client";

import { motion } from "framer-motion";
import { Brain, Play, CheckCircle, AlertTriangle, Lightbulb, Clock, ThumbsUp, ThumbsDown, Sparkles, Zap, ChevronRight, Activity, Target, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { determineRecommendation, ExpertRule } from "@/lib/expert-engine";
import { Button } from "@/components/ui/Button";
import { useBaseline } from "@/hooks/useBaseline";
import { useAiContext } from "@/hooks/useAiContext";
import { LiveModeView } from "./goalie/LiveModeView";
import { ActiveDrillTimer } from "./goalie/ActiveDrillTimer";


interface PerformanceRecommendation {
    focus: string;
    reason: string;
    drill: {
        name: string; duration: string;
        type: 'physical' | 'mental' | 'video';
        steps?: string[];
    };
    videoWait: number; // minutes
}

export function AiCoachRecommendation({
    lastMood, recentGames, rosterId, overrideText, sport, isLive, onExit, onComplete, onLogAction, onRecommendationReady, goalieName, isGameday, nextEvent
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, overrideText?: string, sport?: string, isLive?: boolean,
    onExit?: () => void, onComplete?: () => void,
    onLogAction?: (actionName: string) => void,
    onRecommendationReady?: (rec: PerformanceRecommendation) => void,
    goalieName?: string,
    isGameday?: boolean,
    nextEvent?: any // { title: string, date: string, type: string }
}) {
    const [rec, setRec] = useState<PerformanceRecommendation | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Get Context from Hook
    const { textContext, activeMood, seasonGoal, loading: contextLoading } = useAiContext(rosterId || null, overrideText, lastMood, nextEvent);

    // C. Feedback State
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const handleFeedback = async (isPositive: boolean) => {
        setFeedbackGiven(true);
        // In a real app, save to DB:
        // await supabase.from('ai_feedback').insert({ ... })
        // console.log(`User feedback: ${isPositive ? 'Helpful' : 'Not Helpful'}`);
    };

    useEffect(() => {
        setFeedbackGiven(false); // Reset when inputs change

        if (contextLoading) return;

        // B. Run the Local Expert Engine
        // SIMULATED LATENCY (The "Thinking" Pause)
        setTimeout(() => {
            const recommendation = determineRecommendation(textContext, activeMood, sport, isGameday, "");
            setRec(recommendation);
            setLoading(false);
            if (onRecommendationReady) onRecommendationReady(recommendation);
        }, 1200);

    }, [contextLoading, textContext, activeMood, sport, isGameday, onRecommendationReady]);

    // D. Action State (Moved Up)
    const [activeMode, setActiveMode] = useState(false);

    const [showProtocol, setShowProtocol] = useState(false);

    // LIVE GAME MODE
    if (isLive) {
        return <LiveModeView onExit={onExit} onComplete={onComplete} />;
    }


    const handleActionClick = () => {
        if (rec?.drill.type === 'mental') {
            setActiveMode(true);
        } else {
            // Show details modal for physical/video drills
            setShowProtocol(!showProtocol);
        }
    };

    const handleLogAndClose = () => {
        if (onLogAction && rec) {
            onLogAction(rec.drill.name);
        } else {
            // Fallback
            const element = document.getElementById('training-journal');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
        setShowProtocol(false);
    }

    if (loading) {
        return (
            <div className="w-full h-40 rounded-3xl bg-card border border-border p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/20" />
                <div className="h-4 w-32 bg-muted rounded-full" />
            </div>
        );
    }

    // ACTIVE MODE UI (For Mental Drills)
    if (activeMode && rec?.drill.type === 'mental') {
        return (
            <ActiveDrillTimer
                drillName={rec.drill.name}
                duration={rec.drill.duration}
                onExit={() => setActiveMode(false)}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8 relative"
        >
            <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter leading-none">
                    Hey, {goalieName ? goalieName.split(' ')[0] : 'Goalie'}.
                </h1>
                <p className="text-xl md:text-2xl font-medium text-muted-foreground tracking-tight">
                    {rec?.reason}
                </p>
            </div>

            {/* Action Block - Minimal & Bold */}
            <div className="group relative overflow-hidden rounded-3xl bg-card border border-border transition-all hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-background/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">

                    {/* Icon & Focus */}
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${rec?.drill.type === 'mental' ? 'bg-purple-500/10 text-purple-500' : 'bg-primary/10 text-primary'}`}>
                            {rec?.drill.type === 'mental' ? <Brain size={32} strokeWidth={1.5} /> : <Zap size={32} strokeWidth={1.5} />}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                                Today's Directive
                            </span>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">
                                {rec?.focus}
                            </h3>
                            <p className="text-sm text-foreground/70 font-medium mt-1">
                                {rec?.drill.name} • {rec?.drill.duration}
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={handleActionClick}
                        className="w-full md:w-auto px-8 py-4 bg-foreground text-background font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 h-auto"
                    >
                        {rec?.drill.type === 'mental' ? 'Start Focus' : (showProtocol ? 'Hide Protocol' : 'View Protocol')}
                        <ChevronRight size={18} className={`transition-transform duration-300 ${showProtocol ? 'rotate-90' : ''}`} />
                    </Button>
                </div>

                {/* Inline Protocol Expansion */}
                <motion.div
                    initial={false}
                    animate={{ height: showProtocol ? 'auto' : 0, opacity: showProtocol ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-muted/30 border-t border-border/50"
                >
                    <div className="p-6 pt-2">
                        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={16} /> Protocol Steps
                                </h4>
                                <Button size="sm" onClick={handleLogAndClose} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <Check size={16} className="mr-2" /> Mark Complete
                                </Button>
                            </div>

                            <ul className="space-y-3">
                                {rec?.drill.steps?.map((step: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-base text-foreground bg-background p-3 rounded-lg border border-border/40">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="leading-relaxed">{step}</span>
                                    </li>
                                )) || (
                                        <li className="text-sm text-muted-foreground italic p-4 text-center">
                                            Follow coach instructions for this drill.
                                        </li>
                                    )}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Subtle Feedback */}
            <div className="mt-4 flex justify-between items-center px-2">
                {seasonGoal && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 opacity-60">
                        <Target size={10} /> Season Goal: {seasonGoal}
                    </span>
                )}

                <div className={`flex gap-2 transition-opacity duration-300 ${feedbackGiven ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'}`}>
                    <Button variant="ghost" size="icon" onClick={() => handleFeedback(true)} className="p-2 hover:bg-muted rounded-full transition-colors h-auto w-auto"><ThumbsUp size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFeedback(false)} className="p-2 hover:bg-muted rounded-full transition-colors h-auto w-auto"><ThumbsDown size={14} /></Button>
                </div>
            </div>
        </motion.div>
    );
}
