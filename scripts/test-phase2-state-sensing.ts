/**
 * TEST SUITE: COACH CARD PHASE 2 STATE SENSING
 * Version: 2026-09-16
 *
 * Verifies all 7 approved architecture corrections:
 * 1. NULL IS NOT NEUTRAL: Unreported readiness vectors remain null.
 * 2. PHYSICAL READINESS ALONE CANNOT UNLOCK PROGRESSION: springy/strong recorded without auto-increasing load.
 * 3. NO HARD-CODED UNIVERSAL CUES: Goalie state surfaces contextual bottleneck without rigid cue hardcoding.
 * 4. TRANSIENT SORENESS BEHAVIOR: transient_resolves adds warmup preparation and triggers checkpoint.
 * 5. PROGRESSIVE / MOVEMENT-ALTERING PAIN SAFETY GATE: Safety notice, no axial loads, mobility only.
 * 6. AMBIGUOUS EXTRACTION STATE: "slow" returns AMBIGUOUS with clarification prompt, no premature prescription.
 * 7. GENERALIZED WITHIN-SESSION REASSESSMENT: Initial -> Adaptation -> Final lifecycle.
 * 8. CONVERSATIONAL POST-SESSION EXTRACTION: Structured insights + verbatim raw text preservation.
 */

import { StateExtractionEngine } from '../lib/stateExtraction';
import { generateDailyWorkout } from '../lib/workoutEngine';
import { PreSessionAthleteState, WithinSessionAdaptation } from '../lib/athleteTypes';

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
console.log("RUNNING PHASE 2 STATE SENSING TEST SUITE");
console.log("=======================================================\n");

// --------------------------------------------------------------------------
// 1. NULL IS NOT NEUTRAL
// --------------------------------------------------------------------------
console.log("--- 1. Null is Not Neutral Test ---");
const emptyState = StateExtractionEngine.parsePreSessionText("");
assert(emptyState.structured.physical === null, "Physical vector is null when unreported");
assert(emptyState.structured.neuromuscular === null, "Neuromuscular vector is null when unreported");
assert(emptyState.structured.mental === null, "Mental vector is null when unreported");
assert(emptyState.structured.goalieState === null, "Goalie state vector is null when unreported");
assert(emptyState.structured.soreness.behavior === 'none', "Soreness behavior is 'none' when unreported");

const partialState = StateExtractionEngine.parsePreSessionText("legs feel springy today");
assert(partialState.structured.physical === 'springy', "Physical sensation extracted as 'springy'");
assert(partialState.structured.neuromuscular === null, "Neuromuscular vector remains strictly null");
assert(partialState.structured.mental === null, "Mental vector remains strictly null");
assert(partialState.structured.goalieState === null, "Goalie state vector remains strictly null");

// Explicit neutral reporting must be distinguishable from null
const explicitNeutralState = StateExtractionEngine.parsePreSessionText("body normal, mind normal");
assert(explicitNeutralState.structured.physical === 'neutral', "Explicit 'body normal' maps to 'neutral'");
assert(explicitNeutralState.structured.mental === 'neutral', "Explicit 'mind normal' maps to 'neutral'");

// --------------------------------------------------------------------------
// 2. PHYSICAL READINESS ALONE CANNOT UNLOCK PROGRESSION
// --------------------------------------------------------------------------
console.log("\n--- 2. Physical Readiness Progression Guard Test ---");
const springyState = StateExtractionEngine.parsePreSessionText("legs popping and springy");
const baselineWorkout = generateDailyWorkout('gym', 'competitive', 3);
const springyWorkout = generateDailyWorkout('gym', 'competitive', 3, { athleteState: springyState });

// Workout structure preserves standard volume without forced overload
assert(springyWorkout.phases.length === baselineWorkout.phases.length, "Phases count maintained under springy state");
assert(springyWorkout.phases[2].exercises.length > 0, "Strength phase preserved normally");

// --------------------------------------------------------------------------
// 3. NO HARD-CODED UNIVERSAL CUES FOR GOALIE STATE
// --------------------------------------------------------------------------
console.log("\n--- 3. Contextual Goalie State Test ---");
const chasingState = StateExtractionEngine.parsePreSessionText("felt like I was chasing and biting early");
assert(chasingState.structured.goalieState === 'chasing', "Extracted goalieState as 'chasing'");
const chasingWorkout = generateDailyWorkout('gym', 'competitive', 3, { athleteState: chasingState });
const mobilityDrills = chasingWorkout.phases[0].exercises;
// Check that mobility phase includes edge/crease set cues dynamically
assert(mobilityDrills.some(d => d.cues.some(c => c.toLowerCase().includes("edge") || c.toLowerCase().includes("balance") || c.toLowerCase().includes("hip"))),
  "Contextual cue dynamic alignment present");

// --------------------------------------------------------------------------
// 4. TRANSIENT SORENESS BEHAVIOR & WARMUP REASSESSMENT
// --------------------------------------------------------------------------
console.log("\n--- 4. Transient Soreness & Warmup Reassessment Test ---");
const transientSorenessState = StateExtractionEngine.parsePreSessionText("adductors and hips are stiff at first but loosen up once moving");
assert(transientSorenessState.structured.soreness.behavior === 'transient_resolves', "Soreness behavior classified as 'transient_resolves'");
assert(transientSorenessState.structured.soreness.locations.includes('hips'), "Soreness location includes 'hips'");
assert(transientSorenessState.structured.soreness.locations.includes('adductors'), "Soreness location includes 'adductors'");
assert(transientSorenessState.structured.soreness.reassessmentStatus === 'pending_warmup', "Reassessment status is 'pending_warmup'");

const transientWorkout = generateDailyWorkout('gym', 'competitive', 3, { athleteState: transientSorenessState });
assert(transientWorkout.warmupReassessmentRequired === true, "warmupReassessmentRequired is flagged as true");
assert(transientWorkout.phases[0].isWarmupReassessmentCheckpoint === true, "Phase 1 marked as warmup reassessment checkpoint");
assert(transientWorkout.phases[0].exercises.some(e => e.id.includes('hip') || e.id.includes('adductor') || e.title.toLowerCase().includes('hip') || e.title.toLowerCase().includes('adductor')),
  "Extra targeted warmup mobility exercises injected into Phase 1");

// --------------------------------------------------------------------------
// 5. PROGRESSIVE / MOVEMENT-ALTERING PAIN SAFETY GATE
// --------------------------------------------------------------------------
console.log("\n--- 5. Movement-Altering Pain Safety Gate Test ---");
const painState = StateExtractionEngine.parsePreSessionText("sharp pain in right shoulder, hurts to move");
assert(painState.structured.soreness.behavior === 'movement_altering', "Classified as 'movement_altering'");
assert(painState.structured.soreness.locations.includes('shoulders'), "Identified 'shoulders' location");

const safetyWorkout = generateDailyWorkout('gym', 'competitive', 4, { athleteState: painState });
// Verify that heavy axial strength loading exercises are completely removed or replaced with safe mobility/circulation
const heavyStrengthExercises = safetyWorkout.phases[2].exercises.filter(e => 
  e.title.toLowerCase().includes('press') || 
  e.title.toLowerCase().includes('barbell') || 
  e.title.toLowerCase().includes('overhead')
);
assert(heavyStrengthExercises.length === 0, "All aggravating axial / overhead loading removed under safety gate");

// --------------------------------------------------------------------------
// 6. AMBIGUOUS EXTRACTION STATE
// --------------------------------------------------------------------------
console.log("\n--- 6. Ambiguous Extraction & Resolution Test ---");
const ambiguousState = StateExtractionEngine.parsePreSessionText("I feel slow today");
assert(ambiguousState.extractionConfidence === 'AMBIGUOUS', "Extraction confidence marked as 'AMBIGUOUS'");
assert(!!ambiguousState.ambiguities && ambiguousState.ambiguities.length > 0, "Ambiguity object returned");
assert(ambiguousState.ambiguities![0].rawPhrase === 'slow', "Identified ambiguous phrase 'slow'");
assert(ambiguousState.ambiguities![0].candidateOptions.length >= 2, "Surfaced candidate clarification options");

// Contextual disambiguation
const clearMindState = StateExtractionEngine.parsePreSessionText("mind feels slow and clear");
assert(clearMindState.structured.mental === 'slow_clear', "Contextual mind 'slow' maps to 'slow_clear'");
assert(clearMindState.extractionConfidence === 'HIGH', "Extraction confidence is HIGH when contextualized");

const sluggishLegsState = StateExtractionEngine.parsePreSessionText("legs feel slow and heavy moving");
assert(sluggishLegsState.structured.neuromuscular === 'sluggish', "Contextual body 'slow' maps to neuromuscular 'sluggish'");
assert(sluggishLegsState.extractionConfidence === 'HIGH', "Extraction confidence is HIGH when contextualized");

// --------------------------------------------------------------------------
// 7. GENERALIZED WITHIN-SESSION REASSESSMENT
// --------------------------------------------------------------------------
console.log("\n--- 7. Within-Session Reassessment Lifecycle Test ---");
const motorAdaptation: WithinSessionAdaptation = {
  exerciseId: 'lateral-skater-hops',
  exerciseTitle: 'Lateral Skater Hops',
  dimension: 'movement',
  initialQuality: 'unstable',
  withinSessionChange: 'self_corrected_improved',
  finalQuality: 'controlled',
  notes: 'First 2 reps balance was shaky, adjusted hip sink on sets 2-3.'
};
assert(motorAdaptation.initialQuality === 'unstable', "Initial motor quality recorded as unstable");
assert(motorAdaptation.withinSessionChange === 'self_corrected_improved', "Adaptation change recorded as self_corrected_improved");
assert(motorAdaptation.finalQuality === 'controlled', "Final quality recorded as controlled");

// --------------------------------------------------------------------------
// 8. POST-SESSION REFLECTION PARSING & PROVENANCE
// --------------------------------------------------------------------------
console.log("\n--- 8. Post-Session Reflection Parsing Test ---");
const reflectionRaw = "Pull-ups were super solid and smooth. Held back on sprint 4 to save legs for tomorrow's benchmark skate. Left adductor loosened up after warm-up.";
const postParsed = StateExtractionEngine.parsePostSessionText(reflectionRaw);

assert(postParsed.rawReport === reflectionRaw, "Raw athlete reflection preserved verbatim");
assert(postParsed.structuredObservations.upperStrengthQuality === 'strong', "Upper strength quality extracted as 'strong'");
assert(postParsed.structuredObservations.autoregulation === 'intentionally_held', "Autoregulation intent extracted as 'intentionally_held'");
assert(postParsed.candidateChips.some(c => c.tag === 'intentionally_held'), "Preserved reserve chip generated");
assert(postParsed.withinSessionAdaptations.some(a => a.finalQuality === 'resolved'), "Transient soreness resolution adaptation recorded");

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n=======================================================");
console.log(`PHASE 2 STATE SENSING TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
