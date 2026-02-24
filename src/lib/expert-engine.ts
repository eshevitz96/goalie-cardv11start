export interface ExpertRule {
    id: string;
    keywords: string[];
    moods: ('happy' | 'neutral' | 'frustrated')[];
    min_confidence?: number;
    sports?: string[]; // Optional: If defined, rule ONLY applies to these sports
    recommendation: {
        focus: string;
        reason: string;
        drill: {
            name: string;
            duration: string;
            type: 'physical' | 'mental' | 'video';
            steps?: string[]; // Optional steps for breakdown
        };
        videoWait: number;
    };
    priority: number; // Higher overrides lower
}

import { EXPERT_RULES } from "@/lib/data/expert-rules";

export function determineRecommendation(text: string, mood: string, sport: string = 'Hockey', isGameday: boolean = false, coachNotes?: string): ExpertRule['recommendation'] {
    const normalizeText = text.toLowerCase();

    // 0. GAME DAY RULES (Highest Priority Check)
    if (isGameday) {
        if (mood === 'happy' || mood === 'neutral') {
            return {
                focus: "Process & Flow",
                reason: "It's Game Day. You're feeling good. Trust your preparation and just play.",
                drill: {
                    name: "Hand-Eye Activation",
                    duration: "5 mins",
                    type: "physical",
                    steps: [
                        "Light juggling or wall ball.",
                        "Track the ball into your hand.",
                        "Keep feet moving.",
                        "Visualize confident saves."
                    ]
                },
                videoWait: 0
            };
        } else {
            // Anxious/Frustrated on Game Day
            return {
                focus: "Breathe & Reset",
                reason: "It's Game Day. Shake off the nerves. One save at a time.",
                drill: {
                    name: "Box Breathing",
                    duration: "3 mins",
                    type: "mental",
                    steps: [
                        "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.",
                        "Focus only on your breath.",
                        "Release tension in shoulders.",
                        "Say to yourself: 'I am ready.'"
                    ]
                },
                videoWait: 0
            };
        }
    }

    // 0.5 COACH FEEDBACK (Overrides standard rules if fresh)
    if (coachNotes && coachNotes.length > 5) {
        return {
            focus: "Coach's Orders",
            reason: `Your coach wants you to focus on: "${coachNotes.length > 60 ? coachNotes.substring(0, 60) + '...' : coachNotes}"`,
            drill: {
                name: "Coach Assigned Specifics",
                duration: "As Assigned",
                type: "physical",
                steps: [
                    "Review coach's notes above.",
                    "Execute drills as prescribed.",
                    "Focus on the details mentioned."
                ]
            },
            videoWait: 0
        };
    }

    // 1. Find all matching rules
    const matches = EXPERT_RULES.filter(rule => {
        // Mood Match? (Or rule applies to all moods if empty list? No, explicit strictly for now)
        const moodMatch = rule.moods.includes(mood as any);

        // Keyword Match?
        const keywordMatch = rule.keywords.length === 0 || rule.keywords.some(k => normalizeText.includes(k));

        // Sport Match? (If rule has sports defined, the goalies sport must be in it. If rule has NO sports, it applies to all)
        const sportMatch = !rule.sports || rule.sports.includes(sport);

        return moodMatch && keywordMatch && sportMatch;
    });

    // 2. Sort by Priority
    matches.sort((a, b) => b.priority - a.priority);

    // 3. Return winner or default
    if (matches.length > 0) {
        return matches[0].recommendation;
    }

    // Ultimate Fallback
    return {
        focus: "Fundamentals",
        reason: "Let's get back to basics.",
        drill: {
            name: "Goal Area Movement",
            duration: "15 mins",
            type: "physical",
            steps: [
                "10 Lateral pushes left to right.",
                "10 Drop slides left to right.",
                "10 Shuffles forward and backward.",
                "Focus on quiet upper body."
            ]
        },
        videoWait: 0
    };
}
