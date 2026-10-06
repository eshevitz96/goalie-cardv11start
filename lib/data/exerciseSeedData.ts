export interface AgeBandRange {
    sets: string;
    reps: string;
    intensity: string;
    notes: string;
}

export interface ExerciseRanges {
    "under-14": AgeBandRange;
    "14-17": AgeBandRange;
    "18+": AgeBandRange;
}

export interface CanonicalExercise {
    name: string;
    category: 'mobility' | 'strength' | 'power' | 'reaction' | 'sport' | 'recovery';
    sport: 'all' | 'hockey' | 'lacrosse';
    equipment: string[];
    cues: string[];
    ranges: ExerciseRanges;
    is_active: boolean;
    approved_by: string | null;
}

export const CANONICAL_EXERCISE_SEEDS: CanonicalExercise[] = [
    // -------------------------------------------------------------
    // MOBILITY & HIP INTEGRITY
    // -------------------------------------------------------------
    {
        name: "90/90 Hip Transition & Flow",
        category: "mobility",
        sport: "all",
        equipment: ["bodyweight", "mat"],
        cues: [
            "Maintain tall upright spine throughout the transition",
            "Drive front knee and back knee gently into floor",
            "Lead transition with lead hip opening before trail hip follows",
            "Breathe slowly and avoid spinal flexion"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "5-6 each side",
                intensity: "Controlled bodyweight mobility",
                notes: "Focus on smooth rotation and pelvic awareness without forcing range."
            },
            "14-17": {
                sets: "2-3",
                reps: "6-8 each side",
                intensity: "Full active range of motion",
                notes: "Add 2-second hold at end range to expand internal/external rotation."
            },
            "18+": {
                sets: "3",
                reps: "8-10 each side",
                intensity: "Active hip irradiation / end-range control",
                notes: "Optional unassisted hands-free transitions with isometric pauses."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Adductor Rock-Back & Quadruped Reach",
        category: "mobility",
        sport: "all",
        equipment: ["bodyweight", "mat"],
        cues: [
            "Extend one leg straight out to side, foot flat on ground",
            "Sit hips straight back toward opposite heel",
            "Keep core braced and spine neutral without rounding",
            "Feel gentle dynamic stretch through inner groin / adductor"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "8 each side",
                intensity: "Gentle dynamic stretch",
                notes: "Keep movements fluid; do not bounce into deep groin stretch."
            },
            "14-17": {
                sets: "2-3",
                reps: "8-10 each side",
                intensity: "Progressive end-range pulse",
                notes: "Add gentle thoracic rotation toward straight leg on repetition 8."
            },
            "18+": {
                sets: "3",
                reps: "10-12 each side",
                intensity: "Deep adductor lengthening with active contraction",
                notes: "Press straight foot firmly into floor for 3s isometric hold per rep."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Ankle Dorsiflexion Wall Rocks",
        category: "mobility",
        sport: "all",
        equipment: ["bodyweight", "wall"],
        cues: [
            "Place toes 3-5 inches away from wall in half-kneeling or standing stance",
            "Drive knee directly over middle toes toward wall without lifting heel",
            "Keep heel glued flat to floor at all times",
            "Avoid knee collapsing inward"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "8-10 each side",
                intensity: "Controlled dynamic pulse",
                notes: "Crucial for butterfly flare, deep crouch, and low save posture."
            },
            "14-17": {
                sets: "2-3",
                reps: "10-12 each side",
                intensity: "End-range hold (2s per rep)",
                notes: "Gradually step toe further back to challenge true ankle ROM."
            },
            "18+": {
                sets: "3",
                reps: "12-15 each side",
                intensity: "Loaded or band-assisted joint glide",
                notes: "Use resistance band around talus joint to optimize glide if needed."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Thoracic Spine Windmills (Side-Lying)",
        category: "mobility",
        sport: "all",
        equipment: ["bodyweight", "foam_roller"],
        cues: [
            "Lie on side with top knee pinned at 90 degrees on a foam roller",
            "Sweep top arm in large slow arc overhead and across body",
            "Keep pinned knee locked to roller to isolate thoracic spine",
            "Exhale deeply as chest opens toward ceiling"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "6-8 each side",
                intensity: "Gentle sweeping mobility",
                notes: "Develops upper back rotation for tracking pucks/balls across traffic."
            },
            "14-17": {
                sets: "2-3",
                reps: "8 each side",
                intensity: "Full shoulder girdle excursion",
                notes: "Follow hand with eyes to train visual tracking with rotation."
            },
            "18+": {
                sets: "3",
                reps: "8-10 each side",
                intensity: "Deep rotational excursion with full ribcage expansion",
                notes: "Incorporate diaphragmatic breathing at full open posture."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Butterfly Flutters & Active Groin Holds",
        category: "mobility",
        sport: "hockey",
        equipment: ["bodyweight", "mat"],
        cues: [
            "Sit tall with soles of feet together and knees dropped wide",
            "Perform light rhythmic flutters then contract adductors against hands",
            "Push knees actively down toward floor using glute activation",
            "Never bounce aggressively into end range"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "30s flutters + 15s hold",
                intensity: "Light active control",
                notes: "Prepares hips for butterfly save recovery without joint strain."
            },
            "14-17": {
                sets: "3",
                reps: "45s flutters + 20s isometric hold",
                intensity: "Moderate active tension",
                notes: "Focus on active glute medius drive to pull knees to ground."
            },
            "18+": {
                sets: "3",
                reps: "60s flutters + 30s loaded PNF contraction",
                intensity: "High neurological activation",
                notes: "Apply 5s adductor squeeze against resistance followed by 5s active pull."
            }
        },
        is_active: false,
        approved_by: null
    },

    // -------------------------------------------------------------
    // STRENGTH & POSTURAL INTEGRITY
    // -------------------------------------------------------------
    {
        name: "Goblet Squat (Tempo 3-1-1)",
        category: "strength",
        sport: "all",
        equipment: ["dumbbell", "kettlebell"],
        cues: [
            "Hold weight tight against sternum with elbows tucked",
            "Lower hips for 3 controlled seconds maintaining proud chest",
            "Hold bottom position for 1 second in solid crease depth",
            "Drive up through midfoot and heels without forward pitch"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "8-10 reps",
                intensity: "Light dumbbell (5-15 lbs) or bodyweight",
                notes: "Master perfect depth and neutral spine before adding weight."
            },
            "14-17": {
                sets: "3-4",
                reps: "6-8 reps",
                intensity: "Moderate weight (20-40 lbs)",
                notes: "Build eccentric control and quad/glute endurance for long games."
            },
            "18+": {
                sets: "4",
                reps: "5-6 reps",
                intensity: "Working weight (45-75+ lbs)",
                notes: "Deep depth with crisp powerful ascent."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Bulgarian Split Squat (Rear-Foot Elevated)",
        category: "strength",
        sport: "all",
        equipment: ["dumbbell", "bench"],
        cues: [
            "Elevate rear foot on bench or box with front foot planted forward",
            "Lower back knee toward floor while keeping front knee tracking toes",
            "Torso stays tall or with slight athletic forward hinge",
            "Drive through front heel to return to top"
        ],
        ranges: {
            "under-14": {
                sets: "2-3",
                reps: "6-8 each leg",
                intensity: "Bodyweight or light dumbbells (5-10 lbs)",
                notes: "Develops single-leg stability and equalizes left/right leg power."
            },
            "14-17": {
                sets: "3-4",
                reps: "6-8 each leg",
                intensity: "Moderate dumbbells (15-30 lbs)",
                notes: "Focus on knee alignment and zero wobble during descent."
            },
            "18+": {
                sets: "4",
                reps: "5-8 each leg",
                intensity: "Heavy dumbbells (35-60+ lbs)",
                notes: "Essential for explosive post pushes and recovery push strength."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Cossack Squat (Lateral Mobility & Strength)",
        category: "strength",
        sport: "all",
        equipment: ["bodyweight", "dumbbell"],
        cues: [
            "Stand in wide stance, shift weight to one side and squat down",
            "Keep working heel flat on the floor",
            "Opposite leg stays straight with toes pointed up toward ceiling",
            "Push through floor to return to center"
        ],
        ranges: {
            "under-14": {
                sets: "2-3",
                reps: "5-6 each side",
                intensity: "Bodyweight with hand counterbalance",
                notes: "Builds bulletproof groin strength and extreme lateral stance depth."
            },
            "14-17": {
                sets: "3",
                reps: "6-8 each side",
                intensity: "Bodyweight or light dumbbell (10-20 lbs)",
                notes: "Reach full depth without letting working heel rise."
            },
            "18+": {
                sets: "3-4",
                reps: "8 each side",
                intensity: "Loaded dumbbell (25-45 lbs)",
                notes: "Direct transfer to lateral pad slides and cross-crease extension."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Single-Leg Romanian Deadlift (RDL)",
        category: "strength",
        sport: "all",
        equipment: ["dumbbell", "kettlebell"],
        cues: [
            "Stand on one leg with soft knee bend",
            "Hinge at hips, reaching rear leg back in a straight line",
            "Keep hips square to floor without rotating open",
            "Squeeze glute and drive hips forward to stand"
        ],
        ranges: {
            "under-14": {
                sets: "2-3",
                reps: "6-8 each leg",
                intensity: "Bodyweight or light dumbbell (5-10 lbs)",
                notes: "Develops hamstring resilience, posterior chain power, and balance."
            },
            "14-17": {
                sets: "3",
                reps: "6-8 each leg",
                intensity: "Moderate dumbbell (15-30 lbs)",
                notes: "Keep back flat and focus on hamstring loading."
            },
            "18+": {
                sets: "3-4",
                reps: "6-8 each leg",
                intensity: "Heavy dumbbell or barbell (35-65+ lbs)",
                notes: "Protects against groin/hamstring strains during awkward saves."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Plank with Alternating Shoulder Taps & Reach",
        category: "strength",
        sport: "all",
        equipment: ["bodyweight", "mat"],
        cues: [
            "Set high push-up position with feet slightly wider than hips",
            "Brace core tight and tap opposite shoulder with zero hip sway",
            "Extend arm forward for 1-second freeze before lowering",
            "Keep spine perfectly level like a tabletop"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "10-12 taps total",
                intensity: "Bodyweight core stability",
                notes: "Teaches anti-rotational core lock needed when taking shot impacts."
            },
            "14-17": {
                sets: "3",
                reps: "16-20 taps total",
                intensity: "Bodyweight with 2s hold",
                notes: "Zero pelvic movement allowed throughout entire set."
            },
            "18+": {
                sets: "3-4",
                reps: "20-24 taps total",
                intensity: "Bodyweight + weight plate on back (optional)",
                notes: "Maximizes glove/blocker stability during off-balance saves."
            }
        },
        is_active: false,
        approved_by: null
    },

    // -------------------------------------------------------------
    // POWER & EXPLOSIVE LATERAL DRIVE
    // -------------------------------------------------------------
    {
        name: "Heiden Lateral Skater Bounds (Stick Hold)",
        category: "power",
        sport: "all",
        equipment: ["bodyweight", "hockey_stick", "lacrosse_shaft"],
        cues: [
            "Start on outside leg in athletic stance holding stick in save posture",
            "Explode laterally off plant leg across floor",
            "Land softly on opposite leg, absorbing into hip and knee for 2s freeze",
            "Maintain chest up and hands quiet in front"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "5 each side",
                intensity: "Controlled distance with 2s stick landing",
                notes: "Emphasize quiet, soft landing mechanics over jump distance."
            },
            "14-17": {
                sets: "3-4",
                reps: "5-6 each side",
                intensity: "Maximal lateral power with instantaneous stick",
                notes: "Transfer power cleanly without allowing knee valgus."
            },
            "18+": {
                sets: "4",
                reps: "6 each side",
                intensity: "Max distance / explosive rate of force development",
                notes: "Add reactive bounce-back on final 2 reps."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Rotational Medicine Ball Scoop Toss",
        category: "power",
        sport: "all",
        equipment: ["medicine_ball", "wall"],
        cues: [
            "Stand perpendicular to solid wall in athletic goalie stance",
            "Load weight into back hip, swinging ball down and back",
            "Explosively rotate hips and drive through front foot to throw into wall",
            "Catch on rebound and reset posture"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "6-8 each side",
                intensity: "Light med ball (4-6 lbs)",
                notes: "Teaches kinetic chain rotation from hips through core."
            },
            "14-17": {
                sets: "3-4",
                reps: "6-8 each side",
                intensity: "Moderate med ball (8-10 lbs)",
                notes: "Focus on violent hip snap and solid deceleration."
            },
            "18+": {
                sets: "4",
                reps: "6-8 each side",
                intensity: "Heavy med ball (12-16 lbs)",
                notes: "Max explosive rotary power for clearing pucks and cross-crease saves."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Lateral Snap-Downs & Drop-Step Drive",
        category: "power",
        sport: "all",
        equipment: ["bodyweight"],
        cues: [
            "Stand tall on toes with arms overhead",
            "Violently snap down into low goalie ready stance",
            "Immediately push laterally 3 feet and freeze in butterfly/save stance",
            "Absorb force silently with stiff core"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "5 each direction",
                intensity: "Rapid snap into athletic balance",
                notes: "Trains fast deceleration and reaction to the whistle."
            },
            "14-17": {
                sets: "3-4",
                reps: "6 each direction",
                intensity: "High speed snap & lateral drive",
                notes: "Zero hesitation between snap-down and lateral push."
            },
            "18+": {
                sets: "4",
                reps: "6 each direction",
                intensity: "Max speed eccentric brake and concentric explosion",
                notes: "Direct transfer to game-situation screen shot recoveries."
            }
        },
        is_active: false,
        approved_by: null
    },

    // -------------------------------------------------------------
    // REACTION & VISUAL TRACKING
    // -------------------------------------------------------------
    {
        name: "Wall Ball Alternating Hand Catch (Midline Cross)",
        category: "reaction",
        sport: "all",
        equipment: ["tennis_ball", "wall"],
        cues: [
            "Stand 6-8 feet from wall in goalie stance",
            "Throw ball with right hand across body, catch with left hand at eye level",
            "Follow ball seam with eyes all the way into palm",
            "Keep torso square to wall without turning body away"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "15 catches each hand",
                intensity: "Moderate continuous pace",
                notes: "Builds peripheral tracking and crossing the visual midline."
            },
            "14-17": {
                sets: "3",
                reps: "20 catches each hand",
                intensity: "High speed / close distance (4-5 feet)",
                notes: "Challenge visual reaction speed with faster throws."
            },
            "18+": {
                sets: "3-4",
                reps: "25 catches each hand",
                intensity: "Max speed with randomized low/high bounces",
                notes: "Integrate visual distraction or stroboscopic eyewear if available."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Reaction Ball Floor Drops & Glove Snatch",
        category: "reaction",
        sport: "all",
        equipment: ["reaction_ball"],
        cues: [
            "Hold 6-sided reaction ball at chest height in stance",
            "Drop ball straight down, let it take unpredictable bounce",
            "Snatch ball out of air below waist level with designated hand",
            "Stay low on balls of feet throughout drill"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "10 drops each hand",
                intensity: "Chest-height drop",
                notes: "Develops rapid visual recalculation and clean hand speed."
            },
            "14-17": {
                sets: "3",
                reps: "12-15 drops each hand",
                intensity: "Waist-height drop (faster bounce window)",
                notes: "Must catch on 1st bounce before ball reaches apex."
            },
            "18+": {
                sets: "4",
                reps: "15 drops each hand",
                intensity: "Knee-height drop or partner toss",
                notes: "Catch strictly in pocket position without bobbles."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "3-Ball Juggling into Wall Ball Transition",
        category: "reaction",
        sport: "all",
        equipment: ["tennis_ball"],
        cues: [
            "Juggle 3 balls in standard cascade pattern for 30 seconds",
            "Immediately transition directly to rapid single-ball wall bounces",
            "Maintain soft, relaxed hands and wide visual field",
            "Breathe smoothly and maintain ready stance posture"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "30s juggling + 30s wall ball",
                intensity: "2-ball or 3-ball rhythm",
                notes: "Expands peripheral awareness and hand coordination."
            },
            "14-17": {
                sets: "3",
                reps: "45s juggling + 45s wall ball",
                intensity: "3-ball cascade with high/low speed variation",
                notes: "Zero drops target across all sets."
            },
            "18+": {
                sets: "3-4",
                reps: "60s juggling + 60s wall ball",
                intensity: "Underneath-leg catches or reverse cascade",
                notes: "Pre-game neurological activation prime."
            }
        },
        is_active: false,
        approved_by: null
    },

    // -------------------------------------------------------------
    // SPORT-SPECIFIC MECHANICS (ICE HOCKEY & LACROSSE)
    // -------------------------------------------------------------
    {
        name: "Butterfly Slide & Stick-Seal Mechanics",
        category: "sport",
        sport: "hockey",
        equipment: ["pads", "stick", "slide_board"],
        cues: [
            "Initiate slide with head and eyes rotating to target first",
            "Drive hard through loaded skate edge into wide butterfly flare",
            "Keep stick blade 4-6 inches in front of five-hole, perfectly flush",
            "Hands remain projected forward in front of body line"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "6 slides each side",
                intensity: "Technical precision emphasis",
                notes: "Focus on clean rotation and maintaining upper body posture."
            },
            "14-17": {
                sets: "4",
                reps: "6-8 slides each side",
                intensity: "Crisp game-speed push and recovery",
                notes: "Emphasize immediate visual lock and tight rebound readiness."
            },
            "18+": {
                sets: "4-5",
                reps: "8 slides each side",
                intensity: "Full velocity slide + immediate bumper seal",
                notes: "Incorporate backside push recoveries off second rebound."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "RVH Post Lock & Transition Recovery",
        category: "sport",
        sport: "hockey",
        equipment: ["pads", "stick", "goal_post"],
        cues: [
            "Drive post skate into base of post with vertical shin sealed",
            "Keep head tucked against post shoulder with active blocker/glove seal",
            "Stick blade covers short side five-hole gap along ice",
            "Explode off post into square stance as puck travels out of danger"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "5 locks each post",
                intensity: "Positional seal verification",
                notes: "Check that no gap exists between body, pad, and post."
            },
            "14-17": {
                sets: "4",
                reps: "6 locks each post",
                intensity: "Fast transition in and out of RVH",
                notes: "Time transition from standing stance to complete lock."
            },
            "18+": {
                sets: "4",
                reps: "8 locks each post",
                intensity: "High tempo post play + wraparound defense",
                notes: "Integrate bumper push to far post off low-angle feed."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Crease Arc Shuffles & Angle Alignment",
        category: "sport",
        sport: "all",
        equipment: ["crease", "stick"],
        cues: [
            "Navigate top of crease along arc using short, crisp shuffles",
            "Keep skates parallel and shoulder-width apart without clicking heels",
            "Head stays level like on a track without bobbing up and down",
            "Square chest and belly button directly to shooter"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "3 laps across arc",
                intensity: "Precise angle control",
                notes: "Match footwork tempo to shooter speed."
            },
            "14-17": {
                sets: "3-4",
                reps: "4 laps across arc",
                intensity: "Sharp directional changes",
                notes: "Stop square on outside post, middle, and opposite post."
            },
            "18+": {
                sets: "4",
                reps: "5 laps across arc",
                intensity: "Game-speed rapid adjustment with visual callouts",
                notes: "Incorporate reactive depth adjustments on command."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Lacrosse Step & Clamp (Off-Hip Save Mechanics)",
        category: "sport",
        sport: "lacrosse",
        equipment: ["lacrosse_stick", "goal"],
        cues: [
            "Lead save movement with top hand and eyes locked on release",
            "Step 45 degrees toward shot path with lead foot",
            "Drive body weight behind stick head to form wall",
            "Clamp stick over ball upon save to prevent rebound"
        ],
        ranges: {
            "under-14": {
                sets: "3",
                reps: "8 reps each quadrant (high/low)",
                intensity: "Form & stepping technique",
                notes: "Reinforce moving toward the ball rather than ducking."
            },
            "14-17": {
                sets: "3-4",
                reps: "10 reps each quadrant",
                intensity: "Full speed stick explosion",
                notes: "Develop explosive first step and strong top-hand extension."
            },
            "18+": {
                sets: "4",
                reps: "12 reps each quadrant",
                intensity: "High velocity live feeds / ball machine",
                notes: "Immediate outlet pass setup within 1.5 seconds of save."
            }
        },
        is_active: false,
        approved_by: null
    },

    // -------------------------------------------------------------
    // RECOVERY & TISSUE QUALITY
    // -------------------------------------------------------------
    {
        name: "Foam Roll Adductors, IT Bands & Quads",
        category: "recovery",
        sport: "all",
        equipment: ["foam_roller", "mat"],
        cues: [
            "Lie face down with roller perpendicular to inner thigh",
            "Roll slowly from just above knee to groin junction",
            "Pause on tender trigger spots for 20-30s while breathing deeply",
            "Never roll directly over knee joint"
        ],
        ranges: {
            "under-14": {
                sets: "1-2",
                reps: "45-60s each muscle group",
                intensity: "Gentle tissue release",
                notes: "Essential post-practice habit to prevent groin tightness."
            },
            "14-17": {
                sets: "2",
                reps: "60-90s each muscle group",
                intensity: "Deep slow rolling with active knee flexion",
                notes: "Perform after heavy ice or game sessions."
            },
            "18+": {
                sets: "2",
                reps: "90-120s each muscle group",
                intensity: "Targeted myofascial release with pin-and-stretch",
                notes: "Combine with targeted vibration or lacrosse ball on glute rotators."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Hip Flexor Couch Stretch & Glute Activation",
        category: "recovery",
        sport: "all",
        equipment: ["wall", "mat", "box"],
        cues: [
            "Place back knee tight against wall or box with shin vertical",
            "Step opposite foot forward into half-kneeling position",
            "Squeeze glute on trailing leg and tuck pelvis underneath (posterior tilt)",
            "Hold tall posture without overarching lower back"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "30-45s each side",
                intensity: "Gentle restorative stretch",
                notes: "Releases tight psoas muscles from deep crouch postures."
            },
            "14-17": {
                sets: "2-3",
                reps: "45-60s each side",
                intensity: "Deep anterior hip lengthening",
                notes: "Add overhead reach with trailing arm for lat/hip connection."
            },
            "18+": {
                sets: "3",
                reps: "60-90s each side",
                intensity: "Deep contract-relax (5s glute squeeze / 10s relax)",
                notes: "Restores full hip extension after long game days."
            }
        },
        is_active: false,
        approved_by: null
    },
    {
        name: "Pigeon Pose / Glute & Piriformis Decompression",
        category: "recovery",
        sport: "all",
        equipment: ["mat"],
        cues: [
            "Bring front knee toward same-side wrist, shin angled across mat",
            "Slide rear leg straight back, hips square to floor",
            "Lower torso onto forearms while maintaining level hips",
            "Inhale through nose for 4s, exhale slowly for 6s"
        ],
        ranges: {
            "under-14": {
                sets: "2",
                reps: "30-45s each side",
                intensity: "Relaxed restorative hold",
                notes: "Decompresses deep hip rotators worked during butterfly flairs."
            },
            "14-17": {
                sets: "2-3",
                reps: "45-60s each side",
                intensity: "Deep hip capsule stretch",
                notes: "Use yoga block or pillow under front hip if pelvis tilts."
            },
            "18+": {
                sets: "3",
                reps: "60-90s each side",
                intensity: "Full restorative release",
                notes: "Down-regulates nervous system post-game."
            }
        },
        is_active: false,
        approved_by: null
    }
];
