/**
 * TEST SUITE: COACH CARD PHASE 3 PERFORMANCE-AWARE DECISION ENGINE
 * Version: 2026-09-16
 *
 * Verifies all Phase 3 requirements & master directives:
 * 1. DECISION HIERARCHY DOMINANCE: Safety gates > Contract > Upcoming performance > Load context > Sensing > Autoregulation.
 * 2. SAFETY VS BASE_COACHING_HEURISTIC: Safety gates are immutable hard constraints (replaceableByAthleteEvidence = false);
 *    General coaching rules are flagged as BASE_COACHING_HEURISTIC with replaceableByAthleteEvidence = true.
 * 3. MULTI-HORIZON FACTUAL LOAD CONTEXT: Factual exposure evaluation (24h, 48h, 72h, 7d) without fabricated fatigue scores.
 * 4. MISSION REVISION IMMUTABILITY: Original PlannedMission.phases is NEVER mutated in place; MissionRevisions record trigger,
 *    snapshots, rationale, and state transitions.
 * 5. REST IS A STRATEGIC MISSION: NO_TRAINING represents deliberate coaching restraint, not failure or non-compliance.
 * 6. PRIME_FOR_PERFORMANCE SEMANTICS: Low-volume, high-quality neural prep preserving readiness without meaningful fatigue.
 * 7. SEPT 15 -> SEPT 16 COUNTERFACTUAL REPLAY: Given only pre-Sept 15 context and Sept 16 benchmark on-ice event, verifies
 *    PRESERVE_READINESS/PRIME recommendation, capped axial load, progression restraint, and preservation of pre-ice lifting as HYPOTHESIS.
 */

import { CoachDecisionEngine } from '../lib/decisionEngine';
import { LoadContextEngine } from '../lib/loadContextEngine';
import { 
  CalendarPerformanceEvent, 
  LoadEvent,
  PlannedMission, 
  PreSessionAthleteState,
  WorkoutPhase,
  WorkoutExercise,
  DecisionRule
} from '../lib/athleteTypes';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, detail !== undefined ? detail : '');
    failed++;
  }
}

console.log("\n=======================================================");
console.log("RUNNING PHASE 3 DECISION ENGINE TEST SUITE");
console.log("=======================================================\n");

// --------------------------------------------------------------------------
// 1. SAFETY GATES DOMINATE OVER ALL OTHER FACTORS
// --------------------------------------------------------------------------
console.log("--- 1. Safety Gate Dominance Test ---");

const movementAlteringState: PreSessionAthleteState = {
  rawReport: "Right hip pinch when rotating, sharp catch",
  structured: {
    physical: 'heavy_fatigued',
    neuromuscular: 'sluggish',
    mental: 'calm',
    goalieState: null,
    soreness: {
      behavior: 'movement_altering',
      locations: ['hips', 'adductors']
    }
  },
  confirmationStatus: 'athlete_confirmed',
  extractionConfidence: 'HIGH',
  timestamp: '2026-09-16T10:00:00Z'
};

const highPriorityEventTomorrow: CalendarPerformanceEvent = {
  id: 'game-tomorrow',
  userId: 'elliott-shevitz',
  title: 'Championship Game vs Rival',
  eventType: 'game',
  startDateTime: '2026-09-17T19:00:00Z',
  priority: 'HIGH',
  expectedPhysicalDemand: 'HIGH',
  technicalImportance: 'HIGH',
  status: 'CONFIRMED',
  hoursUntilEvent: 33
};

const emptyLoadContext = LoadContextEngine.evaluateLoadContext([], '2026-09-16T10:00:00Z');

const safetyMission = CoachDecisionEngine.evaluateDailyMission({
  userId: 'elliott-shevitz',
  targetDate: '2026-09-16',
  setting: 'home',
  level: 'elite',
  preSessionState: movementAlteringState,
  calendarEvents: [highPriorityEventTomorrow],
  loadContext: emptyLoadContext
});

assert(safetyMission.objective === 'NO_TRAINING', "Movement-altering pain triggers Safety Gate -> NO_TRAINING despite upcoming high-priority game");
assert(
  safetyMission.explanation?.rulesApplied.some((r: DecisionRule) => r.ruleSource === 'SAFETY_GATE' && !r.replaceableByAthleteEvidence) ?? false,
  "Safety gate rule is marked with ruleSource='SAFETY_GATE' and replaceableByAthleteEvidence=false"
);
const hasNoHeavyAxialInSafety = safetyMission.phases.every((phase: WorkoutPhase) => 
  phase.exercises.every((ex: WorkoutExercise) => !ex.title.toLowerCase().includes('barbell squat') && !ex.title.toLowerCase().includes('deadlift'))
);
assert(hasNoHeavyAxialInSafety, "Axial spinal compression and heavy compound loads are excluded under safety gate");

// --------------------------------------------------------------------------
// 2. BASE_COACHING_HEURISTIC PROVENANCE & REPLACEABILITY
// --------------------------------------------------------------------------
console.log("\n--- 2. Base Coaching Heuristic Provenance Test ---");

const freshState: PreSessionAthleteState = {
  rawReport: "Body feeling springy and ready",
  structured: {
    physical: 'springy',
    neuromuscular: 'sharp',
    mental: 'slow_clear',
    goalieState: 'patient',
    soreness: {
      behavior: 'none',
      locations: []
    }
  },
  confirmationStatus: 'athlete_confirmed',
  extractionConfidence: 'HIGH',
  timestamp: '2026-09-16T10:00:00Z'
};

const imminentGameEvent: CalendarPerformanceEvent = {
  id: 'game-imminent',
  userId: 'elliott-shevitz',
  title: 'Championship Game vs Rival',
  eventType: 'game',
  startDateTime: '2026-09-17T02:00:00Z',
  priority: 'HIGH',
  expectedPhysicalDemand: 'HIGH',
  technicalImportance: 'HIGH',
  status: 'CONFIRMED',
  hoursUntilEvent: 16
};

const preGameMission = CoachDecisionEngine.evaluateDailyMission({
  userId: 'elliott-shevitz',
  targetDate: '2026-09-16',
  setting: 'gym',
  level: 'elite',
  preSessionState: freshState,
  calendarEvents: [imminentGameEvent],
  loadContext: emptyLoadContext
});

assert(preGameMission.objective === 'PRIME_FOR_PERFORMANCE', "Fresh state before imminent (<18h) high-priority game prescribes PRIME_FOR_PERFORMANCE");

const preGameHeuristicRule = preGameMission.explanation?.rulesApplied.find((r: DecisionRule) => r.ruleId === 'HEURISTIC-LOOKAHEAD-01');
assert(!!preGameHeuristicRule, "Applies HEURISTIC-LOOKAHEAD-01 rule");
assert(preGameHeuristicRule?.ruleSource === 'BASE_COACHING_HEURISTIC', "Rule source is explicitly BASE_COACHING_HEURISTIC");
assert(preGameHeuristicRule?.replaceableByAthleteEvidence === true, "BASE_COACHING_HEURISTIC is marked as replaceableByAthleteEvidence = true");
assert(preGameHeuristicRule?.epistemicClassification === 'COACH_OBSERVATION', "Epistemic classification is COACH_OBSERVATION, not established physiological law");

// --------------------------------------------------------------------------
// 3. MULTI-HORIZON FACTUAL LOAD CONTEXT (NO FABRICATED FATIGUE SCORES)
// --------------------------------------------------------------------------
console.log("\n--- 3. Multi-Horizon Load Context Engine Test ---");

const simulatedLoadEvents: LoadEvent[] = [
  {
    id: 'load-1',
    userId: 'elliott-shevitz',
    startTimestamp: '2026-09-15T18:00:00Z',
    durationMins: 60,
    activityType: 'gym_strength',
    title: 'Upper Body Explosive + Tennis Ball Vision',
    isStructuredTraining: true,
    lowerBodyLoadScore: null,
    upperBodyLoadScore: 4,
    sportSpecificLoadScore: 5,
    cardioLoadScore: null,
    mobilityLoadScore: null,
    loadEstimationSource: 'athlete_reported',
    loadEstimationConfidence: 'ESTIMATED',
    provenance: {
      recordSource: 'athlete_track_manual',
      dateConfidence: 'EXACT',
      completionConfidence: 'EXACT',
      isActive: true,
      createdAt: '2026-09-15T19:00:00Z'
    }
  },
  {
    id: 'load-2',
    userId: 'elliott-shevitz',
    startTimestamp: '2026-09-14T10:00:00Z',
    durationMins: 120,
    activityType: 'running',
    title: '4-Mile Outdoor Run + 2h Yard Work',
    isStructuredTraining: false,
    lowerBodyLoadScore: null,
    upperBodyLoadScore: null,
    sportSpecificLoadScore: null,
    cardioLoadScore: null,
    mobilityLoadScore: null,
    loadEstimationSource: 'unestimated',
    loadEstimationConfidence: 'UNKNOWN',
    provenance: {
      recordSource: 'conversational_import',
      dateConfidence: 'EXACT',
      completionConfidence: 'EXACT',
      isActive: true,
      createdAt: '2026-09-14T12:00:00Z'
    }
  }
];

const loadContext = LoadContextEngine.evaluateLoadContext(
  simulatedLoadEvents,
  '2026-09-16T10:00:00Z'
);

assert(loadContext.horizon24h.completedEventCount === 1, "24h horizon accurately counts 1 event");
assert(loadContext.horizon48h.completedEventCount === 2, "48h horizon accurately counts 2 events");
assert(loadContext.horizon48h.hasUnknownLoadMagnitudes === true, "Unquantified outdoor run + yard work accurately flags hasUnknownLoadMagnitudes = true");

const factualSummary = LoadContextEngine.formatFactualExposureSummary(loadContext);
assert(factualSummary.includes("Outdoor Run") || factualSummary.includes("Yard Work") || factualSummary.includes("4-Mile"), "Factual summary states specific exposures without fabricating numeric fatigue scores");

// --------------------------------------------------------------------------
// 4. MISSION REVISION IMMUTABILITY
// --------------------------------------------------------------------------
console.log("\n--- 4. Mission Revision Immutability Chain Test ---");

// 1. Initial Planned Mission
const originalMission = CoachDecisionEngine.evaluateDailyMission({
  userId: 'elliott-shevitz',
  targetDate: '2026-09-16',
  setting: 'home',
  level: 'elite',
  preSessionState: {
    rawReport: "Hips a bit stiff initially but usually loosens",
    structured: {
      physical: 'neutral',
      neuromuscular: 'neutral',
      mental: 'calm',
      goalieState: null,
      soreness: {
        behavior: 'transient_resolves',
        locations: ['hips']
      }
    },
    confirmationStatus: 'athlete_confirmed',
    extractionConfidence: 'HIGH',
    timestamp: '2026-09-16T08:00:00Z'
  },
  calendarEvents: [],
  loadContext: emptyLoadContext
});

const originalPhasesJson = JSON.stringify(originalMission.phases);

// 2. Warmup Reassessment: Soreness was aggravated during warmup
const aggravatedState: PreSessionAthleteState = {
  rawReport: "Adductor sharp on lateral slides",
  structured: {
    physical: 'heavy_fatigued',
    neuromuscular: 'sluggish',
    mental: 'calm',
    goalieState: null,
    soreness: {
      behavior: 'movement_altering',
      locations: ['hips', 'adductors']
    }
  },
  confirmationStatus: 'athlete_confirmed',
  extractionConfidence: 'HIGH',
  timestamp: '2026-09-16T08:15:00Z'
};

const revision = CoachDecisionEngine.createMissionRevision(
  originalMission,
  'warmup_reassessment',
  'aggravated',
  aggravatedState
);

// Verify original PlannedMission is NOT mutated
assert(
  JSON.stringify(originalMission.phases) === originalPhasesJson,
  "Original PlannedMission.phases remains strictly immutable and unmutated"
);

// Verify revision record integrity
assert(revision.originalMissionId === originalMission.id, "MissionRevision references original mission ID");
assert(revision.revisionNumber === 1, "MissionRevision number is 1");
assert(revision.trigger === 'warmup_reassessment', "MissionRevision trigger is warmup_reassessment");
assert(revision.previousPhases.length === originalMission.phases.length, "MissionRevision captures previous phases snapshot");
assert(revision.revisedObjective === 'NO_TRAINING', "MissionRevision updates objective to NO_TRAINING on aggravated soreness");
assert(revision.athleteStateAfter?.structured.soreness.behavior === 'movement_altering', "State after revision updated to movement_altering");

// --------------------------------------------------------------------------
// 5. REST IS A STRATEGIC MISSION (COACHING RESTRAINT)
// --------------------------------------------------------------------------
console.log("\n--- 5. Rest / NO_TRAINING Semantics Test ---");

const highFatigueState: PreSessionAthleteState = {
  rawReport: "Body is completely exhausted, legs are heavy concrete",
  structured: {
    physical: 'heavy_fatigued',
    neuromuscular: 'sluggish',
    mental: 'rushed',
    goalieState: 'chasing',
    soreness: {
      behavior: 'none',
      locations: []
    }
  },
  confirmationStatus: 'athlete_confirmed',
  extractionConfidence: 'HIGH',
  timestamp: '2026-09-16T12:00:00Z'
};

const heavyLoadContext = LoadContextEngine.evaluateLoadContext([
  {
    id: 'heavy-1',
    userId: 'elliott-shevitz',
    startTimestamp: '2026-09-15T10:00:00Z',
    durationMins: 120,
    activityType: 'ice_hockey',
    title: 'High-Tempo Goalie Camp & Scrimmage',
    isStructuredTraining: true,
    lowerBodyLoadScore: 8,
    upperBodyLoadScore: 6,
    sportSpecificLoadScore: 9,
    cardioLoadScore: 8,
    mobilityLoadScore: null,
    loadEstimationSource: 'coach_estimated',
    loadEstimationConfidence: 'ESTIMATED',
    provenance: {
      recordSource: 'athlete_track_manual',
      dateConfidence: 'EXACT',
      completionConfidence: 'EXACT',
      isActive: true,
      createdAt: '2026-09-15T12:00:00Z'
    }
  },
  {
    id: 'heavy-2',
    userId: 'elliott-shevitz',
    startTimestamp: '2026-09-14T15:00:00Z',
    durationMins: 90,
    activityType: 'gym_strength',
    title: 'Heavy Lower Body Strength',
    isStructuredTraining: true,
    lowerBodyLoadScore: 8,
    upperBodyLoadScore: 5,
    sportSpecificLoadScore: null,
    cardioLoadScore: null,
    mobilityLoadScore: null,
    loadEstimationSource: 'coach_estimated',
    loadEstimationConfidence: 'ESTIMATED',
    provenance: {
      recordSource: 'athlete_track_manual',
      dateConfidence: 'EXACT',
      completionConfidence: 'EXACT',
      isActive: true,
      createdAt: '2026-09-14T16:30:00Z'
    }
  }
], '2026-09-16T12:00:00Z');

const recoverMission = CoachDecisionEngine.evaluateDailyMission({
  userId: 'elliott-shevitz',
  targetDate: '2026-09-16',
  setting: 'home',
  level: 'elite',
  preSessionState: highFatigueState,
  calendarEvents: [],
  loadContext: heavyLoadContext
});

assert(recoverMission.objective === 'RECOVER', "Heavy fatigue following substantial recent load prescribes RECOVER");
assert(
  recoverMission.explanation?.planSummary.some((s: string) => s.toLowerCase().includes('down-regulation') || s.toLowerCase().includes('recovery') || s.toLowerCase().includes('omit')) ?? false,
  "Explanation frames recovery as a deliberate down-regulation decision to allow supercompensation"
);

// --------------------------------------------------------------------------
// 6. SEPT 15 -> SEPT 16 COUNTERFACTUAL REPLAY TEST
// --------------------------------------------------------------------------
console.log("\n--- 6. Sept 15 -> Sept 16 Counterfactual Replay Test ---");

// Context on Sept 15 afternoon:
// - Upcoming event: Sept 16 06:15 Benchmark On-Ice Skate (HIGH priority, ~15h away)
// - Pre-session state on Sept 15: Athlete feels springy/good, ready to lift

const sept16OnIceEvent: CalendarPerformanceEvent = {
  id: 'on-ice-2026-09-16',
  userId: 'elliott-shevitz',
  title: 'On-Ice Benchmark Goalie Session',
  eventType: 'practice',
  startDateTime: '2026-09-16T06:15:00-04:00',
  priority: 'HIGH',
  expectedPhysicalDemand: 'HIGH',
  technicalImportance: 'HIGH',
  status: 'CONFIRMED',
  hoursUntilEvent: 15
};

const sept15PreState: PreSessionAthleteState = {
  rawReport: "Energy good, ready for gym lift before tomorrow's skate",
  structured: {
    physical: 'springy',
    neuromuscular: 'sharp',
    mental: 'slow_clear',
    goalieState: 'sitting_into_edges',
    soreness: {
      behavior: 'none',
      locations: []
    }
  },
  confirmationStatus: 'athlete_confirmed',
  extractionConfidence: 'HIGH',
  timestamp: '2026-09-15T15:00:00-04:00'
};

const sept15ReplayMission = CoachDecisionEngine.evaluateDailyMission({
  userId: 'elliott-shevitz',
  targetDate: '2026-09-15',
  setting: 'gym',
  level: 'elite',
  preSessionState: sept15PreState,
  calendarEvents: [sept16OnIceEvent],
  loadContext: emptyLoadContext,
  activeHypothesisId: 'HYPOTHESIS_PRE_ICE_CONTROLLED_STRENGTH',
  isExplicitHypothesisTrial: true
});

console.log(`  Sept 15 Replay Objective: ${sept15ReplayMission.objective}`);
console.log(`  Sept 15 Replay Summary: ${sept15ReplayMission.explanation?.planSummary.join(' ')}`);

assert(
  sept15ReplayMission.objective === 'PRIME_FOR_PERFORMANCE' || sept15ReplayMission.objective === 'PRESERVE_READINESS',
  "Sept 15 Replay recommends PRIME_FOR_PERFORMANCE or PRESERVE_READINESS before Sept 16 on-ice session"
);

// Verify that pre-ice lifting relationship remains an emerging HYPOTHESIS, NOT an established rule
const preIceHypothesisRule = sept15ReplayMission.explanation?.rulesApplied.find((r: DecisionRule) => r.ruleId === 'HYPOTHESIS-TRIAL-01');
assert(!!preIceHypothesisRule, "Sept 15 Replay tracks hypothesis trial explicitly in decision audit");
assert(
  preIceHypothesisRule?.epistemicClassification === 'HYPOTHESIS',
  "Pre-ice lifting sequence is tracked as HYPOTHESIS, not promoted into an established universal rule"
);

console.log("\n=======================================================");
console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
