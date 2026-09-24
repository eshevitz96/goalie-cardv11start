/**
 * BACKFILL SCRIPT: Sept 17–25 Athlete Track Local Records
 * 
 * Writes records to data/athlete-track-local.json with exact epistemic classification,
 * stable deterministic UUIDs, nullable load preservation, and planned event lookahead.
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
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const localJsonPath = path.join(dataDir, 'athlete-track-local.json');

const backfillEntries = [
  // 2026-09-17: Recovery / Readiness Check-In
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-17-readiness'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-17',
    title: 'Recovery & Readiness Check-In',
    epistemicType: 'ATHLETE_STATE',
    trainingType: 'recovery',
    durationMins: null, // No completed workout documented
    confidence: 'EXACT',
    phase: 'In-Season Maintenance & Recovery',
    notes: "Athlete report: 'I feel good.' Readiness check-in only; no completed workout documented.",
    athleteReflection: 'I feel good.',
    rawAthleteReport: 'I feel good.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-17T12:00:00.000Z'
  },

  // 2026-09-18: Yoga + Maintenance Strength
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-18-yoga-strength'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-18',
    title: 'Yoga Day 17 + Maintenance Strength',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    durationMins: null, // Full workout duration unstated
    confidence: 'EXACT',
    phase: 'In-Season Maintenance & Recovery',
    warmup: 'Bike: 6 min, 1.5 miles',
    strength: [
      'Pull-ups completed',
      'Upper-dominant maintenance strength (lower weights used during workout than prescribed)',
      'Dead bugs: 2x10/side'
    ],
    recovery: ['Yoga Day 17'],
    notes: 'Yoga Day 17 completed. Bike 6m / 1.5 mi. Pull-ups. Upper-dominant maintenance strength with lower weights used than prescribed. Dead bugs 2x10/side. Planned goalie lessons canceled (not counted as completed workload). Later travel to Tallahassee/FSU.',
    athleteReflection: 'done. lower weights used during workouts but higher reps for dead bugs at 10 per side.',
    rawAthleteReport: 'done. lower weights used during workouts but higher reps for dead bugs at 10 per side.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-18T12:00:00.000Z'
  },

  // 2026-09-21: Stick & Puck
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-21-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-21',
    title: 'On-Ice Stick & Puck',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'on_ice',
    durationMins: null, // UNKNOWN - no authoritative duration record
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

  // 2026-09-22: Modified Deck-of-Cards Bodyweight Conditioning
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-22-deck-cards'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-22',
    title: 'Modified Deck-of-Cards Bodyweight Conditioning',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    durationMins: 38,
    confidence: 'EXACT',
    phase: 'Muscular Endurance & Metabolic Conditioning',
    conditioning: 'Full deck of cards in 38 min: Hearts (burpees), Spades (push-ups), Diamonds (squats), Clubs (sit-ups or V-ups). Cards under 5 at 2x card value. Aces (>=1 min plank), Jokers (>=1 min wall sit).',
    notes: 'Full deck completed in 38 minutes. High muscular-endurance and conditioning demand. Athlete stated usually completes deck in ~30 mins. Exact total reps not fabricated due to unrecorded shuffle order.',
    athleteReflection: 'Sweating heavily, tough workout.',
    rawAthleteReport: 'Completed full deck in 38 minutes. Sweating heavily, tough.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-22T12:00:00.000Z'
  },

  // 2026-09-23: Run + Recovery
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-23-run-recovery'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-23',
    title: 'Conditioning Run + Stretching & Mobility',
    epistemicType: 'COMPLETED_TRAINING',
    trainingType: 'off_ice',
    durationMins: null, // Elapsed run time ~26:47 is mathematically derived; mobility duration unstated
    confidence: 'EXACT',
    phase: 'Aerobic Conditioning & Hip Mobility',
    conditioning: 'Run: 3.15 miles at 8:30/mile pace (derived running time ~26:47)',
    recovery: ['Stretching, mobility, and recovery completed'],
    notes: 'Run: 3.15 miles at 8:30 pace [DERIVED running time ~26:47]. Stretching and mobility completed (duration unstated).',
    athleteReflection: 'Stretching and recovery completed following run.',
    rawAthleteReport: '3.15 mile run at 8:30 pace + stretching and mobility recovery.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-23T12:00:00.000Z'
  },

  // 2026-09-24: Lacrosse Goalie Coaching / Current Athlete State
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-24-lax-coaching'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-24',
    time: '09:00:00',
    title: 'Lacrosse Goalie Coaching (Jake Franklin)',
    epistemicType: 'UNSTRUCTURED_ACTIVITY',
    trainingType: 'other',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Coaching Activity Context',
    notes: 'Trained lacrosse goalie Jake Franklin at ~9 AM. Explicitly not a personal workout for Elliott. Elliott stretched and shot approx 50-100 lacrosse-ball repetitions on turf.',
    athleteReflection: 'body is a little sore, nothing crazy.',
    rawAthleteReport: 'trained a lacrosse goalie this morning, not a workout for me. body is a little sore, nothing crazt',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-24T09:00:00.000Z'
  },

  // 2026-09-25: Stick & Puck (PLANNED EVENT ONLY)
  {
    id: generateDeterministicUuid('athlete_track_dynamic', 'ath-2026-09-25-planned-stick-puck'),
    userId: '00000000-0000-0000-0000-000000000000',
    date: '2026-09-25',
    title: 'On-Ice Stick & Puck Session',
    epistemicType: 'PLANNED_EVENT',
    trainingType: 'on_ice',
    durationMins: null,
    confidence: 'EXACT',
    phase: 'Ice Performance & Crease Depth',
    notes: 'Planned upcoming on-ice stick & puck training event. Status: PLANNED (does not count as completed training). Populates nextPerformance lookahead for Sept 24 coaching decision.',
    supersedesId: null,
    supersededBy: null,
    isActive: true,
    createdAt: '2026-09-24T12:00:00.000Z'
  }
];

fs.writeFileSync(localJsonPath, JSON.stringify(backfillEntries, null, 2), 'utf-8');
console.log(`✅ Successfully backfilled ${backfillEntries.length} records to ${localJsonPath}`);
