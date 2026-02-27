export interface DrillDef {
    name: string;
    duration: string;
    type: 'physical' | 'mental' | 'video';
    steps?: string[];
}

export interface PracticePlan {
    focus: string;
    reason: string;
    warmup: DrillDef;
    main: DrillDef;
    mental: DrillDef;
    videoWait: number;
}

export interface ExpertRule {
    id: string;
    keywords: string[];
    moods: ('happy' | 'neutral' | 'frustrated')[];
    min_confidence?: number;
    sports?: string[]; // Optional: If defined, rule ONLY applies to these sports
    recommendation: {
        focus: string;
        reason: string;
        drill: DrillDef;
        videoWait: number;
    };
    priority: number; // Higher overrides lower
}

import { EXPERT_RULES } from "@/lib/data/expert-rules";
import { WARMUPS, MENTAL_RESETS, DEFAULT_DRILL } from "@/lib/data/protocols";

// Helper for Warmups
function getWarmup(sport: string): DrillDef {
    const s = sport.toLowerCase();
    if (s.includes('lacrosse')) return WARMUPS.lacrosse;
    if (s.includes('soccer')) return WARMUPS.soccer;
    if (s.includes('hockey')) return WARMUPS.hockey;
    return WARMUPS.default;
}

// Helper for Mental Reset
function getMentalReset(mood: string): DrillDef {
    return MENTAL_RESETS[mood] || MENTAL_RESETS.neutral;
}

export function determineRecommendation(text: string, mood: string, sport: string = 'Hockey', isGameday: boolean = false, coachNotes?: string): PracticePlan {
    const normalizeText = text.toLowerCase();

    const warmup = getWarmup(sport);
    const mental = getMentalReset(mood);

    // 0. GAME DAY RULES (Highest Priority Check)
    if (isGameday) {
        if (mood === 'happy' || mood === 'neutral') {
            return {
                focus: "Process & Flow",
                reason: "It's Game Day. You're feeling good. Trust your preparation and just play.",
                warmup,
                main: {
                    name: "Game Situation Reads",
                    duration: "15 mins",
                    type: "physical",
                    steps: [
                        "Have a shooter simulate game-like entries.",
                        "Track the release point.",
                        "Focus entirely on your depth and angle, saving energy."
                    ]
                },
                mental,
                videoWait: 0
            };
        } else {
            // Anxious/Frustrated on Game Day
            return {
                focus: "Breathe & Reset",
                reason: "It's Game Day. Shake off the nerves. One save at a time.",
                warmup,
                main: {
                    name: "Confidence Builders",
                    duration: "10 mins",
                    type: "physical",
                    steps: [
                        "Take 10 easy shots to the chest to feel the puck/ball.",
                        "Track it all the way in.",
                        "Focus on the feeling of stopping it.",
                        "No complex movements, just saves."
                    ]
                },
                mental,
                videoWait: 0
            };
        }
    }

    // 0.5 COACH FEEDBACK (Overrides standard rules if fresh)
    if (coachNotes && coachNotes.length > 5) {
        return {
            focus: "Coach's Directive",
            reason: `Your coach has assigned a specific protocol: "${coachNotes.length > 60 ? coachNotes.substring(0, 60) + '...' : coachNotes}"`,
            warmup,
            main: {
                name: "Coach's Protocol",
                duration: "As Assigned",
                type: "physical",
                steps: [
                    "Review coach's notes above.",
                    "Execute drills as prescribed.",
                    "Focus on the details mentioned."
                ]
            },
            mental,
            videoWait: 0
        };
    }

    // 1. Find all matching rules
    const matches = EXPERT_RULES.filter(rule => {
        const moodMatch = rule.moods.includes(mood as any);
        const keywordMatch = rule.keywords.length === 0 || rule.keywords.some(k => normalizeText.includes(k));
        const sportMatch = !rule.sports || rule.sports.includes(sport);
        return moodMatch && keywordMatch && sportMatch;
    });

    matches.sort((a, b) => b.priority - a.priority);

    let mainFocusTop = matches.length > 0 ? matches[0].recommendation : {
        focus: "Fundamentals",
        reason: "Let's get back to basics and build consistency.",
        drill: DEFAULT_DRILL,
        videoWait: 0
    };

    return {
        focus: mainFocusTop.focus,
        reason: mainFocusTop.reason,
        warmup,
        main: mainFocusTop.drill,
        mental,
        videoWait: mainFocusTop.videoWait
    };
}

