export interface AthleteTrainingEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  type: 'on_ice' | 'off_ice' | 'recovery' | 'game' | 'travel' | 'baseline' | 'film';
  confidence: 'EXACT' | 'RECONSTRUCTED';
  phase: string;
  location?: string;
  warmup?: string;
  strength?: string[];
  athletic?: string[];
  balance?: string[];
  core?: string[];
  conditioning?: string;
  recovery?: string[];
  notes?: string;
  athleteReflection?: string;
  coachNotes?: string;
  cues?: string[];
  sport: 'Ice Hockey';
}

export const ATHLETE_PROFILE_METRICS = {
  name: "Elliott Shevitz",
  sport: "Ice Hockey",
  position: "Goaltender",
  age: 29,
  trainingObjective: "Return to competitive hockey / determine highest attainable level",
  program: "Goalie Card / Coach Alpha",
  startDate: "2026-06-22",
  historyThrough: "2026-09-11",
  targetTeam: "Atlanta Gladiators / highest attainable level",
  baselines: {
    fiveKPace: "7:36",
    benchPress: "225 lb (5 x 5)",
    squatMax: "375 lb",
    smithFrontSquatCapacity: "55 lb/side x 5 (established)",
    rdlWorkingWeight: "70 lb",
    bulgarianSplitSquat: "30–35 lb DBs",
    singleLegRdl: "35 lb",
    inclineDbPress: "60–65 lb",
    singleArmRow: "65–70 lb",
    dbShoulderPress: "40 lb",
    pullUps: "4 x 6",
    farmerSuitcaseCarry: "75 lb"
  },
  currentWeeklyModel: {
    wednesday: "Ice / Development",
    friday: "Ice / Play & Performance",
    earlyWeek: "1 Meaningful Strength Session (when recovery permits)",
    maintenance: "1 Short Upper/Maintenance Session",
    recovery: "Dynamic Mobility, Yoga, & Goalie Hip Protocols"
  },
  currentCues: [
    "Sit into edges.",
    "Get low.",
    "Load the leg.",
    "Push the floor/ice away.",
    "Stick the landing.",
    "Arrive set.",
    "Angles → depth → arrive set → read → save."
  ]
};

export const ATHLETE_TRAINING_HISTORY: AthleteTrainingEntry[] = [
  {
    id: "ath-2026-06-22-baseline",
    date: "2026-06-22",
    time: "07:00:00",
    title: "Baseline Contract Start & Athletic Evaluation",
    type: "baseline",
    confidence: "EXACT",
    phase: "Baseline / Contract",
    location: "Planet Fitness",
    notes: "Baseline established: 5K pace 7:36, Bench 225 lb (5x5), Squat max 375 lb. 11 years since competitive hockey. Objective: Return to competitive hockey.",
    coachNotes: "Hockey is the contract. Gym supports hockey. Performance system over everything.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-06-22-d1",
    date: "2026-06-22",
    time: "08:30:00",
    title: "Day 1: Lower Strength + Athletic Intro",
    type: "off_ice",
    confidence: "EXACT",
    phase: "Early Phase — General Athlete Rebuild",
    location: "Planet Fitness",
    warmup: "Bike: 10 min / 2.5 mi + 12 min / 2.9 mi with sprints",
    strength: ["Goblet squat: 75 lb", "RDL: 60 lb", "Bulgarian split squat: 30 lb"],
    athletic: ["Box jumps (quality ~50%)", "Skater jumps (felt off-balance)"],
    core: ["Russian twists substituted for planks"],
    notes: "Box jump quality ~50%. Skater jumps felt off-balance. Joints/back felt good. Initial athletic movement quality clearly below strength capacity.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-06-23-d2",
    date: "2026-06-23",
    time: "09:00:00",
    title: "Day 2: Upper Strength + Balance Progression",
    type: "off_ice",
    confidence: "RECONSTRUCTED",
    phase: "Early Phase — General Athlete Rebuild",
    location: "Planet Fitness",
    warmup: "Bike: 10 min / 2.5 mi, Deep squat hold 1 min, Arm circles",
    balance: ["Eyes closed single-leg: ~10 sec each leg (Left > Right)", "Eyes open: 30 sec each leg"],
    strength: [
      "Pull-ups: 4 x 6",
      "Incline DB press: 50 → 55 → 55 → 60 lb",
      "DB row: 60 lb",
      "Shoulder press: 40 lb",
      "Farmer carry: 75 lb (~15 sec each dir)",
      "Plank: ~45 sec"
    ],
    athletic: ["Hard landings on backward jumps", "Skater bounds overshot landing by 3–6 in (~80% balanced)"],
    conditioning: "Bike: 8 min / 2 mi",
    notes: "Legs felt previous training. Added groin stretching. Shoulder press was hardest upper-body movement.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-06-24-d3",
    date: "2026-06-24",
    time: "14:00:00",
    title: "Day 3: Low-Intensity Recovery & Step Volume",
    type: "recovery",
    confidence: "RECONSTRUCTED",
    phase: "Early Phase — General Athlete Rebuild",
    location: "Home / Outdoors",
    recovery: ["Normatec legs: 1 hr", "Mowed lawn ~2 hr (~11,000 steps)"],
    notes: "Deliberate active recovery day.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-06-25-d4",
    date: "2026-06-25",
    time: "09:00:00",
    title: "Day 4: Lower Strength & Lateral Movement",
    type: "off_ice",
    confidence: "RECONSTRUCTED",
    phase: "Early Phase — General Athlete Rebuild",
    location: "Planet Fitness",
    strength: ["RDL: 60 lb", "Bulgarian split squats completed"],
    athletic: ["Skater jumps (box jumps skipped for USA World Cup)"],
    core: ["Russian twists", "Side plank"],
    conditioning: "4 rounds conditioning",
    notes: "Continued early lateral and balance development.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-06-26-d5",
    date: "2026-06-26",
    time: "08:00:00",
    title: "Day 5: Upper Strength + Coaching Workload",
    type: "off_ice",
    confidence: "RECONSTRUCTED",
    phase: "Early Phase — General Athlete Rebuild",
    location: "Planet Fitness / Turf",
    warmup: "Head cold & low sleep management",
    balance: ["Eyes closed single-leg: 15 sec each leg (improved from 10s)", "Eyes open: 30 sec each leg"],
    strength: ["Repeated Day 2 upper body structure with slightly higher weights"],
    notes: "Sport workload: 2 lacrosse goalie lessons AM + 2 lessons PM. Coaching workload treated as real physical demand.",
    coachNotes: "Balance already improved from 10s to 15s eyes closed.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-07-02-prog",
    date: "2026-07-02",
    time: "09:00:00",
    title: "Smith Front Squat Transition & Hockey Return Logistics",
    type: "off_ice",
    confidence: "RECONSTRUCTED",
    phase: "Early Progression / Return-to-Hockey Actions",
    location: "Planet Fitness",
    strength: [
      "Smith front squat: 25 lb/side → 35 lb/side → 45 lb/side (3 x 5 completed)",
      "RDL: 70 lb working baseline",
      "Bulgarian split squat: 30 lb DBs",
      "Incline DB press: 60 lb DBs",
      "Shoulder press: 40 lb DBs",
      "Farmer carry: 75 lb DBs",
      "Pull-ups: 4 x 6"
    ],
    notes: "Contacted local rink for stick-and-puck, joined hockey FB group, registered for AAHL. Training changed from theoretical preparation to active return-to-play logistics.",
    coachNotes: "Smith front squat preferred over goblet squat. Decision quality > workout variety. Recovery counts as training.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-07-15-roller1",
    date: "2026-07-15",
    time: "16:00:00",
    title: "Rollerblade Hockey Motor Reacquisition",
    type: "on_ice",
    confidence: "RECONSTRUCTED",
    phase: "Rollerblade / Hockey Motor Reacquisition",
    location: "Outdoor Parking Lot",
    athletic: [
      "Parking-lot rollerblading",
      "Stickhandling/dangling around leaves",
      "Passing pucks against curbs",
      "Shooting at water bottle (repeatedly hit target)"
    ],
    athleteReflection: "The more I was skating the better I got.",
    coachNotes: "Strong evidence of hockey-specific motor reacquisition. Performance improved within session rather than deteriorating.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-07-20-roller2",
    date: "2026-07-20",
    time: "15:00:00",
    title: "High-Activity Multi-Shift Hockey Day",
    type: "on_ice",
    confidence: "RECONSTRUCTED",
    phase: "Rollerblade / Hockey Motor Reacquisition",
    location: "Outdoor / Turf",
    athletic: ["Rollerbladed twice in one day", "4 additional skating shifts", "Mowed lawn"],
    notes: "Strong intrinsic desire to skate. Rollerblading reclassified as hockey workload rather than generic cardio.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-07-25-preaug",
    date: "2026-07-25",
    time: "09:00:00",
    title: "Smith Front Squat 55 lb/side Milestone",
    type: "off_ice",
    confidence: "RECONSTRUCTED",
    phase: "Mid-Program Strength Progression",
    location: "Planet Fitness",
    strength: [
      "Smith front squat: 45 lb/side x 5, 45 lb/side x 5, 55 lb/side x 5 (CRUSHED IT)",
      "RDL: 65 lb x 3 x 8",
      "Bulgarian split squat: 30 lb DBs"
    ],
    notes: "55 lb/side final set crushed. Mild right hip awareness noted and placed on watch list. Athlete left gym feeling better than entering.",
    coachNotes: "55 lb/side became established Smith front-squat capacity. Metric: leave stronger/athletic, not destroyed.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-07-30-london",
    date: "2026-07-30",
    time: "10:00:00",
    title: "London Travel & Active Walking Block",
    type: "travel",
    confidence: "RECONSTRUCTED",
    phase: "London Travel / Return",
    location: "London, UK",
    notes: "~1 week in London. High walking/travel workload. Deliberate re-entry planned rather than trying to compensate for missed lifts.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-05-reacc",
    date: "2026-08-05",
    time: "09:00:00",
    title: "Post-Travel Lower Reacclimation",
    type: "off_ice",
    confidence: "EXACT",
    phase: "August — Structured Return",
    location: "Planet Fitness",
    warmup: "Bike 10 min, World's Greatest Stretch, Hip airplanes, Deep squat hold, Single-leg balance, Jump drops",
    strength: [
      "Smith front squat: empty bar x 8, 25/side x 5, 45/side x 5, 50/side x 5 x 3",
      "RDL: 70 lb x 3 x 8 (3-sec eccentric)",
      "Bulgarian split squat: 30 lb DBs x 3 x 8/leg"
    ],
    athletic: ["Box jumps: 3 x 4", "Lateral bounds: 2 x 5/side", "Jump drop → goalie set: 3 x 5"],
    core: ["Russian twists: 25 lb, 2 x 30/side", "Side plank: 2 x 45 sec"],
    notes: "Rebuilding rhythm before intensity.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-06-upper",
    date: "2026-08-06",
    time: "09:30:00",
    title: "Upper Strength + Athletic Goalie Sets",
    type: "off_ice",
    confidence: "EXACT",
    phase: "August — Structured Return",
    location: "Planet Fitness",
    strength: [
      "Pull-ups: 4 x 6",
      "Incline DB press: 60 x 8, 60 x 8, 65 x 6–8",
      "Single-arm DB row: 65 lb x 3 x 10/side",
      "Standing DB shoulder press: 40 lb x 3 x 8"
    ],
    athletic: ["Jump drop → goalie set: 3 x 5", "Skater bounds: 3 x 5/side"],
    core: ["Russian twists: 25 lb, 2 x 30/side", "Side plank: 2 x 45 sec/side"],
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-11-lower",
    date: "2026-08-11",
    time: "08:30:00",
    title: "Lower Strength Progression (Coach Dispatch Day)",
    type: "off_ice",
    confidence: "EXACT",
    phase: "August — Structured Return",
    location: "Planet Fitness",
    warmup: "Bike warm-up",
    strength: [
      "Smith front squat: 25/side x 5, 45/side x 5, 50/side x 5 x 2",
      "RDL: 70 lb x 3 x 8",
      "Bulgarian split squat: 30 lb x 3 x 8/leg"
    ],
    notes: "Completed all strength work; athletic portion cut short to travel to train a goalie client.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-13-upper",
    date: "2026-08-13",
    time: "09:00:00",
    title: "Upper Strength + Power Bounds",
    type: "off_ice",
    confidence: "EXACT",
    phase: "August — Structured Return",
    location: "Planet Fitness",
    strength: [
      "Pull-ups: 4 x 6",
      "Incline DB press: 60 x 8, 60 x 8, 65 x 6–8",
      "Single-arm DB row: 65 lb x 3 x 10/side",
      "Standing DB shoulder press: 40 lb x 3 x 8"
    ],
    athletic: ["Jump drop → goalie stance: 3 x 5", "Skater bounds: 3 x 5/side", "Box jumps: 3 x 4"],
    core: ["Russian twists: 30 lb, 2 x 30/side", "Side plank: 2 x 45 sec/side"],
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-15-unilateral",
    date: "2026-08-15",
    time: "09:00:00",
    title: "Unilateral Strength, Balance & Lateral Power Discovery",
    type: "off_ice",
    confidence: "EXACT",
    phase: "August — Structured Return",
    location: "Planet Fitness",
    warmup: "Bike 6–8 min, Hip/adductor mobility",
    balance: ["Eyes-closed single-leg balance: 2 x 20 sec/side"],
    strength: [
      "Step-ups: 3 x 8/side @ 30–40 lb DBs",
      "Single-leg RDL: 3 x 8/side @ 30–35 lb",
      "Reverse lunges: 2 x 8/side @ 25–30 lb DBs"
    ],
    athletic: [
      "Lateral skater bounds: 3 x 5/side",
      "Box jumps: 3 x 4",
      "Jump drop → goalie stance: 3 x 5"
    ],
    core: ["Suitcase carry: 3 x 30 sec/side", "Dead bugs: 2 x 10/side"],
    notes: "Great workout. Felt strong on later RDL sets. Lower center of mass improved lateral power and control.",
    cues: ["GET LOW → LOAD THE LEG → PUSH THE FLOOR AWAY → CONTROL THE LANDING."],
    coachNotes: "Athlete responds exceptionally to unilateral/lateral training. Balance improved significantly within session.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-23-fullbody",
    date: "2026-08-23",
    time: "09:00:00",
    title: "Week 9: Full-Body Strength + Power",
    type: "off_ice",
    confidence: "EXACT",
    phase: "Week 9 / Return to Full-Body",
    location: "Planet Fitness",
    strength: [
      "Smith front squat: 25/side x 5, 45/side x 5, 50/side x 5, 55/side x 5",
      "Superset: Pull-ups 3 x 6 + Incline DB press 60x8, 60x8, 65x6–8",
      "Single-leg RDL: 35 lb x 3 x 8/side"
    ],
    athletic: ["Box jumps: 3 x 4", "Skater bounds: 3 x 5/side", "Jump drop → goalie stance: 2 x 5"],
    core: ["Suitcase carry: 2 x 30 sec/side", "Dead bugs: 2 x 10/side"],
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-25-taper",
    date: "2026-08-25",
    time: "10:00:00",
    title: "Tryout Taper & Upper Body Primer",
    type: "off_ice",
    confidence: "EXACT",
    phase: "Tryout Taper",
    location: "Planet Fitness",
    strength: [
      "Pull-ups: 3 x 5 target",
      "Incline DB press: 2 x 6 @ ~60 lb",
      "Single-arm row: 2 x 8/side @ ~60–65 lb",
      "Shoulder press: 2 x 6 @ ~35–40 lb"
    ],
    athletic: ["Skater bounds: 2 x 4/side", "Jump drop → stance: 2 x 4"],
    notes: "Intentional reserve left in the tank for Friday tryout. Friday performance > Tuesday fatigue.",
    coachNotes: "Leaving reserve was intentional and executed perfectly.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-28-stickpuck",
    date: "2026-08-28",
    time: "12:00:00",
    title: "Two-a-Day Part 1: Stick-and-Puck Calibration",
    type: "on_ice",
    confidence: "EXACT",
    phase: "First Major Hockey Performance Block",
    location: "Ice Arena Rink",
    notes: "Calibration session: establish posts and landmarks, depth and angles, track straightforward shots.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-28-tryout",
    date: "2026-08-28",
    time: "20:00:00",
    title: "Two-a-Day Part 2: Competitive Hockey Tryout",
    type: "game",
    confidence: "EXACT",
    phase: "First Major Hockey Performance Block",
    location: "Ice Arena Rink",
    notes: "First major competitive performance test of comeback. Primary performance event.",
    athleteReflection: "I love the game of hockey. It was my first love.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-29-reacq",
    date: "2026-08-29",
    time: "11:00:00",
    title: "Stick-and-Puck / Goalie Reacquisition",
    type: "on_ice",
    confidence: "RECONSTRUCTED",
    phase: "First Major Hockey Performance Block",
    location: "Ice Arena Rink",
    notes: "Significant hip soreness (goalie-specific workload). Fast, flexible, body responded to intended goalie movements.",
    athleteReflection: "My body responded to what I wanted to.",
    coachNotes: "Training priority officially shifted from rebuilding athlete → rebuilding goalie.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-08-31-shots",
    date: "2026-08-31",
    time: "14:00:00",
    title: "On-Ice Shot Tracking & Live Reps",
    type: "on_ice",
    confidence: "RECONSTRUCTED",
    phase: "First Major Hockey Performance Block",
    location: "Ice Arena Rink",
    notes: "Took live shooter reps following Friday two-a-day.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-01-postice",
    date: "2026-09-01",
    time: "10:00:00",
    title: "Post-Ice Upper + Trunk Recovery Strength",
    type: "off_ice",
    confidence: "EXACT",
    phase: "September — Goalie-First Phase",
    location: "Planet Fitness",
    warmup: "Bike warm-up (25 min session window)",
    strength: [
      "Pull-ups: 3 x 6",
      "Incline DB press: 60 x 8, 65 x 8, 65 x 8 (RPE 7)",
      "Single-arm DB row: 2 x 10/side @ 65–70 lb",
      "Standing DB shoulder press: 2 x 8 @ 40 lb"
    ],
    core: ["Suitcase carry: 2 x 30 sec/side @ 70–75 lb", "Dead bugs: 2 x 10/side"],
    notes: "No leg jumps or conditioning. Ice workload now determines gym workload.",
    coachNotes: "Gym becomes maintenance, durability and support.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-02-onice",
    date: "2026-09-02",
    time: "08:30:00",
    title: "On-Ice Development: Compete & Depth Control",
    type: "on_ice",
    confidence: "EXACT",
    phase: "September — Goalie-First Phase",
    location: "Ice Arena Rink",
    notes: "4th time back on ice. Felt capable of playing at a high level. High compete level.",
    coachNotes: "Primary bottleneck shifting toward angles, pacing, reads, rebound control & goalie decision making.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-04-onice",
    date: "2026-09-04",
    time: "08:30:00",
    title: "On-Ice Compete Skate: Friday Session",
    type: "on_ice",
    confidence: "EXACT",
    phase: "September — Goalie-First Phase",
    location: "Ice Arena Rink",
    notes: "Improved throughout the week. Body recovered well between Wed & Fri. Established weekly Wed/Fri ice rhythm.",
    athleteReflection: "It was great to be back.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-08-yoga",
    date: "2026-09-08",
    time: "09:00:00",
    title: "Active Recovery: Yoga Day 14 Stretch",
    type: "recovery",
    confidence: "EXACT",
    phase: "September — Goalie-First Phase",
    location: "Home / Studio",
    recovery: ["Yoga Day 14 stretch"],
    notes: "Fascia release and hip mobility maintenance.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-09-iceactivation",
    date: "2026-09-09",
    time: "11:00:00",
    title: "Yoga 15 + Stick-and-Puck + Lower Activation Protocol",
    type: "on_ice",
    confidence: "EXACT",
    phase: "September — Goalie-First Phase",
    location: "Ice Arena Rink + Gym",
    warmup: "Pre-Ice: Yoga Day 15",
    athletic: [
      "Stick-and-puck on ice (sluggish edges / slow legs)",
      "Post-Ice Lower Activation: BW reverse lunge 2x6/side, Single-leg RDL reach 2x6/side, Calf raise 2x12, Glute bridge 2x10 with 2s squeeze",
      "Goalie Activation: Skater bound 2x4/side, Jump drop → goalie set 2x4, Lateral shuffle → set 2x4/dir"
    ],
    core: ["Dead bug 2 x 8/side", "Side plank 30s/side x 2", "Suitcase carry 1 x 30s/side @ 60–70 lb"],
    cues: ["SIT INTO YOUR EDGES."],
    coachNotes: "Edge feedback loop identified: sluggish → stand taller → reduced edge loading → arrive late → lazy depth/angle. Solution: Sit into edges.",
    sport: "Ice Hockey"
  },
  {
    id: "ath-2026-09-11-current",
    date: "2026-09-11",
    time: "09:00:00",
    title: "Milestone Baseline: Return to Competitive Hockey",
    type: "baseline",
    confidence: "EXACT",
    phase: "Current State / Future Model",
    location: "Goalie Card HQ",
    notes: "Current Weekly Model: Wednesday Ice / Development, Friday Ice / Compete, 1 early strength session, 1 short upper session, targeted recovery.",
    coachNotes: "Athlete is no longer limited by general physical capacity. Focus is 100% on ice volume, edge calibration, angles, depth, reads & rebound control.",
    cues: ["Angles → depth → arrive set → read → save.", "Sit into your edges."],
    sport: "Ice Hockey"
  }
];
