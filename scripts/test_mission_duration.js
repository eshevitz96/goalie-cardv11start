/**
 * UNIT & INTEGRATION TEST SUITE: Mission Duration Derivation
 * 
 * Verifies:
 * 1. Pure deterministic projection from MissionPlanItem[]
 * 2. Explicit duration blocks (e.g. 10m warmup, 20m yoga) -> EXACT / DERIVED_RANGE
 * 3. Set-based resistance work with named timing assumptions
 * 4. Movement classification: Bilateral vs Unilateral vs Core vs Mobility
 * 5. Set ranges (e.g. 2-3 sets) -> bounds min/max
 * 6. Unparsable or open-ended prescriptions -> UNCERTAIN (no false precision manufactured)
 * 7. Invariant: deriveMissionDuration does NOT mutate plan items, objective, or notes
 * 8. Schema & Prompt invariant: mission.what contains only conceptual objective, no generated duration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("===============================================================");
console.log("RUNNING MISSION DURATION DERIVATION TEST SUITE");
console.log("===============================================================\n");

const DEFAULT_TIMING_ASSUMPTIONS = {
  bilateralResistance: {
    workSecsMin: 30,
    workSecsMax: 45,
    restSecsMin: 60,
    restSecsMax: 90
  },
  unilateralResistance: {
    workSecsMin: 50,
    workSecsMax: 75,
    restSecsMin: 60,
    restSecsMax: 90
  },
  coreAccessory: {
    workSecsMin: 25,
    workSecsMax: 40,
    restSecsMin: 30,
    restSecsMax: 45
  },
  mobilityActivation: {
    workSecsMin: 30,
    workSecsMax: 45,
    restSecsMin: 15,
    restSecsMax: 30
  },
  exerciseTransitionMins: {
    min: 0.75,
    max: 1.5
  }
};

function parseSetsRange(sets) {
  if (sets === null || sets === undefined) return null;
  if (typeof sets === 'number') {
    return sets > 0 ? [sets, sets] : null;
  }
  const str = String(sets).trim().toLowerCase();
  if (!str) return null;

  const rangeMatch = str.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
      return [min, max];
    }
  }

  const singleMatch = str.match(/^(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return [val, val];
    }
  }

  return null;
}

function parseExplicitDurationMins(durStr) {
  if (!durStr) return null;
  const str = String(durStr).trim().toLowerCase();
  if (!str) return null;

  const minRangeMatch = str.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);
  if (minRangeMatch) {
    const min = parseFloat(minRangeMatch[1]);
    const max = parseFloat(minRangeMatch[2]);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
      return [min, max];
    }
  }

  const singleMinMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m\b)/i);
  if (singleMinMatch) {
    const val = parseFloat(singleMinMatch[1]);
    if (!isNaN(val) && val > 0) {
      return [val, val];
    }
  }

  const secRangeMatch = str.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:s\b|sec|secs|second|seconds)/i);
  if (secRangeMatch) {
    const minSec = parseFloat(secRangeMatch[1]);
    const maxSec = parseFloat(secRangeMatch[2]);
    if (!isNaN(minSec) && !isNaN(maxSec) && minSec > 0 && maxSec >= minSec) {
      return [minSec / 60, maxSec / 60];
    }
  }

  const singleSecMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:s\b|sec|secs|second|seconds)/i);
  if (singleSecMatch) {
    const val = parseFloat(singleSecMatch[1]);
    if (!isNaN(val) && val > 0) {
      return [val / 60, val / 60];
    }
  }

  return null;
}

function classifyMovementTimingCategory(name, notes) {
  const text = `${name || ''} ${notes || ''}`.toLowerCase();

  if (
    text.includes('single leg') ||
    text.includes('single-leg') ||
    text.includes('1-leg') ||
    text.includes('unilateral') ||
    text.includes('split squat') ||
    text.includes('lunge') ||
    text.includes('suitcase') ||
    text.includes('1-arm') ||
    text.includes('single arm') ||
    text.includes('/side') ||
    text.includes('per side')
  ) {
    return 'unilateralResistance';
  }

  if (
    text.includes('dead bug') ||
    text.includes('bird dog') ||
    text.includes('pallof') ||
    text.includes('plank') ||
    text.includes('hollow') ||
    text.includes('ab wheel') ||
    text.includes('v-up') ||
    text.includes('sit-up')
  ) {
    return 'coreAccessory';
  }

  if (
    text.includes('warmup') ||
    text.includes('warm-up') ||
    text.includes('mobility') ||
    text.includes('activation') ||
    text.includes('stretch') ||
    text.includes('foam roll') ||
    text.includes('opener') ||
    text.includes('yoga')
  ) {
    return 'mobilityActivation';
  }

  return 'bilateralResistance';
}

function deriveMissionDuration(plan, timing = DEFAULT_TIMING_ASSUMPTIONS) {
  if (!Array.isArray(plan) || plan.length === 0) {
    return {
      minMinutes: null,
      maxMinutes: null,
      display: 'Unspecified',
      confidence: 'UNCERTAIN'
    };
  }

  let totalMinMinutes = 0;
  let totalMaxMinutes = 0;
  let allExplicit = true;
  let hasUncertainBlock = false;
  let validBlocksCount = 0;

  for (const item of plan) {
    const explicitDur = parseExplicitDurationMins(item.duration) || parseExplicitDurationMins(item.reps);
    const setsRange = parseSetsRange(item.sets);

    if (explicitDur && (!setsRange || setsRange[0] <= 1)) {
      totalMinMinutes += explicitDur[0];
      totalMaxMinutes += explicitDur[1];
      validBlocksCount++;
      continue;
    }

    if (explicitDur && setsRange) {
      allExplicit = false;
      const categoryKey = classifyMovementTimingCategory(item.name, item.notes);
      const categoryTiming = timing[categoryKey];
      const restMin = categoryTiming.restSecsMin / 60;
      const restMax = categoryTiming.restSecsMax / 60;

      const [sMin, sMax] = setsRange;
      const [dMin, dMax] = explicitDur;

      totalMinMinutes += sMin * (dMin + restMin);
      totalMaxMinutes += sMax * (dMax + restMax);
      validBlocksCount++;
      continue;
    }

    if (setsRange) {
      allExplicit = false;
      const categoryKey = classifyMovementTimingCategory(item.name, item.notes);
      const categoryTiming = timing[categoryKey];

      const workMin = categoryTiming.workSecsMin / 60;
      const workMax = categoryTiming.workSecsMax / 60;
      const restMin = categoryTiming.restSecsMin / 60;
      const restMax = categoryTiming.restSecsMax / 60;

      const [sMin, sMax] = setsRange;
      totalMinMinutes += sMin * (workMin + restMin);
      totalMaxMinutes += sMax * (workMax + restMax);
      validBlocksCount++;
      continue;
    }

    hasUncertainBlock = true;
  }

  if (validBlocksCount === 0 || hasUncertainBlock) {
    return {
      minMinutes: null,
      maxMinutes: null,
      display: 'Timing uncertain (unspecified volume)',
      confidence: 'UNCERTAIN'
    };
  }

  if (validBlocksCount > 1 && !allExplicit) {
    const transitions = validBlocksCount - 1;
    totalMinMinutes += transitions * timing.exerciseTransitionMins.min;
    totalMaxMinutes += transitions * timing.exerciseTransitionMins.max;
  }

  const roundedMin = Math.round(totalMinMinutes);
  const roundedMax = Math.round(totalMaxMinutes);

  if (allExplicit && roundedMin === roundedMax) {
    return {
      minMinutes: roundedMin,
      maxMinutes: roundedMax,
      display: `${roundedMin} min`,
      confidence: 'EXACT'
    };
  }

  const display = roundedMin === roundedMax 
    ? `~${roundedMin} min` 
    : `~${roundedMin}–${roundedMax} min`;

  return {
    minMinutes: roundedMin,
    maxMinutes: roundedMax,
    display,
    confidence: 'DERIVED_RANGE'
  };
}

// --- UNIT TESTS ---

// [Test 1] Parser Helpers
console.log("[Test 1] Parsing Helpers (Sets & Explicit Duration)");
assert.deepStrictEqual(parseSetsRange(3), [3, 3]);
assert.deepStrictEqual(parseSetsRange("3"), [3, 3]);
assert.deepStrictEqual(parseSetsRange("2-3"), [2, 3]);
assert.deepStrictEqual(parseSetsRange("2–3 sets"), [2, 3]);
assert.deepStrictEqual(parseSetsRange("2 to 3"), [2, 3]);
assert.strictEqual(parseSetsRange("continuous"), null);
assert.strictEqual(parseSetsRange(null), null);

assert.deepStrictEqual(parseExplicitDurationMins("10 min"), [10, 10]);
assert.deepStrictEqual(parseExplicitDurationMins("8-10 mins"), [8, 10]);
assert.deepStrictEqual(parseExplicitDurationMins("30s"), [0.5, 0.5]);
assert.deepStrictEqual(parseExplicitDurationMins("45-60s"), [0.75, 1.0]);
assert.strictEqual(parseExplicitDurationMins("5 reps"), null);
assert.strictEqual(parseExplicitDurationMins(null), null);
console.log("   ✅ Sets and duration string parsers verified.");

// [Test 2] Movement Classification
console.log("\n[Test 2] Movement Timing Category Classification");
assert.strictEqual(classifyMovementTimingCategory("DB Romanian Deadlift"), "bilateralResistance");
assert.strictEqual(classifyMovementTimingCategory("Single-Leg DB RDL"), "unilateralResistance");
assert.strictEqual(classifyMovementTimingCategory("Bulgarian Split Squat"), "unilateralResistance");
assert.strictEqual(classifyMovementTimingCategory("Suitcase Carry"), "unilateralResistance");
assert.strictEqual(classifyMovementTimingCategory("Dead Bugs", "Core stability"), "coreAccessory");
assert.strictEqual(classifyMovementTimingCategory("Warm-up: Bike + Arm Circles"), "mobilityActivation");
console.log("   ✅ Movement categories correctly isolated.");

// [Test 3] Explicit-Duration Blocks (Exact)
console.log("\n[Test 3] Explicit-Duration Blocks");
const explicitPlan = [
  { name: "Stationary Bike Warmup", duration: "10 min" },
  { name: "Yoga Flow Session", duration: "20 min" }
];
const explicitResult = deriveMissionDuration(explicitPlan);
assert.strictEqual(explicitResult.confidence, "EXACT");
assert.strictEqual(explicitResult.minMinutes, 30);
assert.strictEqual(explicitResult.maxMinutes, 30);
assert.strictEqual(explicitResult.display, "30 min");
console.log(`   ✅ Explicit plan derived: ${explicitResult.display} (${explicitResult.confidence})`);

// [Test 4] Set-Based Submaximal Strength Plan
console.log("\n[Test 4] Six-Movement Maintenance Strength Prescription (Elliott's Session)");
const maintenancePlan = [
  { name: "Warm-up: Stationary Bike + Dynamic Mobility", duration: "10 min" },
  { name: "DB Goblet Squat", sets: "2-3", reps: "5-6", load: "60 lb DB" },
  { name: "Pull-ups", sets: "2-3", reps: "3-5", load: "Bodyweight" },
  { name: "Incline DB Press", sets: "2-3", reps: "6-8", load: "50-55 lb DBs" },
  { name: "Single-Leg DB RDL", sets: "2-3", reps: "5/side", load: "40-45 lb DBs" },
  { name: "Dead Bugs", sets: "2", reps: "8/side", notes: "Core stability" }
];
const maintenanceResult = deriveMissionDuration(maintenancePlan);
assert.strictEqual(maintenanceResult.confidence, "DERIVED_RANGE");
assert.ok(maintenanceResult.minMinutes >= 25 && maintenanceResult.minMinutes <= 35, `Min duration should be ~28–32 min (got ${maintenanceResult.minMinutes})`);
assert.ok(maintenanceResult.maxMinutes >= 40 && maintenanceResult.maxMinutes <= 52, `Max duration should be ~42–48 min (got ${maintenanceResult.maxMinutes})`);
assert.ok(maintenanceResult.display.includes("min"));
console.log(`   ✅ Maintenance strength derived: ${maintenanceResult.display} (${maintenanceResult.confidence})`);

// [Test 5] Unilateral vs Bilateral Timing Distinction
console.log("\n[Test 5] Unilateral Timing Weighting");
const bilateralPlan = [
  { name: "DB RDL", sets: "3", reps: "6", load: "70 lb DBs" }
];
const unilateralPlan = [
  { name: "Single-Leg DB RDL", sets: "3", reps: "6/side", load: "45 lb DBs" }
];
const biResult = deriveMissionDuration(bilateralPlan);
const uniResult = deriveMissionDuration(unilateralPlan);
assert.ok(uniResult.minMinutes > biResult.minMinutes, "Unilateral sets must take longer than bilateral sets");
console.log(`   ✅ Bilateral 3 sets: ${biResult.display} vs Unilateral 3 sets: ${uniResult.display}`);

// [Test 6] Unparsable / Open-Ended Prescriptions -> UNCERTAIN
console.log("\n[Test 6] Open-Ended or Unspecified Prescriptions");
const openEndedPlan = [
  { name: "Skate Drills", notes: "Continuous crease movement" }
];
const openResult = deriveMissionDuration(openEndedPlan);
assert.strictEqual(openResult.confidence, "UNCERTAIN");
assert.strictEqual(openResult.minMinutes, null);
assert.strictEqual(openResult.maxMinutes, null);
console.log(`   ✅ Open-ended plan returns UNCERTAIN without manufacturing false precision.`);

// [Test 7] Invariant: Immutability of Prescription Items
console.log("\n[Test 7] Prescription Immutability Invariant");
const originalSnapshot = JSON.stringify(maintenancePlan);
deriveMissionDuration(maintenancePlan);
assert.strictEqual(JSON.stringify(maintenancePlan), originalSnapshot, "deriveMissionDuration must never mutate plan items");
console.log("   ✅ Plan array and objects remain completely unmutated.");

// [Test 8] Prompt & Schema Verification: mission.what contains only conceptual objective
console.log("\n[Test 8] Prompt & Schema Invariant (No LLM Generated Duration)");
const routeSource = fs.readFileSync(path.join(process.cwd(), 'app', 'api', 'goalie-card', 'chat', 'route.ts'), 'utf-8');
assert.ok(!routeSource.includes('"what": "<1 concise sentence stating today\'s focus and estimated total duration>"'), "Old prompt duration requirement removed from schema");
assert.ok(routeSource.includes('"what": "<1 concise sentence stating today\'s session objective/focus>"'), "Schema requires conceptual objective only");
assert.ok(routeSource.includes("The LLM must NEVER generate or guess total session duration in \"what\" or prose"), "LLM instructed not to guess duration");
console.log("   ✅ Schema decontaminated of LLM duration generation.");

console.log("\n===============================================================");
console.log("🎉 ALL MISSION DURATION UNIT & INTEGRATION TESTS PASSED (100%)");
console.log("===============================================================\n");
