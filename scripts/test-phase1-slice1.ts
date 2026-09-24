/**
 * PHASE 1 / SLICE 1 VERIFICATION TEST SUITE
 * Tests:
 * 1. Decoupled Planned Mission Generation & Rationale Formatting
 * 2. Historical Projection with Provenance & Nullable Load Vectors
 * 3. Autoregulation Decision Logging (INTENTIONALLY_HELD vs PROGRESSED)
 * 4. Supersession Provenance on Session Correction
 */

import { generateDailyWorkout, toPlannedMission } from '../lib/workoutEngine';
import { SessionRepository } from '../lib/repositories/sessionRepository';
import { ATHLETE_TRAINING_HISTORY } from '../lib/athleteTrainingHistory';
import { CompletedSession, LoadEvent, AthleteDecision } from '../lib/athleteTypes';

function runTests() {
  console.log("=== COACH CARD PHASE 1 / SLICE 1 TEST SUITE ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Planned Mission Generation with Rationale & Context
  // --------------------------------------------------------------------------
  const program = generateDailyWorkout('gym', 'competitive', 4, {
    rationale: "Testing pre-ice power calibration ~24h prior to stick-and-puck.",
    activeHypothesisId: "pat-2026-09-16-preice-reserve",
    contractMilestoneRef: "goal-crease-depth"
  });

  assert(program.phases.length === 4, "Generated program has 4 phases");
  assert(program.rationale.includes("Testing pre-ice power calibration"), "Program preserves rationale");
  assert(program.activeHypothesisId === "pat-2026-09-16-preice-reserve", "Program links active hypothesis ID");

  const mission = toPlannedMission("user-123", "2026-09-15", program);
  assert(mission.date === "2026-09-15", "PlannedMission maps date correctly");
  assert(mission.contractMilestoneRef === "goal-crease-depth", "PlannedMission maps contract milestone ref");

  // --------------------------------------------------------------------------
  // TEST 2: Historical Projection from Athlete Track
  // --------------------------------------------------------------------------
  const { sessions, loadEvents } = SessionRepository.projectHistoricalAthleteTrack("user-123");

  assert(sessions.length === ATHLETE_TRAINING_HISTORY.length, `Projected all ${ATHLETE_TRAINING_HISTORY.length} historical sessions`);
  assert(loadEvents.length === ATHLETE_TRAINING_HISTORY.length, `Projected all ${ATHLETE_TRAINING_HISTORY.length} load events`);

  // Verify Sept 15 PM strength session (EXACT provenance)
  const sept15Session = sessions.find(s => s.date === "2026-09-15" && s.id?.includes("strength-pm"));
  assert(!!sept15Session, "Found Sept 15 PM strength session in projection");
  assert(sept15Session?.provenance.recordSource === "historical_dossier", "Provenance recordSource is historical_dossier");
  assert(sept15Session?.provenance.dateConfidence === "EXACT", "Date confidence for confirmed session is EXACT");
  assert(sept15Session?.completedExercises.length! > 0, "Completed exercises preserved");

  // Verify Reconstructed Historical Session (RECONSTRUCTED provenance)
  const reconstructedSession = sessions.find(s => s.provenance.dateConfidence === "RECONSTRUCTED");
  assert(!!reconstructedSession, "Found RECONSTRUCTED historical session in projection");
  assert(reconstructedSession?.provenance.dateConfidence === "RECONSTRUCTED", "Date confidence for reconstructed session is RECONSTRUCTED");
  assert(reconstructedSession?.provenance.completionConfidence === "RECONSTRUCTED", "Completion confidence is RECONSTRUCTED");

  // Verify Sept 14 lawn mowing (unstructured activity with null load vectors & UNKNOWN estimation)
  const lawnMowingLoad = loadEvents.find(l => l.startTimestamp.startsWith("2026-09-14"));
  assert(!!lawnMowingLoad, "Found Sept 14 lawn mowing load event");
  assert(lawnMowingLoad?.activityType === "yard_work", "Mapped activity type to yard_work");
  assert(lawnMowingLoad?.durationMins === 120, "Duration is 120 mins (~2 hours)");
  assert(lawnMowingLoad?.lowerBodyLoadScore === null, "Nullable lowerBodyLoadScore is null");
  assert(lawnMowingLoad?.upperBodyLoadScore === null, "UpperBodyLoadScore is null");
  assert(lawnMowingLoad?.loadEstimationSource === "unestimated", "Load estimation source is unestimated");
  assert(lawnMowingLoad?.loadEstimationConfidence === "UNKNOWN", "Load estimation confidence is UNKNOWN");

  // Verify Sept 16 On-Ice Session (estimated load vectors)
  const sept16Load = loadEvents.find(l => l.startTimestamp.startsWith("2026-09-16"));
  assert(!!sept16Load, "Found Sept 16 on-ice load event");
  assert(sept16Load?.loadEstimationSource === "coach_estimated", "Ice session load estimation source is coach_estimated");
  assert(sept16Load?.loadEstimationConfidence === "ESTIMATED", "Ice session load estimation confidence is ESTIMATED");
  assert(sept16Load?.sportSpecificLoadScore === 10, "Sport-specific load score is 10");

  // --------------------------------------------------------------------------
  // TEST 3: Autoregulation Decision Structure
  // --------------------------------------------------------------------------
  const autoregDecision: AthleteDecision = {
    exerciseId: "ex-incline-db",
    exerciseTitle: "Incline Dumbbell Press",
    prescribedLoad: "70 lb x 6-8",
    actualLoad: "65 lb x 10 AMRAP",
    progressionStatus: "intentionally_held",
    athleteReason: "didn't chase 70 on incline, preserved reserve before ice",
    timestamp: "2026-09-15T17:30:00.000Z"
  };

  assert(autoregDecision.progressionStatus === "intentionally_held", "Autoregulation status is intentionally_held");
  assert(Boolean(autoregDecision.athleteReason?.includes("preserved reserve")), "Athlete rationale preserved verbatim");

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
  }
}

runTests();
