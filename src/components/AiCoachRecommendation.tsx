"use client";

import { motion } from "framer-motion";
import { Brain, Play, CheckCircle, AlertTriangle, Lightbulb, Clock, ThumbsUp, ThumbsDown, Sparkles, Zap, ChevronRight, Activity, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { determineRecommendation, ExpertRule } from "@/lib/expert-engine";

interface PerformanceRecommendation {
    focus: string;
    reason: string;
    drill: {
        name: string; duration: string;
        type: 'physical' | 'mental' | 'video'
    };
    videoWait: number; // minutes
}

export function AiCoachRecommendation({
    lastMood, recentGames, rosterId, overrideText, sport, isLive, onExit, onComplete
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, overrideText?: string, sport?: string, isLive?: boolean,
    onExit?: () => void, onComplete?: () => void
}) {
    const [rec, setRec] = useState<PerformanceRecommendation | null>(null);
    const [loading, setLoading] = useState(true);
    const [baselineMood, setBaselineMood] = useState<string | null>(null);
    const [seasonGoal, setSeasonGoal] = useState<string | null>(null);

    // C. Feedback State
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const handleFeedback = async (isPositive: boolean) => {
        setFeedbackGiven(true);
        // In a real app, save to DB:
        // await supabase.from('ai_feedback').insert({ ... })
        console.log(`User feedback: ${isPositive ? 'Helpful' : 'Not Helpful'}`);
    };

    useEffect(() => {
        setFeedbackGiven(false); // Reset when inputs change
        if (!rosterId && !overrideText) return;
        // ... (rest of effect)
        const fetchBaselineAndRec = async () => {
            // A. Get the Context (Text + Mood)
            let textContext = overrideText || "";
            let activeMood = lastMood || 'neutral';

            // Use direct prop if available (for Stress Tests), otherwise fetch from DB
            if (!overrideText && rosterId) {
                try {
                    const { data, error } = await supabase
                        .from('reflections')
                        .select('content, mood, author_role, skip_reason, injury_details')
                        .eq('roster_id', rosterId)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!error && data) {
                        // FILTER: Only listen to the ATHLETE (Safety Protocol)
                        if (data.author_role === 'goalie' || !data.author_role) {
                            textContext = data.content || "";

                            // Contextualize Injury/Skip

                            if (data.skip_reason) {
                                textContext += ` [STATUS: ${data.skip_reason.toUpperCase()}]`;
                            }
                            if (data.injury_details) {
                                textContext += ` [INJURY DETAILS: ${data.injury_details}]`;
                            }

                            activeMood = data.mood || activeMood;
                        }
                    }
                } catch (err) {
                    console.error("Error fetching reflection context:", err);
                }
            }

            // A2. Fetch Season Baseline (Goal)
            let currentSeasonGoal = "";
            if (rosterId) {
                try {
                    const { data: rosterData } = await supabase
                        .from('roster_uploads')
                        .select('raw_data')
                        .eq('id', rosterId)
                        .single();

                    if (rosterData && rosterData.raw_data && rosterData.raw_data.baseline_goal) {
                        currentSeasonGoal = rosterData.raw_data.baseline_goal;
                        setSeasonGoal(currentSeasonGoal);
                        // Append to context to influence the expert engine
                        // We weight it slightly less by adding it at the end, or we can deal with it in the engine
                        // For now, simple concatenation allows keyword matching on the goal too.
                        textContext += ` My season goal is ${currentSeasonGoal}.`;
                    }
                } catch (err) {
                    console.error("Error fetching baseline:", err);
                }
            }

            // B. Run the Local Expert Engine
            // SIMULATED LATENCY (The "Thinking" Pause)
            setTimeout(() => {
                const recommendation = determineRecommendation(textContext, activeMood, sport);
                setRec(recommendation);
                setLoading(false);
            }, 600);
        };

        fetchBaselineAndRec();
        fetchBaselineAndRec();
    }, [lastMood, rosterId, overrideText, sport, isLive]);

    // LIVE GAME MODE
    if (isLive) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative overflow-hidden rounded-3xl bg-black border border-white/10 p-1 shadow-2xl"
            >
                {/* Red Pulse Background */}
                <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />

                <div className="relative bg-black rounded-[24px] p-8 border border-red-500/20 shadow-2xl overflow-hidden flex flex-col items-center text-center justify-center min-h-[300px]">

                    {/* Live Badge */}
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Live In-Game</span>
                    </div>

                    <Activity className="w-12 h-12 text-red-500 mb-6 animate-pulse" />

                    <h2 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tighter mb-4">
                        RESET.
                    </h2>
                    <h2 className="text-3xl md:text-4xl font-bold text-white/50 leading-none tracking-tight">
                        STAY IN IT.
                    </h2>

                    <div className="mt-8 flex gap-4">
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                            Breathe
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                            Focus
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md">
                            Next Save
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={onExit} className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
                            Exit Live Mode
                        </button>
                        <button onClick={onComplete} className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2">
                            End Game & Journal <ChevronRight size={14} />
                        </button>
                    </div>

                </div>
            </motion.div>
        );
    }

    if (loading) {
        return (
            <div className="w-full h-40 rounded-3xl bg-card border border-border p-6 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/20" />
                <div className="h-4 w-32 bg-muted rounded-full" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden rounded-3xl glass p-1 shadow-2xl"
        >
            {/* Background gradients matching GoalieCard */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl pointer-events-none" />

            <div className="relative bg-transparent rounded-[24px] p-8 overflow-hidden">

                {/* Subtle Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary/10" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">Performance Insight</span>
                </div>

                {/* THE STATEMENT (Apple Health Style) */}
                <div className="mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight mb-4">
                        {rec?.reason}
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium">
                        Focus: <span className="text-foreground">{rec?.focus}</span>
                    </p>
                </div>

                {/* Context Badge - SHOW CONNECTION */}
                {seasonGoal && (
                    <div className="mb-6 flex items-center gap-2">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Target size={10} /> Aligned with Season Goal
                        </span>
                        <div className="h-px bg-border flex-1" />
                    </div>
                )}

                {/* Action Grid (Minimalist) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col p-5 bg-muted/40 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Protocol</span>
                        <span className="text-lg font-bold text-foreground">{rec?.drill.name}</span>
                    </div>
                    <div className="flex flex-col p-5 bg-muted/40 rounded-2xl border border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Duration</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-foreground">{rec?.drill.duration}</span>
                            <span className="text-xs text-muted-foreground">Session</span>
                        </div>
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Was this helpful?</span>

                    {!feedbackGiven ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFeedback(true)}
                                className="p-2 rounded-full hover:bg-green-500/10 hover:text-green-500 text-muted-foreground transition-colors"
                            >
                                <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFeedback(false)}
                                className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-colors"
                            >
                                <ThumbsDown className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 text-green-500"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Thanks for feedback!</span>
                        </motion.div>
                    )}
                </div>

            </div>
        </motion.div>
    );
}
