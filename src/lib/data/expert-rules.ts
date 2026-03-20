import { ExpertRule } from "@/lib/expert-engine";

/**
 * Coach OS: Expert Rules Library
 * Comprehensive directional logic for brief, data-driven goalie insights.
 * Goal: ~500-1000 lines of modular, intelligent scenarios.
 */
export const EXPERT_RULES: ExpertRule[] = [
    // --- 1. SAFETY & CRITICAL MENTAL RESETS (Priority 100+) ---
    {
        id: 'safety_injury',
        keywords: ['hurt', 'pain', 'sharp', 'tweak', 'injury', 'pulled', 'knee', 'groin', 'concussion', 'head'],
        moods: ['happy', 'neutral', 'frustrated'],
        priority: 150,
        recommendation: {
            focus: "Immediate Safety",
            reason: "We detected words related to physical pain. Stop training and consult your medical staff immediately.",
            videoWait: 0
        }
    },
    {
        id: 'mental_burnout',
        keywords: ['hate', 'done', 'quit', 'nightmare', 'sick of it', 'burnout'],
        moods: ['frustrated'],
        priority: 140,
        recommendation: {
            focus: "Total Reset",
            reason: "Your reflection suggests severe burnout. The best move is to step away from the sport for 48 hours for a mental refresh.",
            videoWait: 0
        }
    },

    // --- 2. HOCKEY: SPECIFIC TACTICAL DIRECTION ---
    {
        id: 'hky_low_fivehole',
        keywords: ['five hole', 'between legs', 'pads', 'leaked'],
        moods: ['neutral', 'frustrated'],
        sports: ['hockey'],
        priority: 85,
        recommendation: {
            focus: "Stick Discipline",
            reasons: [
                "Pucks leaking through the middle suggest a lazy stick. Lock your blade to the ice in the butterfly.",
                "Tighten the 5-hole. Ensure your stick is positioned far enough in front to create a secondary seal.",
                "Holes appearing down low. Check your recovery logic—don't open up while you track back to your posts.",
                "Blade discipline. Keep your top hand active to push the stick into the shooter's low release window.",
                "Stick lead. Lead with the blade when shifting laterally to close that gap before you slide.",
                "Stop the leak. Focus on stick stance and ensure your hands aren't pulling back on impact."
            ],
            videoWait: 5
        }
    },
    {
        id: 'hky_rebound_control',
        keywords: ['rebound', 'second chance', 'kick out', 'chaos'],
        moods: ['neutral', 'frustrated'],
        sports: ['hockey'],
        priority: 80,
        recommendation: {
            focus: "Puck Placement",
            reasons: [
                "Redirect rebounds to the corners! Focus on using your stick to steer pucks out of 'The House'.",
                "Rebound chaos detected. Work on 'killing' the puck into your chest for the whistle when possible.",
                "Active pads. Angle your shins toward the board to clear second-chance opportunities from the slot.",
                "Rebound awareness. Your recovery should be toward the rebound, not back to the middle of the net.",
                "Deflecting the danger. Use your stick like a steering wheel—turn it to guide low shots away from the crease.",
                "Win the second shot. If you can't cover it, kick it to where your defense is waiting."
            ],
            videoWait: 8
        }
    },
    {
        id: 'hky_track_release',
        keywords: ['screen', 'didn\'t see', 'traffic', 'blind'],
        moods: ['neutral', 'frustrated'],
        sports: ['hockey'],
        priority: 75,
        recommendation: {
            focus: "Sightline Management",
            reason: "Work on 'looking around' screens rather than through them. Find the shooter's release point early.",
            videoWait: 10
        }
    },

    // --- 3. LACROSSE BOYS: FIELD ACCURACY DIRECTION ---
    {
        id: 'lax_b_bounce_shots',
        keywords: ['bounce', 'low shot', 'turf', 'grass'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-boys'],
        priority: 85,
        recommendation: {
            focus: "Low Save Path",
            reasons: [
                "Bounce shots are beating you. Drive your top hand directly to the ball's expected bounce point.",
                "Turf bounces are unpredictable. Focus on getting your chest over the ball while you step.",
                "The grass is slow today—don't wait for it. Explode to the bounce and swallow the ball.",
                "Stick path is key. See the ball hit the deck and beat it there with your bottom hand lead.",
                "You're standing up on low shots. Drop your level and keep your stick out front of your feet.",
                "Focus on the 'bounce window'. Attack the ball at its apex before it gains speed off the turf."
            ],
            videoWait: 0
        }
    },
    {
        id: 'lax_b_clearing',
        keywords: ['clear', 'intercepted', 'pass', 'transition'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-boys'],
        priority: 80,
        recommendation: {
            focus: "Outlet Vision",
            reasons: [
                "Clears were shaky. Scan the field for 'the long look' first, then settle for the safe d-pole outlet.",
                "The 10-man ride is coming. Keep your feet moving and look for the 'over-the-top' clear to the midline.",
                "Don't force the middie pass. Trust your legs—run it out if the alley is open.",
                "Outlet accuracy today. Focus on the 'box'—put the ball in your teammate's pocket so they can run through it.",
                "Be the general. If the first look isn't there, yell for the 'Reset' and use your defense to shift the ride.",
                "Watch their attackmen—they aren't tracking your eyes. Deceive with your vision before sticking the pass."
            ],
            videoWait: 0
        }
    },
    {
        id: 'lax_b_crease_attack',
        keywords: ['crease', 'dive', 'close shot', 'on the doorstep'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-boys'],
        priority: 75,
        recommendation: {
            focus: "Inside Position",
            reasons: [
                "Attackers are winning at the crease. Hold your pipe longer and force them to make the first move.",
                "The dive is coming—don't bite. Stay on your feet and follow the stick, not the body.",
                "Protect 'the house'. On crease rolls, keep your stick tucked and lead with your head to the ball.",
                "Communication is your shield. Call when the ball is at 'X' so your defense can collapse on the crease.",
                "Doorstep saves are about reflex and size. Stay big in the net and cut the angle on the shooter's hands.",
                "Shooters are finishing close. Take away the easy far-side look and force them into a low-percentage bouncer."
            ],
            videoWait: 5
        }
    },
    {
        id: 'lax_b_comms',
        keywords: ['talk', 'communication', 'slide', 'defense'],
        moods: ['neutral', 'happy'],
        sports: ['lacrosse-boys'],
        priority: 60,
        recommendation: {
            focus: "Director Protocol",
            reason: "Your defense needs a louder voice. Call the ball location and dictate the slide package early.",
            videoWait: 0
        }
    },
    {
        id: 'lax_b_stepping',
        keywords: ['stepping', 'aggressive', 'angle'],
        moods: ['happy', 'neutral'],
        sports: ['lacrosse-boys'],
        priority: 70,
        recommendation: {
            focus: "Arc Mastery",
            reason: "You are playing with confidence. Use that to step aggressively to the shooters at the top of the box.",
            videoWait: 0
        }
    },
    {
        id: 'lax_b_frustrated_save',
        keywords: ['missed', 'goal', 'bad'],
        moods: ['frustrated'],
        sports: ['lacrosse-boys'],
        priority: 70,
        recommendation: {
            focus: "Short Memory",
            reason: "You're dwelling on the last goal. In lacrosse, goals happen. Reset your arc and win the next possession.",
            videoWait: 0
        }
    },

    // --- 4. LACROSSE GIRLS: ARCS & FAN TACTICS ---
    {
        id: 'lax_g_8m_arc',
        keywords: ['8m', 'arc', 'free position', 'penalty shot'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-girls'],
        priority: 90,
        recommendation: {
            focus: "8m Discipline",
            reason: "You are conceding on 8m starts. Hold your position in the center and react to the release, don't guess.",
            videoWait: 0
        }
    },
    {
        id: 'lax_g_12m_fan',
        keywords: ['12m', 'fan', 'top of the fan', 'outside shot'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-girls'],
        priority: 85,
        recommendation: {
            focus: "Depth Control",
            reason: "Shots from the 12m fan are finding corners. Play slightly more aggressive depth to cut the angle.",
            videoWait: 0
        }
    },
    {
        id: 'lax_g_tracking',
        keywords: ['lost it', 'didn\'t see', 'fast track'],
        moods: ['neutral', 'frustrated'],
        sports: ['lacrosse-girls'],
        priority: 70,
        recommendation: {
            focus: "Head Tracking",
            reason: "In high-speed girls' lacrosse, eyes must lead the stick. Pin the ball into the pocket with your vision.",
            videoWait: 5
        }
    },

    // --- 5. SOCCER: BOX & ANGLE COMMAND ---
    {
        id: 'soc_angle_play',
        keywords: ['top corner', 'far post', 'angle', 'positioning'],
        moods: ['neutral', 'frustrated'],
        sports: ['soccer'],
        priority: 85,
        recommendation: {
            focus: "Arc Awareness",
            reason: "You are getting beat on the long ball. Use the 6-yard box line as a reference to ensure you're squared up.",
            videoWait: 0
        }
    },
    {
        id: 'soc_diving',
        keywords: ['dive', 'stretch', 'finger tips', 'missed it'],
        moods: ['neutral', 'frustrated'],
        sports: ['soccer'],
        priority: 80,
        recommendation: {
            focus: "Lateral Explosion",
            reason: "Work on that first step. Drive off your near-side foot to gain maximum extension across the goal.",
            videoWait: 5
        }
    },

    // --- 6. STATS-BASED INSIGHTS (Triggered by Keywords from Stats Summary) ---
    {
        id: 'stats_low_sv',
        keywords: ['low save percentage', 'conceding too many', 'sub 0.8'],
        moods: ['neutral', 'frustrated'],
        priority: 95,
        recommendation: {
            focus: "Save Consistency",
            reason: "Your save % is down. Let's return to tracking fundamentals. Focus on seeing every release clearly.",
            videoWait: 0
        }
    },
    {
        id: 'stats_high_gaa',
        keywords: ['too many goals', 'gaa high', 'losing games'],
        moods: ['frustrated'],
        priority: 94,
        recommendation: {
            focus: "Defensive Command",
            reason: "High scorelines suggest a defensive breakdown. Be louder with your defensive callouts today.",
            videoWait: 0
        }
    },

    // --- 7. EMOTIONAL & SENTIMENT SYNERGY ---
    {
        id: 'sent_lucky',
        keywords: ['lucky', 'posts', 'miracle', 'didn\'t earn'],
        moods: ['happy', 'neutral'],
        priority: 60,
        recommendation: {
            focus: "Positioning Validation",
            reason: "You feel lucky, but good positioning creates 'luck'. Trust that you was in the right spot at the right time.",
            videoWait: 0
        }
    },
    {
        id: 'sent_confident',
        keywords: ['confident', 'on fire', 'beast', 'wall', 'brick wall'],
        moods: ['happy'],
        priority: 65,
        recommendation: {
            focus: "Confidence Maintenance",
            reason: "You are in the zone. Keep this momentum and focus on maintaining your high-velocity recovery speed.",
            videoWait: 5
        }
    },
    {
        id: 'sent_tired',
        keywords: ['tired', 'slow', 'heavy legs', 'sluggish', 'fatigue'],
        moods: ['neutral', 'frustrated'],
        priority: 110,
        recommendation: {
            focus: "Active Recovery",
            reason: "Fatigue detected. Focus on shorter, high-intensity intervals today rather than high-volume repetitive work.",
            videoWait: 0
        }
    },

    // --- 8. RECOVERY & PREPARATION ---
    {
        id: 'prep_gameday',
        keywords: ['tomorrow', 'big game', 'tonight', 'scouting'],
        moods: ['happy', 'neutral'],
        priority: 120,
        recommendation: {
            focus: "Game Preparation",
            reason: "Big game coming up. Focus on visualization and active mobility. Settle the nerves and trust your training.",
            videoWait: 0
        }
    },
    {
        id: 'prep_scouting',
        keywords: ['shooter', 'scout', 'tendency', 'lefty', 'righty'],
        moods: ['neutral'],
        priority: 70,
        recommendation: {
            focus: "Tactical Scout",
            reason: "Analyzing shooters is key. Focus on stick-side tendencies for the top 3 attackers you'll face.",
            videoWait: 15
        }
    },

    // --- 9. CATEGORICAL FALLBACKS (Mood-only) ---
    // LACROSSE FALLBACKS
    {
        id: 'fallback_happy_lax',
        keywords: [],
        moods: ['happy'],
        sports: ['lacrosse-boys', 'lacrosse-girls'],
        priority: 7,
        recommendation: {
            focus: "High-Flow State",
            reasons: [
                "Maintain this positive energy. Focus on aggressive depth and challenging shooters early.",
                "You're in the zone. Use this confidence to experiment with slightly more aggressive positioning.",
                "Elite energy detected. Keep the foot on the gas and dictate the pace of the shooters.",
                "The wall is up. Focus on maintaining your high-velocity recovery after Every. Single. Save.",
                "Pure focus today. See how early you can pick up the rotation on the ball and drive your top hand.",
                "Keep the smile, keep the saves. Your joy is your competitive advantage—exploit it today.",
                "Locked in. Today is about perfecting the details. Minimize your movement and be 'big' in the net.",
                "Great vibes only. Challenge yourself to a zero-rebound session. Clamp everything in the pocket."
            ],
            warmup: { name: "Hand-Eye Speed", duration: "5 mins", type: "physical", steps: ["Wall ball (one hand)", "Ball juggle", "High-frequency taps"] },
            drill: { name: "Arc Expansion", duration: "10 mins", type: "physical", steps: ["Step to high corners", "Bouncer recovery", "Crease roll defense"] },
            mental: { name: "Flow Affirmation", duration: "3 mins", type: "mental", steps: ["Breathe in joy", "Visualize the perfect save", "Maintain the smile"] },
            videoWait: 0
        }
    },
    // HOCKEY FALLBACKS
    {
        id: 'fallback_happy_hky',
        keywords: [],
        moods: ['happy'],
        sports: ['hockey'],
        priority: 7,
        recommendation: {
            focus: "Elite Presence",
            reasons: [
                "You are tracking the puck with extreme precision today. Stay in this high-flow state.",
                "The eyes are leading the hands. Maintain this aggressive depth and challenge the release early.",
                "Elite energy in the crease. Keep your chest up and swallow the second-chance opportunities.",
                "Wall mode activated. Focus on your post-integration and crisp rotation on lateral plays.",
                "Puck tracking is effortless right now. See if you can pick up the logo on the puck earlier.",
                "Locked in. Today is about technical excellence. Keep your hands quiet and your feet explosive."
            ],
            warmup: { name: "Visual Tracking", duration: "5 mins", type: "physical", steps: ["Ball tracking on wall", "Peripheral scanning", "Bateson dots"] },
            drill: { name: "Crease Dominance", duration: "10 mins", type: "physical", steps: ["T-Push to top", "Butterfly slide", "Post-to-post rotation"] },
            mental: { name: "Elite Reset", duration: "3 mins", type: "mental", steps: ["Box breathing", "Quiet eyes", "Reset the bar"] },
            videoWait: 0
        }
    },
    // UNIVERSAL FRUSTRATED RESET
    {
        id: 'fallback_frustrated',
        keywords: [],
        moods: ['frustrated'],
        priority: 5,
        recommendation: {
            focus: "Mental Reset",
            reasons: [
                "You seem frustrated. Simplify your movements and focus on making the easy saves first to build rhythm.",
                "Flush the last session. Today is about finding your eyes again. Deep breaths, simple tracking.",
                "Let's quiet the noise. Forget the score and focus entirely on the feel of the save.",
                "Frustration is just energy without a target. Direct it into your next save path. One at a time.",
                "Don't overthink the misses. Return to your base stance and trust the reps you've already done.",
                "Clean the slate. You're playing tight—loosen the grip on your handle and let reflexes take over.",
                "Resetting now. Small wins only: clear your crease, find the post, and track the first release."
            ],
            videoWait: 0
        }
    },
    // UNIVERSAL NEUTRAL FOUNDATION
    {
        id: 'fallback_neutral',
        keywords: [],
        moods: ['neutral'],
        priority: 1,
        recommendation: {
            focus: "Core Fundamentals",
            reasons: [
                "Consistency is key today. Solidify your stance and focus on clean tracking through mid-level shots.",
                "The daily grind builds the wall. Focus on perfect weight distribution in your ready position.",
                "No highs, no lows—just work. Execute your standard warmup with 100% intentionality.",
                "Steady hands, steady mind. Work on being technically perfect on the routine saves.",
                "Foundation first. Review your arc depth and ensure you aren't leaking too deep into the crease.",
                "The standard is the standard. Even on a neutral day, your tracking must be elite."
            ],
            videoWait: 0
        }
    }
];

// NOTE: To reach 500-1000 lines of logic, this library will be extended 
// with granular sub-scenarios for every sport and data intersection possible.
// Future: Integrate dynamic LLM-generated rules based on seasonal trends.
