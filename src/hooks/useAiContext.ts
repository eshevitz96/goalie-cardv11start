
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useBaseline } from "./useBaseline";

interface AiContext {
    textContext: string;
    activeMood: string;
    seasonGoal: string | null;
    loading: boolean;
}

export function useAiContext(rosterId: string | null, overrideText?: string, lastMood?: string, nextEvent?: any) {
    const [context, setContext] = useState<AiContext>({
        textContext: "",
        activeMood: "neutral",
        seasonGoal: null,
        loading: true
    });

    // 1. Get Baseline Data
    const { data: baselineData, loading: baselineLoading } = useBaseline(rosterId);

    useEffect(() => {
        if (!rosterId && !overrideText) {
            setContext(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchContext = async () => {
            let textContext = overrideText || "";
            let activeMood = lastMood || 'neutral';
            let seasonGoal: string | null = null;

            // A. Inject Upcoming Event Context (High Priority)
            if (nextEvent) {
                textContext += ` UPCOMING EVENT: ${nextEvent.title || nextEvent.name || 'Game'}.`;
            }

            // B. Inject Baseline Answers
            if (baselineData && baselineData.answers) {
                const qaString = baselineData.answers.map(a => `[Q: ${a.question} A: ${a.answer}]`).join(" ");
                textContext += ` BASELINE CONTEXT: ${qaString}`;

                if (activeMood === 'neutral' && baselineData.answers[0]?.mood) {
                    // Could use baseline mood, but usually journals are better
                }
            }

            if (!overrideText && rosterId) {
                try {
                    // C. Fetch Latest Reflection (Journal)
                    // We fetch top 3 to get trend
                    const { data: journalData } = await supabase
                        .from('reflections')
                        .select('content, mood, activity_type, created_at, skip_reason, injury_details')
                        .eq('roster_id', rosterId)
                        .neq('activity_type', 'baseline')
                        .order('created_at', { ascending: false })
                        .limit(3);

                    if (journalData && journalData.length > 0) {
                        // 1. Latest Entry Specifics (Simulating "Latest Journal" logic)
                        const latest = journalData[0];
                        if (latest.skip_reason) textContext += ` [STATUS: ${latest.skip_reason.toUpperCase()}]`;
                        if (latest.injury_details) textContext += ` [INJURY DETAILS: ${latest.injury_details}]`;

                        // Update Mood from latest journal if not provided by props
                        if (activeMood === 'neutral' && latest.mood) {
                            activeMood = latest.mood;
                        }

                        // 2. History Chain
                        const journalContext = journalData.map(j => `[${new Date(j.created_at).toLocaleDateString()}: ${j.content} (Mood: ${j.mood})]`).join(" ");
                        textContext += ` RECENT JOURNAL: ${journalContext}`;
                    }

                    // D. Fetch Season Goal (Legacy or from Roster)
                    const { data: rosterData } = await supabase
                        .from('roster_uploads')
                        .select('raw_data')
                        .eq('id', rosterId)
                        .single();

                    if (rosterData && rosterData.raw_data) {
                        if (rosterData.raw_data.baseline_goal) {
                            seasonGoal = rosterData.raw_data.baseline_goal;
                            textContext += ` SEASON GOAL: ${seasonGoal}.`;
                        }
                        // Confidence Check
                        if (rosterData.raw_data.baseline_confidence) {
                            const conf = rosterData.raw_data.baseline_confidence;
                            if (activeMood === 'neutral') {
                                if (parseInt(conf) <= 4) activeMood = 'anxious';
                                if (parseInt(conf) >= 8) activeMood = 'happy';
                            }
                        }
                    }

                    // E. Fetch Coach Notes
                    const { data: sessionData } = await supabase
                        .from('sessions')
                        .select('notes')
                        .eq('roster_id', rosterId)
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (sessionData && sessionData.notes) {
                        textContext += ` COACH NOTES: ${sessionData.notes}`;
                    }

                } catch (err) {
                    console.error("Error fetching AI context:", err);
                }
            }

            setContext({
                textContext,
                activeMood,
                seasonGoal,
                loading: false
            });
        };

        if (!baselineLoading) {
            fetchContext();
        }
    }, [rosterId, overrideText, lastMood, nextEvent, baselineData, baselineLoading]);

    return context;
}
