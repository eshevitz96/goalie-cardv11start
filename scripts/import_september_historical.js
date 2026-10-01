/**
 * GOALIE CARD — SEPTEMBER 2026 ATHLETE TRACK HISTORICAL IMPORT
 * 
 * Performs one-time historical backfill of Elliott Shevitz's September 2026 Athlete Track
 * with strict adherence to non-negotiable epistemic rules.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateDeterministicUuid(namespace, sourceId) {
  const hash = crypto.createHash('sha1').update(`${namespace}:${sourceId}`).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

const dataDir = path.join(process.cwd(), 'data');
const localJsonPath = path.join(dataDir, 'athlete-track-local.json');

// Read existing dynamic local records
let existingRecords = [];
if (fs.existsSync(localJsonPath)) {
  existingRecords = JSON.parse(fs.readFileSync(localJsonPath, 'utf8'));
}

const importTimestamp = new Date().toISOString();

// Define canonical dynamic records (both preserved and newly imported)
const importedDynamicRecords = [
  // 1. 2026-09-17: Recovery & Readiness Check-In (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-17-readiness'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-17',
    title: 'Recovery & Readiness Check-In',
    epistemicType: 'ATHLETE_STATE',
    trainingType: 'recovery',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'In-Season Maintenance & Recovery',
    notes: "Athlete report: 'I feel good.' Overall: GOOD. Readiness check-in only; no completed workout documented.",
    athleteReflection: 'I feel good.',
    rawAthleteReport: 'I feel good.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-17T12:00:00.000Z'
  },

  // 2. 2026-09-18: Yoga Day 17 + Maintenance Strength (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-18-yoga-strength'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-18',
    title: 'Yoga Day 17 + Maintenance Strength',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'In-Season Maintenance & Recovery',
    warmup: 'Bike: 6 min, 1.5 miles',
    strength: [
      'Pull-ups completed',
      'Upper-dominant maintenance strength (lower weights used during workout than prescribed)',
      'Dead bugs: 2x10/side'
    ],
    recovery: ['Yoga Day 17'],
    notes: 'Yoga Day 17 completed. Bike 6m / 1.5 mi. Pull-ups. Upper-dominant maintenance strength with lower weights used than prescribed. Dead bugs 2x10/side. Planned goalie lessons canceled (not counted as completed workload). Later travel to Tallahassee/FSU. Duration: UNKNOWN.',
    athleteReflection: 'done. lower weights used during workouts but higher reps for dead bugs at 10 per side.',
    rawAthleteReport: 'done. lower weights used during workouts but higher reps for dead bugs at 10 per side.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-18T12:00:00.000Z'
  },

  // 3. 2026-09-21: On-Ice Stick & Puck (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-21-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-21',
    title: 'On-Ice Stick & Puck',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'on_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Ice Performance & Crease Depth',
    cues: [
      'Maintain edges',
      'Stay narrow',
      'Move less',
      'Move confidently when needed'
    ],
    notes: 'Completed on-ice stick & puck. Film of himself and other goalies informed a technical intention to maintain edges, stay narrow, and move less, while moving confidently when needed. Especially noticed on breakaways. Stored as athlete report / technical observations only; not promoted to Learned Pattern.',
    athleteReflection: 'Movements were really sharp. Holding my ground, especially on breakaways. Not too sore afterward.',
    rawAthleteReport: 'Movements were really sharp and holding my ground. Not too sore afterward.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-21T12:00:00.000Z'
  },

  // 4. 2026-09-22: Modified Deck-of-Cards Bodyweight Conditioning (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-22-deck-cards'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-22',
    title: 'Modified Deck-of-Cards Bodyweight Conditioning',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    participantRole: 'ATHLETE',
    durationMins: 38,
    confidence: 'EXACT',
    phase: 'Muscular Endurance & Metabolic Conditioning',
    conditioning: 'Full deck of cards in 38 min: Hearts (burpees), Spades (push-ups), Diamonds (squats), Clubs (sit-ups or V-ups). Cards under 5 at 2x card value. Aces (>=1 min plank), Jokers (>=1 min wall sit).',
    notes: 'Full deck completed in 38 minutes EXACT. High muscular-endurance and conditioning demand. Athlete report: Very tough. Athlete stated usually completes deck in ~30 mins. Exact total reps not fabricated due to unrecorded shuffle order.',
    athleteReflection: 'Sweating heavily, tough workout.',
    rawAthleteReport: 'Completed full deck in 38 minutes. Sweating heavily, tough.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-22T12:00:00.000Z'
  },

  // 5. 2026-09-23: Conditioning Run + Stretching & Mobility (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-23-run-recovery'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-23',
    title: 'Conditioning Run + Stretching & Mobility',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Aerobic Conditioning & Hip Mobility',
    conditioning: 'Run: 3.15 miles at 8:30/mile pace (derived running time ~26:47)',
    recovery: ['Stretching, mobility, and recovery completed'],
    notes: 'Run: 3.15 miles at 8:30 pace [DERIVED running time ~26:47; mark duration as DERIVED, not directly reported]. Stretching and mobility completed (details/duration unstated).',
    athleteReflection: 'Stretching and recovery completed following run.',
    rawAthleteReport: '3.15 mile run at 8:30 pace + stretching and mobility recovery.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-23T12:00:00.000Z'
  },

  // 6. 2026-09-24 Morning: Lacrosse Goalie Coaching (Jake Franklin) (PRESERVED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-24-lax-coaching'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-24',
    time: '09:00:00',
    title: 'Lacrosse Goalie Coaching (Jake Franklin)',
    epistemicType: 'UNSTRUCTURED_ACTIVITY',
    trainingType: 'other',
    participantRole: 'COACH',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Coaching Activity Context',
    notes: 'Trained lacrosse goalie Jake Franklin at ~9 AM. Physical involvement: shot approx 50–100 balls and stretched. Athlete explicitly said "not a workout for me"; therefore NOT classified as Elliott workout. Body state reported: "a little sore, nothing crazy."',
    athleteReflection: 'body is a little sore, nothing crazy.',
    rawAthleteReport: 'trained a lacrosse goalie this morning, not a workout for me. body is a little sore, nothing crazt',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-24T09:00:00.000Z'
  },

  // 7. 2026-09-24 Evening: Strength & Core (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-24-strength-pm'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-24',
    time: '18:00:00',
    title: 'Full-Body Strength & Core (Pre-Ice Session)',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'In-Season Strength & Crease Preparation',
    warmup: 'Bike: 8:00, resistance 3, 2.2 miles (Athlete report during bike: "flying")',
    strength: [
      'Pull-ups: 3 x 6 @ bodyweight (full lockout)',
      'Incline DB press: 3 x 15 @ 45 lb each hand',
      'Smith front squat: 3 x 5 (set 1 = 50 lb per side, sets 2–3 = 55 lb per side)',
      '1-arm DB row: 3 x 8/side @ 70 lb',
      'RDL: 2 x 10 @ 30 lb (implement/load convention UNKNOWN)',
      'Calf raises: 2 x 20 @ 70 lb (supersetted with RDL; implement unspecified)'
    ],
    core: [
      '10-minute ab workout (completed duration 10:20; final visible exercise: Sphinx Plank; remaining exercises UNKNOWN)'
    ],
    notes: 'Actual execution differed from planned Mission and external plan; actual execution is authoritative. Bike 8:00 (2.2 mi, res 3; "flying"). Pull-ups 3x6 BW full lockout. Incline DB press 3x15 @ 45 lb each hand. Smith front squat 3x5 (50 lb/side x 1, 55 lb/side x 2). 1-arm DB row 3x8/side @ 70 lb. RDL 2x10 @ 30 lb (implement unknown) supersetted with Calf raises 2x20 @ 70 lb (implement unspecified). Core 10:20 (Sphinx Plank final exercise; remaining exercises unknown). Post-session athlete report: "crushed it all", "feel like i got better today." Reflection: Positive. Hypothesis: This stronger pre-ice session may be compatible with next-day performance (STATUS: HYPOTHESIS ONLY). Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: 'crushed it all. feel like i got better today.',
    rawAthleteReport: 'Bike: flying. crushed it all. feel like i got better today.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-24T18:00:00.000Z'
  },

  // 8. 2026-09-25: On-Ice Stick & Puck / Performance Session (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-25-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-25',
    time: '12:00:00',
    title: 'On-Ice Stick & Puck / Performance Session',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'on_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Ice Performance & Crease Depth',
    cues: [
      'Keep it simple.',
      'Compact stance',
      'Arrive set',
      'Mental reset after reps'
    ],
    notes: 'Performance Session (Stick & puck / hockey). Entered ~10 min late (reported threw him off). Early goals allowed: low-angle short-side goal described as good shot; breakaway goal. Mental response: proud of reset ("It\'s just a rep, and I got scored on in that rep, and I\'ll make the save in the next rep."); goals did not linger mentally. Later performance: played well, made big saves, Colin + friend did not score, Trent did not score (Trent playing history UNVERIFIED in dataset). Physical/technical report: physically tight/compact from positioning standpoint, movement crisp, good edges, good in crease, composed, did not sweat much. Overall athlete assessment: Positive. Hypothesis update: Sept 24 strength was compatible with good Sept 25 ice performance; do NOT claim it caused performance (HYPOTHESIS remains HYPOTHESIS). Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: 'Physically tight/compact from positioning standpoint, movement crisp, good edges, good in crease, composed, did not sweat much. "It\'s just a rep, and I got scored on in that rep, and I\'ll make the save in the next rep." Goals did not linger mentally. Overall positive.',
    rawAthleteReport: 'Entered ~10 mins late which threw me off. Early goals: low-angle short-side on good shot, breakaway. Raw reflection: "It\'s just a rep, and I got scored on in that rep, and I\'ll make the save in the next rep." Goals did not linger. Played well after, big saves, Colin + friend did not score, Trent did not score. Physically tight/compact positioning, crisp movement, good edges, good in crease, composed, didn\'t sweat much.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-25T12:00:00.000Z'
  },

  // 9. 2026-09-25 Coaching: Hunter Cortjens & Carter Gethers (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-25-coach-lessons'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-25',
    time: '17:15:00',
    title: 'Lacrosse Coaching Work Context (Hunter Cortjens completed, Carter Gethers canceled)',
    epistemicType: 'UNSTRUCTURED_ACTIVITY',
    trainingType: 'other',
    participantRole: 'COACH',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Coaching Activity Context',
    notes: 'After hockey: Hunter Cortjens lesson completed. Carter lesson canceled. These are COACH events; do NOT automatically count as Elliott athlete training load unless physical demand is separately reported. Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    rawAthleteReport: 'Hunter Cortjens lesson completed. Carter lesson canceled.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-25T17:15:00.000Z'
  },

  // 10. 2026-09-26 Coaching: Brock Gebhardt & Susie McElheny (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-26-coach-lessons'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-26',
    time: '08:00:00',
    title: 'Lacrosse Coaching Work Context (Susie McElheny & Brock Gebhardt)',
    epistemicType: 'UNSTRUCTURED_ACTIVITY',
    trainingType: 'other',
    participantRole: 'COACH',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Coaching Activity Context',
    notes: 'Brock lesson completed. Susie lesson completed. These are COACH events; do not automatically classify as Elliott athlete workload. Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    rawAthleteReport: 'Brock lesson completed. Susie lesson completed.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-26T08:00:00.000Z'
  },

  // 11. 2026-09-28: On-Ice Stick & Puck (PRESERVED & RECONCILED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-28-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-28',
    title: 'On-Ice Stick & Puck',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'on_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Ice Performance & Crease Depth',
    cues: [
      'Keep it simple.',
      'Composed around the net',
      'Arrive set'
    ],
    notes: 'Stick & Puck session (available window approx 2 hours; do NOT record 2 hours as exact on-ice duration; actual high-quality goalie exposure ~70–80 mins before noticeable fatigue; legs tired afterward, NOT sore, no pain reported; ~5 goals allowed by around 20 mins remaining while making "insane saves"; final ~10 mins had little/no defense and Elliott reported getting "shelled"; exceptional glove save while nearly in splits with strong defender reaction and shooter comment on "sticky gloves"; overall skill level lower than prior Friday; composed, simple, moved around net well, only a couple angle misses, some shots wanted back, full effort, hard goalie workload, little defensive support). Reflection: "Feeling good. Glad I did it again." Do NOT use goals allowed as standalone KPI. Do NOT learn "2-hour stick & puck is good." Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: "I do feel like I'm playing well there. I made a glove save that had everybody freaking shocked. My legs are tired. Not sore, but tired. Feeling good. Glad I did it again.",
    rawAthleteReport: '"I do feel like I\'m playing well there." "I made a glove save that had everybody freaking shocked." "My legs are tired. Not sore, but tired." "Feeling good." "Glad I did it again."',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-28T12:00:00.000Z'
  },

  // 12. 2026-09-29 Morning: Morning Recovery & Readiness State (PRESERVED & RECONCILED)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-29-readiness-am'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-29',
    time: '08:00:00',
    title: 'Morning Recovery & Readiness State',
    epistemicType: 'ATHLETE_STATE',
    trainingType: 'recovery',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'In-Season Maintenance & Recovery',
    recovery: [
      'Completed morning stretching (body responded great)'
    ],
    notes: 'Current athlete state (Tuesday morning Sept. 29). Athlete report: "today we feel good. I ate so much food last night - feeling good now body not sore at all, did some good stretching this morning and body responded great." Structured state: overall: GOOD, soreness: NONE REPORTED, pain: NONE REPORTED, recovery context: previous day\'s leg fatigue no longer reported, mobility: stretching completed, response: body responded great, nutrition: ate large amount previous night. Important: do NOT infer food caused recovery; do NOT infer stretching caused recovery. Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: 'today we feel good. I ate so much food last night - feeling good now body not sore at all, did some good stretching this morning and body responded great.',
    rawAthleteReport: 'today we feel good. I ate so much food last night - feeling good now body not sore at all, did some good stretching this morning and body responded great.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-29T08:00:00.000Z'
  },

  // 13. 2026-09-29 Evening: Full-Body Strength (Actual Execution) (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-29-strength-fullbody'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-29',
    time: '17:00:00',
    title: 'Full-Body Strength (Actual Execution)',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'In-Season Strength & Crease Preparation',
    warmup: 'Bike: 3.05 miles, resistance 4, duration approx 10–11 minutes (athlete said both "ten minutes" and "about 11 minutes on the dot"; exact duration UNKNOWN; DO NOT manufacture exact duration)',
    strength: [
      'Bodyweight squat with 3-second hold (exact sets/reps: UNKNOWN) [Superset 1]',
      'Pull-ups: 3 x 6 @ bodyweight (full lockout) [Superset 1]',
      'Smith machine incline press: 3 x 8 (Set 1: 45 lb per side x 8; Sets 2–3: 55 lb per side x 8) [Superset 2]',
      'Single-leg RDL: 30 lb in each hand (set count: UNKNOWN) [Superset 2]',
      'DB row: 2 x 10 (load: UNKNOWN) [Superset 3]',
      'Bulgarian split squat: 2 x 8 each leg @ 30 lb in each hand [Superset 3]'
    ],
    conditioning: 'Bike: 3.05 miles @ resistance 4 (~10–11 min). Run: NONE. Additional conditioning: none beyond bike reported.',
    core: [
      'Core reported completed earlier that day (exact work: UNKNOWN in this import; do NOT create a second completed core session)'
    ],
    notes: 'Full-body strength completed. Actual execution differed from planned Mission; actual execution is authoritative. Bodyweight squat with 3-second hold (sets/reps UNKNOWN) superset with Pull-ups 3x6 BW full lockout. Bike 3.05 mi, resistance 4, ~10–11 min (exact duration UNKNOWN). Smith machine incline press 3x8 (45 lb/side x 8, 55 lb/side x 8, 55 lb/side x 8) superset with Single-leg RDL 30 lb in each hand (sets UNKNOWN). DB row 2x10 (load UNKNOWN) superset with Bulgarian split squat 2x8/leg @ 30 lb in each hand. Core reported completed earlier that day (exact work UNKNOWN; no second session created). Run: NONE. No additional conditioning beyond bike reported. Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: 'Completed full-body strength. Actual execution differed from planned Mission. Felt good.',
    rawAthleteReport: 'Bike 3.05 miles res 4, ~10-11 min. Regular/bodyweight squat with 3-second hold superset pull-ups 3x6 BW full lockout. Smith machine incline press 3x8 (45 lb/side, 55 lb/side, 55 lb/side) superset single-leg RDL 30 lb in each hand. DB row 2x10 superset Bulgarian split squat 2x8/leg 30 lb in each hand. Core completed earlier today.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-29T17:00:00.000Z'
  },

  // 14. 2026-09-30: On-Ice Stick & Puck / Technical Feedback & Mental Framing (NEW IMPORT)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-30-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-30',
    time: '12:00:00',
    title: 'On-Ice Stick & Puck / Technical Feedback & Mental Framing',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'on_ice',
    participantRole: 'ATHLETE',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Ice Performance & Crease Depth',
    cues: [
      'Keep it simple',
      'Stay upright/tall later',
      'Glove set lower',
      'Reverse VH calibration'
    ],
    notes: 'On-ice stick & puck session. Context: Arrived late. Physical state: "felt good." Performance report: compact, simplified more than usual, made many big saves, associated some success with simplifying. Movement mechanics: stayed upright/tall later rather than getting low through hips early; seeing things well; sliding well; good stick activity; balance good, not great; edges okay, not great; beginning to get reverse VH. Technical feedback event: allowed near-side glove goal on good shot; asked shooter for feedback ("You brought your glove up, and I knew you wouldn\'t be able to bring it down"); adjustment: kept glove set lower; athlete reported "that helped" (Feedback sequence: OBSERVE -> RECEIVE EXTERNAL FEEDBACK -> ADJUST -> ATHLETE REPORTS IMPROVEMENT; stored as technical observation, not established technique). Late session goals: ~2 GA in real time, then 3 at end / final few minutes (preserve ambiguity & late-session context; GA is not standalone KPI). Social signal: player asked "Where do you play?" with perceived surprise (stored as factual event, not objective league validation). Athlete belief: "I think I\'m known as the good goalie now at stick and puck" (ATHLETE_REPORT / belief, NOT FACT). Competitive motivation & mental frame: wants to play higher competitive level; has not heard back from tryouts or Trent ("It\'s just not the right time"); mental frame: "It\'s out of my control. All I can do is keep showing up, keep playing my best. You got to play hockey today, so it\'s all good." Longitudinal mental state evidence. Provenance: HISTORICAL_CONVERSATION_IMPORT.',
    athleteReflection: '"felt good." Simplified more than usual, big saves. Stayed upright/tall later, sliding well, stick active, balance good not great, edges okay not great, beginning reverse VH. Shooter feedback on high glove -> set glove lower -> helped. "It\'s out of my control. All I can do is keep showing up, keep playing my best. You got to play hockey today, so it\'s all good."',
    rawAthleteReport: 'Arrived late. Felt good. Compact, simplified more than usual, big saves. Stayed tall later rather than getting low early. Seeing things well, sliding well, stick active, balance good not great, edges okay not great, beginning to get RVH. Glove feedback: shooter said I brought glove up and couldn\'t bring it down, kept glove lower, that helped. ~2 goals in real time, 3 at end. Guy asked where I play and looked surprised. I think I\'m known as the good goalie now at stick and puck. Want to play higher level, not right time, haven\'t heard back on tryouts or from Trent. It\'s out of my control, just keep showing up and playing my best. Got to play hockey today so it\'s all good.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-30T12:00:00.000Z'
  }
];

// Write updated dynamic records to local JSON store
fs.writeFileSync(localJsonPath, JSON.stringify(importedDynamicRecords, null, 2), 'utf-8');
console.log(`✅ Successfully wrote ${importedDynamicRecords.length} dynamic records to ${localJsonPath}`);
