import { ExpertRule } from "@/lib/expert-engine";

export const EXPERT_RULES: ExpertRule[] = [
    // --- HIGH STAKES EVENTS ---
    {
        id: 'event_championship',
        keywords: ['championship', 'final', 'trophy', 'gold medal', 'cup'],
        moods: ['happy', 'neutral', 'frustrated'],
        priority: 95,
        recommendation: {
            focus: "Championship Mindset",
            reason: "The work is done. Trust your training. Enjoy the moment.",
            drill: {
                name: "Visualization (Hoisting the Trophy)",
                duration: "5 mins",
                type: "mental",
                steps: [
                    "Find a quiet space and close your eyes.",
                    "Visualize the final buzzer sounding with your team winning.",
                    "Feel the weight of the trophy in your hands.",
                    "See your teammates celebrating with you.",
                    "Hold this feeling of success."
                ]
            },
            videoWait: 0
        }
    },
    {
        id: 'event_playoff',
        keywords: ['playoff', 'elimination', 'post-season', 'quarters', 'semis'],
        moods: ['happy', 'neutral', 'frustrated'],
        priority: 94,
        recommendation: {
            focus: "Playoff Intensity",
            reason: "Win or go home. Battle for every inch of ice.",
            drill: {
                name: "Reaction Speed Activation",
                duration: "10 mins",
                type: "physical",
                steps: [
                    "Warm up with light juggling (2 balls) for 2 minutes.",
                    "Partner throws ball against wall from behind you - react and catch.",
                    "3 sets of 10 rapid-fire reaction catches.",
                    "Focus on eyes locking onto the ball instantly."
                ]
            },
            videoWait: 0
        }
    },

    // --- HIGH PRIORITY SAFETY/RESET RULES ---
    {
        id: 'flag_pain',
        keywords: ['hurt', 'pain', 'sharp', 'ouch', 'twisted', 'groin', 'knee'],
        moods: ['happy', 'neutral', 'frustrated'],
        priority: 100,
        recommendation: {
            focus: "Injury Prevention",
            reason: "You mentioned pain. Do not train through sharp pain.",
            drill: {
                name: "Rest & Ice / Consult Trainer",
                duration: "N/A",
                type: "physical",
                steps: [
                    "Stop physical activity immediately.",
                    "Apply ice to the affected area for 15-20 minutes.",
                    "Elevate if possible.",
                    "Consult a trainer or doctor before resuming."
                ]
            },
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
            drill: {
                name: "Disconnect & Walk",
                duration: "30 mins",
                type: "mental",
                steps: [
                    "Leave your phone and gear behind.",
                    "Go for a 30-minute walk outside.",
                    "Focus on the sights and sounds of nature, not hockey.",
                    "Breathe deeply and let go of the rink frustration."
                ]
            },
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
            drill: {
                name: "Wall Ball - Low Hops",
                duration: "15 mins",
                type: "physical",
                steps: [
                    "Stand 5-7 feet from a wall.",
                    "Throw ball low so it bounces before hitting the wall.",
                    "Attack the bounce with your stick, driving hands down.",
                    "Keep your chest up and eyes on the ball.",
                    "Repeat for 50 reps."
                ]
            },
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
            drill: {
                name: "Butterfly Slides & Stick Seal",
                duration: "20 mins",
                type: "physical",
                steps: [
                    "Start in stance.",
                    "Drive knee down into butterfly, focusing on sealing the 5-hole instantly.",
                    "Keep stick blade flat on the ice, covering the gap.",
                    "Recover to stance.",
                    "Repeat 10 times, then add a slide."
                ]
            },
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
            drill: {
                name: "Rebound Placement (Box Control)",
                duration: "15 mins",
                type: "physical",
                steps: [
                    "Visualize a box in front of the crease.",
                    "Any shot hitting you must be directed OUTSIDE this box (to corners).",
                    "Throw a ball against a wall and catch it, simulating 'guiding' it to the corner.",
                    "Focus on soft hands to absorb energy."
                ]
            },
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
            drill: {
                name: "Juggling & Wall Ball tracking",
                duration: "10 mins",
                type: "physical",
                steps: [
                    "3-ball juggling for 2 minutes to warm up.",
                    "Throw ball against wall, track it all the way into your hand.",
                    "Vary the speed and angle.",
                    "Focus on watching the ball hit your hand/glove every time."
                ]
            },
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
            drill: {
                name: "Up-Downs / Recoveries",
                duration: "15 mins",
                type: "physical",
                steps: [
                    "Start in butterfly.",
                    "Explode up to stance on right foot.",
                    "Return to butterfly.",
                    "Explode up to stance on left foot.",
                    "Repeat 10 times per side as fast as possible."
                ]
            },
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
            drill: {
                name: "Video Review (Goals Against)",
                duration: "20 mins",
                type: "video",
                steps: [
                    "Watch all goals against from the last game.",
                    "Identify the breakdown: Positioning? Rebound? Screen?",
                    "Write down one correction for next practice.",
                    "Do not beat yourself up, just learn."
                ]
            },
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
            drill: {
                name: "Positive Visualization (Saves)",
                duration: "10 mins",
                type: "mental",
                steps: [
                    "Close your eyes and replay your best saves from the game.",
                    "Notice where you were positioned.",
                    "Feel the confidence of being in the right spot.",
                    "Acknowledge that 'luck' is often just good preparation."
                ]
            },
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
            drill: {
                name: "Box Breathing & Basics",
                duration: "10 mins",
                type: "mental",
                steps: [
                    "Inhale for 4 seconds.",
                    "Hold for 4 seconds.",
                    "Exhale for 4 seconds.",
                    "Hold for 4 seconds.",
                    "Repeat for 5 minutes to lower heart rate."
                ]
            },
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
            drill: {
                name: "Post-to-Post Recoveries",
                duration: "15 mins",
                type: "physical",
                steps: [
                    "Start on one post.",
                    "T-Push to the top of the crease.",
                    "T-Push back to the opposite post.",
                    "Repeat continuously for 45 seconds.",
                    "Rest for 45 seconds. Do 3 sets."
                ]
            },
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
            drill: {
                name: "Wall Ball (Alt Hands)",
                duration: "10 mins",
                type: "physical",
                steps: [
                    "Throw ball against wall with right hand, catch with left.",
                    "Throw with left, catch with right.",
                    "Keep feet moving in small chops.",
                    "Focus on soft hands."
                ]
            },
            videoWait: 10
        }
    }
];
