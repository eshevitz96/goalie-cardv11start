export interface DrillDef {
    name: string;
    duration: string;
    type: 'physical' | 'mental' | 'video';
    steps?: string[];
    reason?: string;
}

export interface PracticePlan {
    focus: string;
    reason: string;
    warmup?: DrillDef;
    main?: DrillDef; 
    mental?: DrillDef;
    videoWait: number;
}

export interface ExpertRule {
    id: string;
    keywords: string[];
    moods: ('happy' | 'neutral' | 'frustrated')[];
    min_confidence?: number;
    sports?: string[];
    recommendation: {
        focus: string;
        reason?: string;
        reasons?: string[];
        warmup?: DrillDef;
        drill?: DrillDef; 
        mental?: DrillDef;
        videoWait: number;
    };
    priority: number;
}

import { EXPERT_RULES } from "@/lib/data/expert-rules";

export function determineRecommendation(
    text: string,
    mood: string,
    sport: string = 'Hockey',
    isGameday: boolean = false,
    coachNotes?: string,
    seasonStage?: string,
    careerStage?: string,
    stats?: { gaa?: string, sv?: string, games?: number }
): PracticePlan {
    const normalizeText = text.toLowerCase();

    // 1. Find all matching rules from the Coach OS Library
    const matches = EXPERT_RULES.filter(rule => {
        const moodMatch = rule.moods.includes(mood as any);
        const keywordMatch = rule.keywords.length === 0 || rule.keywords.some(k => normalizeText.includes(k));
        const sportMatch = !rule.sports || rule.sports.includes(sport.toLowerCase());
        return moodMatch && keywordMatch && sportMatch;
    });

    // Sort by priority (high to low)
    matches.sort((a, b) => b.priority - a.priority);

    // 2. Select the top priority level and pick a random matching rule
    const topPriority = matches.length > 0 ? matches[0].priority : 0;
    const topMatches = matches.filter(m => m.priority === topPriority);

    const selectedRule = topMatches.length > 0 
        ? topMatches[Math.floor(Math.random() * topMatches.length)]
        : null;

    const topMatch = selectedRule ? selectedRule.recommendation : {
        focus: "Foundation",
        reason: "Let's stick to your standard preparation today. Consistency is the goal.",
        videoWait: 0
    };

    const finalReason = topMatch.reasons && topMatch.reasons.length > 0
        ? topMatch.reasons[Math.floor(Math.random() * topMatch.reasons.length)]
        : (topMatch.reason || "Consistency is key today. Focus on your standard preparation.");

    // Dynamic Protocol Generator if specific rules lack hardcoded drills
    const lowerSport = sport.toLowerCase();
    const sportPrefix = lowerSport.includes('lacrosse') ? 'Lacrosse' : lowerSport.includes('soccer') ? 'Soccer' : 'Hockey';
    
    const resolvedWarmup: DrillDef = topMatch.warmup || {
        name: `${sportPrefix} Dynamic Prep`,
        duration: "5 mins",
        type: "physical",
        steps: ["Active dynamic stretching", "Hand-eye tracking series (wall ball or juggling)", "Light footwork & crease mobility"]
    };

    const resolvedDrill: DrillDef = topMatch.drill || {
        name: `${topMatch.focus} Execution`,
        duration: "10 mins",
        type: "physical",
        steps: ["Slow-motion shadow reps focusing strictly on form", `Live repetitions testing: ${topMatch.focus.toLowerCase()}`, "High-tempo game situation simulation"]
    };

    const resolvedMental: DrillDef = topMatch.mental || {
        name: "Cognitive Lock-In",
        duration: "3 mins",
        type: "mental",
        steps: ["Box breathing cycles (4-4-4-4)", `Visualize perfect execution of ${topMatch.focus.toLowerCase()}`, "Positive reaffirmation & reset"]
    };

    // 3. Construct the practice plan
    return {
        focus: topMatch.focus,
        reason: finalReason,
        warmup: resolvedWarmup,
        main: resolvedDrill,
        mental: resolvedMental,
        videoWait: topMatch.videoWait
    };
}
