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
    stats?: { gaa?: string, sv?: string, games?: number },
    performance?: { stability?: number, execution?: number, readiness?: number }
): PracticePlan {
    const normalizeText = text.toLowerCase();

    // 1. Find all matching rules from the Coach OS Library
    const matches = [...EXPERT_RULES].filter(rule => {
        const moodMatch = rule.moods.includes(mood as any);
        const keywordMatch = rule.keywords.length === 0 || rule.keywords.some(k => normalizeText.includes(k));
        const sportMatch = !rule.sports || rule.sports.includes(sport.toLowerCase());
        return moodMatch && keywordMatch && sportMatch;
    });

    // 2. Data-Driven Injectors (Elite Engine)
    // These fire at priority 120–121 — above sport tactics (80–85), below safety/burnout (140–150).
    if (performance) {
        if (performance.stability && performance.stability < 70) {
            matches.push({
                id: 'low-stability-auto',
                keywords: [],
                moods: ['happy', 'neutral', 'frustrated'],
                priority: 120,
                recommendation: {
                    focus: "Stability & Core Foundation",
                    reason: "Your stability index is currently below threshold. We need to prioritize your base today.",
                    videoWait: 0,
                    drill: {
                        name: "Steady Stance Series",
                        duration: "10 mins",
                        type: "physical",
                        steps: ["Single leg balance (30s each)", "C-Cut stability holds", "Depth management transitions"]
                    }
                }
            });
        }

        if (performance.readiness && performance.readiness < 60) {
            matches.push({
                id: 'low-readiness-auto',
                keywords: [],
                moods: ['happy', 'neutral', 'frustrated'],
                priority: 121,
                recommendation: {
                    focus: "Recovery & Neural Flow",
                    reason: "Readiness is low. High-intensity is high-risk today. Let's focus on neural flow and mobility.",
                    videoWait: 0,
                    drill: {
                        name: "Neural Reset Mobility",
                        duration: "12 mins",
                        type: "physical",
                        steps: ["Box breathing (5 mins)", "Hip & Ankle active release", "Slow visual tracking (juggling or wall ball)"]
                    }
                }
            });
        }
    }

    // 3. Stat-Driven Injectors — fires when tracked metrics are objectively poor
    if (stats) {
        const gaa = parseFloat(stats.gaa ?? '0');
        const sv = parseFloat(stats.sv ?? '0');
        const hasEnoughGames = (stats.games ?? 0) >= 3;

        if (hasEnoughGames && (gaa > 3.5 || sv < 0.880)) {
            const statLabel = gaa > 3.5
                ? `GAA of ${gaa.toFixed(2)}`
                : `SV% of ${(sv * 100).toFixed(1)}%`;
            matches.push({
                id: 'poor-stats-auto',
                keywords: [],
                moods: ['happy', 'neutral', 'frustrated'],
                priority: 95,
                recommendation: {
                    focus: "Goal Prevention Fundamentals",
                    reason: `Your ${statLabel} indicates a structural issue. Today we reset the foundation.`,
                    videoWait: 0,
                    drill: {
                        name: "Positioning Reset",
                        duration: "12 mins",
                        type: "physical",
                        steps: [
                            "Angle play from 5 shot zones (no rush)",
                            "Depth management check — challenge line vs. back of crease",
                            "Lateral recovery to posts with controlled reset"
                        ]
                    }
                }
            });
        }
    }

    // Sort by priority (high to low)
    matches.sort((a, b) => b.priority - a.priority);

    // 4. Select the top priority level and pick a random matching rule from that tier
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
