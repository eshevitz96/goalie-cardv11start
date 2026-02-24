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

// Helper for Warmups
function getWarmup(sport: string, mood: string): DrillDef {
    if (sport.toLowerCase().includes('lacrosse')) {
        return {
            name: "Wall Ball Activation",
            duration: "10 mins",
            type: "physical",
            steps: [
                "50 right hand, 50 left hand.",
                "Quick stick exchanges.",
                "Focus on soft hands and tracking the ball to the plastic."
            ]
        };
    }

    // Default / Hockey
    return {
        name: "Hand-Eye & Movement Prep",
        duration: "10 mins",
        type: "physical",
        steps: [
            "2-ball juggling for 3 minutes to lock in focus.",
            "Dynamic stretching (lunges, leg swings).",
            "Crease movement: 5 sets of post-to-post slides.",
            "Visual tracking: Follow the puck/ball to your hand."
        ]
    };
}

// Helper for Mental Reset
function getMentalReset(mood: string): DrillDef {
    if (mood === 'frustrated' || mood === 'anxious') {
        return {
            name: "Box Breathing (Reset)",
            duration: "3 mins",
            type: "mental",
            steps: [
                "Find a quiet spot or close your eyes at the bench.",
                "Inhale for 4 seconds.",
                "Hold for 4 seconds.",
                "Exhale for 4 seconds.",
                "Hold for 4 seconds.",
                "Repeat. Let go of the session's outcome."
            ]
        };
    }

    if (mood === 'happy') {
        return {
            name: "Success Visualization",
            duration: "3 mins",
            type: "mental",
            steps: [
                "Close your eyes and replay your best save from today.",
                "Notice your positioning and how effortless it felt.",
                "Lock in that feeling of confidence.",
                "Recognize the work you put in today."
            ]
        };
    }

    // Neutral
    return {
        name: "End of Session Review",
        duration: "3 mins",
        type: "mental",
        steps: [
            "Take 3 deep breaths.",
            "Review one thing you did really well today.",
            "Review one micro-adjustment you want to bring into tomorrow.",
            "Leave the work at the rink and step away clean."
        ]
    };
}

export function determineRecommendation(text: string, mood: string, sport: string = 'Hockey', isGameday: boolean = false, coachNotes?: string): PracticePlan {
    const normalizeText = text.toLowerCase();

    const warmup = getWarmup(sport, mood);
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
            focus: "Coach's Orders",
            reason: `Your coach wants you to focus on: "${coachNotes.length > 60 ? coachNotes.substring(0, 60) + '...' : coachNotes}"`,
            warmup,
            main: {
                name: "Coach Assigned Specifics",
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
        drill: {
            name: "Goal Area Movement",
            duration: "15 mins",
            type: "physical" as const,
            steps: [
                "10 Lateral pushes left to right.",
                "10 Drop slides left to right.",
                "10 Shuffles forward and backward.",
                "Focus on quiet upper body."
            ]
        },
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
