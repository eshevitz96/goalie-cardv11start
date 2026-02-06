"use client";

import { motion } from "framer-motion";
import { Brain, Play, CheckCircle, AlertTriangle, Lightbulb, Clock, ThumbsUp, ThumbsDown, Sparkles, Zap, ChevronRight, Activity, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { determineRecommendation, ExpertRule } from "@/lib/expert-engine";
import { Button } from "@/components/ui/Button";

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
    lastMood, recentGames, rosterId, overrideText, sport, isLive, onExit, onComplete, onLogAction, goalieName, isGameday
}: {
    lastMood?: string, recentGames?: any[], rosterId?: string, overrideText?: string, sport?: string, isLive?: boolean,
    onExit?: () => void, onComplete?: () => void,
    onLogAction?: (actionName: string) => void,
    goalieName?: string,
    isGameday?: boolean
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
            if (rosterId) {
                try {
                    const { data: rosterData } = await supabase
                        .from('roster_uploads')
                        .select('raw_data')
                        .eq('id', rosterId)
                        .single();

                    if (rosterData && rosterData.raw_data) {
                        if (rosterData.raw_data.baseline_goal) {
                            const currentSeasonGoal = rosterData.raw_data.baseline_goal;
                            setSeasonGoal(currentSeasonGoal);
                            textContext += ` My season goal is ${currentSeasonGoal}.`;
                        }
                        if (rosterData.raw_data.baseline_confidence) {
                            const conf = rosterData.raw_data.baseline_confidence;
                            textContext += ` My confidence level is ${conf}/10.`;
                            // If no recent mood, use confidence as proxy
                            if (activeMood === 'neutral') {
                                if (parseInt(conf) <= 4) activeMood = 'anxious';
                                if (parseInt(conf) >= 8) activeMood = 'happy';
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error fetching baseline:", err);
                }
            }

            // A3. Fetch Latest Coach Feedback (Session Notes)
            let latestCoachNote = "";
            if (rosterId) {
                try {
                    const { data: sessionData } = await supabase
                        .from('sessions')
                        .select('notes')
                        .eq('roster_id', rosterId)
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (sessionData && sessionData.notes) {
                        latestCoachNote = sessionData.notes;
                        // Append context for debug/logging if needed, but we pass explicitly
                    }
                } catch (err) {
                    console.error("Error fetching coach notes:", err);
                }
            }

            // B. Run the Local Expert Engine
            // SIMULATED LATENCY (The "Thinking" Pause)
            setTimeout(() => {
                const recommendation = determineRecommendation(textContext, activeMood, sport, isGameday, latestCoachNote);
                setRec(recommendation);
                setLoading(false);
            }, 1200);
        };

        fetchBaselineAndRec();
        fetchBaselineAndRec();
    }, [lastMood, rosterId, overrideText, sport, isLive]);

    // D. Action State (Moved Up)
    const [activeMode, setActiveMode] = useState(false);
    const [timer, setTimer] = useState(60);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        let interval: any;
        if (timerActive && timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timer === 0) {
            setTimerActive(false);
        }
        return () => clearInterval(interval);
    }, [timerActive, timer]);

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
                        <Button variant="ghost" onClick={onExit} className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-colors h-auto">
                            Exit Live Mode
                        </Button>
                        <Button onClick={onComplete} className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2 h-auto">
                            End Game & Journal <ChevronRight size={14} />
                        </Button>
                    </div>

                </div>
            </motion.div>
        );
    }


    const handleActionClick = () => {
        if (rec?.drill.type === 'mental') {
            setActiveMode(true);
            setTimer(rec.drill.duration.includes('15') ? 900 : 300); // 15m vs 5m default
            setTimerActive(true);
        } else if (rec?.drill.type === 'physical') {
            if (onLogAction) {
                onLogAction(rec.drill.name);
            } else {
                // Fallback if no callback provided
                const element = document.getElementById('training-journal');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
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

    // ACTIVE MODE UI (For Mental Drills)
    if (activeMode && rec?.drill.type === 'mental') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative overflow-hidden rounded-3xl bg-black border border-emerald-500/30 p-1 shadow-2xl"
            >
                <div className="relative bg-black rounded-[24px] p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" onClick={() => setActiveMode(false)} className="text-muted-foreground hover:text-white text-xs font-bold uppercase p-0 h-auto hover:bg-transparent">Exit</Button>
                    </div>

                    <div className="mb-6">
                        <Activity className="w-12 h-12 text-emerald-500 animate-pulse mx-auto opacity-50" />
                    </div>

                    <h2 className="text-6xl font-black text-white font-mono tracking-widest mb-4">
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </h2>
                    <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                        {timerActive ? "Focus Active" : "Session Complete"}
                    </p>

                    <p className="mt-8 text-white/50 text-sm max-w-[200px]">
                        "{rec?.drill.name}"
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-8"
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
            <div className="group relative overflow-hidden rounded-3xl bg-card border border-border p-1 transition-all hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-background/50 rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">

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
                        {rec?.drill.type === 'mental' ? 'Start Focus' : 'Log Activity'} <ChevronRight size={18} />
                    </Button>
                </div>
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
