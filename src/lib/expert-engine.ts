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
        };
        videoWait: number;
    };
    priority: number; // Higher overrides lower
}

export const EXPERT_RULES: ExpertRule[] = [
    // --- HIGH PRIORITY SAFETY/RESET RULES ---
    {
        id: 'flag_pain',
        keywords: ['hurt', 'pain', 'sharp', 'ouch', 'twisted', 'groin', 'knee'],
        moods: ['happy', 'neutral', 'frustrated'],
        priority: 100,
        recommendation: {
            focus: "Injury Prevention",
            reason: "You mentioned pain. Do not train through sharp pain.",
            drill: { name: "Rest & Ice / Consult Trainer", duration: "N/A", type: "physical" },
            videoWait: 0
        }
    },
    {
        id: 'flag_quit',
        keywords: ['quit', 'hate', 'give up', 'done', 'worst'],
        moods: ['frustrated', 'neutral'],
        priority: 90,
        recommendation: {
            focus: "Mental Reset",
            reason: "We detected high frustration. Step away from the rink for 24h.",
            drill: { name: "Disconnect & Walk", duration: "30 mins", type: "mental" },
            videoWait: 0
        }
    },

    // --- SPORT SPECIFIC RULES (High Priority) ---
    {
        id: 'lax_bounce_shots',
        keywords: ['bounce', 'low shot', 'five hole', 'between legs'],
        moods: ['neutral', 'frustrated'],
        sports: ['Lacrosse'],
        priority: 85,
        recommendation: {
            focus: "Low Save Mechanics",
            reason: "Bounce shots require specific stick-path discipline.",
            drill: { name: "Wall Ball - Low Hops", duration: "15 mins", type: "physical" },
            videoWait: 0
        }
    },
    {
        id: 'hky_five_hole',
        keywords: ['five hole', 'between legs', 'squeaked through', 'under pads'],
        moods: ['neutral', 'frustrated'],
        sports: ['Hockey'],
        priority: 85,
        recommendation: {
            focus: "Butterfly Seal",
            reason: "Pucks going through the legs means stick discipline or knee seal issues.",
            drill: { name: "Butterfly Slides & Stick Seal", duration: "20 mins", type: "physical" },
            videoWait: 10
        }
    },

    // --- SKILL / GOAL ORIENTED RULES (triggered by Season Goals) ---
    {
        id: 'goal_rebounds',
        keywords: ['rebound', 'second chance', 'traffic', 'puck placement'],
        moods: ['neutral', 'happy', 'frustrated'], // Applies to all moods
        priority: 60, // Lower than safety/sport-specific, but higher than generic mood
        recommendation: {
            focus: "Rebound Control",
            reason: "Aligning with your focus on rebounds. Control the chaos.",
            drill: { name: "Rebound Placement (Box Control)", duration: "15 mins", type: "physical" },
            videoWait: 5
        }
    },
    {
        id: 'goal_hands',
        keywords: ['hands', 'glove', 'blocker', 'tracking', 'catching'],
        moods: ['neutral', 'happy', 'frustrated'],
        priority: 60,
        recommendation: {
            focus: "Hand-Eye Coordination",
            reason: "Sharpening your hands as requested. Eyes lead the hands.",
            drill: { name: "Juggling & Wall Ball tracking", duration: "10 mins", type: "physical" },
            videoWait: 0
        }
    },
    {
        id: 'goal_recovery',
        keywords: ['recover', 'scramble', 'get up', 'mobility', 'athleticism'],
        moods: ['neutral', 'happy', 'frustrated'],
        priority: 60,
        recommendation: {
            focus: "Recovery & Agility",
            reason: "Working on your recovery speed. Never quit on a play.",
            drill: { name: "Up-Downs / Recoveries", duration: "15 mins", type: "physical" },
            videoWait: 5
        }
    },

    // --- CONTRADICTION RULES (The "Delusional" Catcher) ---
    {
        id: 'bad_perf_happy_mood',
        keywords: ['terrible', 'awful', 'soft goals', 'played bad', 'let in 5', 'sieved'],
        moods: ['happy', 'confident' as any], // Cast for messy data
        priority: 80,
        recommendation: {
            focus: "Reality Check",
            reason: "You noted a poor performance but marked 'Happy'. Let's review the video objectively.",
            drill: { name: "Video Review (Goals Against)", duration: "20 mins", type: "video" },
            videoWait: 15
        }
    },

    // --- IMPOSTER SYNDROME (Good Result, Bad Feeling) ---
    {
        id: 'good_perf_bad_mood',
        keywords: ['lucky', 'imposter', 'didn\'t deserve', 'posts', 'bad rebound'],
        moods: ['frustrated'],
        priority: 75,
        recommendation: {
            focus: "Process Validation",
            reason: "You got the result but feel unsatisfied. Trust your positioning—it creates 'luck'.",
            drill: { name: "Positive Visualization (Saves)", duration: "10 mins", type: "mental" },
            videoWait: 0
        }
    },

    // --- STANDARD MOOD RULES (Fallback) ---
    {
        id: 'mood_frustrated',
        keywords: [], // Fallback if no keywords match
        moods: ['frustrated'],
        priority: 10,
        recommendation: {
            focus: "Reset & Simplify",
            reason: "Frustration kills reaction time. Simplify your game.",
            drill: { name: "Box Breathing & Basics", duration: "10 mins", type: "mental" },
            videoWait: 0
        }
    },
    {
        id: 'mood_happy',
        keywords: [],
        moods: ['happy'],
        priority: 10,
        recommendation: {
            focus: "High-Intensity Flow",
            reason: "Momentum is high. Push the pace.",
            drill: { name: "Post-to-Post Recoveries", duration: "15 mins", type: "physical" },
            videoWait: 5
        }
    },
    {
        id: 'mood_neutral',
        keywords: [],
        moods: ['neutral'],
        priority: 5,
        recommendation: {
            focus: "Hand-Eye Activation",
            reason: "Consistency day. Work on tracking.",
            drill: { name: "Wall Ball (Alt Hands)", duration: "10 mins", type: "physical" },
            videoWait: 10
        }
    }
];

export function determineRecommendation(text: string, mood: string, sport: string = 'Hockey'): ExpertRule['recommendation'] {
    const normalizeText = text.toLowerCase();

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
        drill: { name: "Crease Movement", duration: "15 mins", type: "physical" },
        videoWait: 0
    };
}
