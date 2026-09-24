/**
 * MISSION DURATION DERIVATION MODULE (PURE DETERMINISTIC PROJECTION)
 * 
 * Architecture Boundaries:
 * 1. Duration is a downstream projection of the finalized Mission plan, NOT a generative LLM prediction.
 *    Decision -> Mission Objective -> Plan -> derived duration -> UI
 * 2. Does NOT alter exercises, sets, reps, loads, Mission objective, or coaching rationale.
 * 3. Timing assumptions are centralized and named rather than scattered magic numbers.
 * 4. Differentiates bilateral resistance, unilateral work, core accessory, and mobility/warmup blocks.
 * 5. Preserves genuine uncertainty (DERIVED_RANGE or UNCERTAIN) rather than manufacturing false precision.
 */

export interface TimingAssumptions {
  bilateralResistance: {
    workSecsMin: number;
    workSecsMax: number;
    restSecsMin: number;
    restSecsMax: number;
  };
  unilateralResistance: {
    workSecsMin: number;
    workSecsMax: number;
    restSecsMin: number;
    restSecsMax: number;
  };
  coreAccessory: {
    workSecsMin: number;
    workSecsMax: number;
    restSecsMin: number;
    restSecsMax: number;
  };
  mobilityActivation: {
    workSecsMin: number;
    workSecsMax: number;
    restSecsMin: number;
    restSecsMax: number;
  };
  exerciseTransitionMins: {
    min: number;
    max: number;
  };
}

export const DEFAULT_TIMING_ASSUMPTIONS: TimingAssumptions = {
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

export type DurationConfidence = 'EXACT' | 'DERIVED_RANGE' | 'UNCERTAIN';

export interface MissionDuration {
  minMinutes: number | null;
  maxMinutes: number | null;
  display: string;
  confidence: DurationConfidence;
}

export interface MissionPlanItemInput {
  name: string;
  sets?: string | number | null;
  reps?: string | number | null;
  load?: string | null;
  duration?: string | null;
  notes?: string | null;
}

/**
 * Safely parses set counts from string or number representations (e.g. 3, "3", "2-3", "2–3", "2 to 3 sets").
 */
export function parseSetsRange(sets: string | number | null | undefined): [number, number] | null {
  if (sets === null || sets === undefined) return null;
  if (typeof sets === 'number') {
    return sets > 0 ? [sets, sets] : null;
  }
  const str = String(sets).trim().toLowerCase();
  if (!str) return null;

  // Range match: "2-3", "2–3", "2 to 3", "2 - 3 sets"
  const rangeMatch = str.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
      return [min, max];
    }
  }

  // Single number match: "3", "3 sets", "3 working sets"
  const singleMatch = str.match(/^(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return [val, val];
    }
  }

  return null;
}

/**
 * Safely parses explicit duration strings in minutes or seconds (e.g. "10 min", "8-10 mins", "30s", "45-60s").
 */
export function parseExplicitDurationMins(durStr: string | number | null | undefined): [number, number] | null {
  if (durStr === null || durStr === undefined) return null;
  const str = String(durStr).trim().toLowerCase();
  if (!str) return null;

  // Minutes range: "8-10 min", "8–10 mins", "8 to 10 minutes", "8-10m"
  const minRangeMatch = str.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);
  if (minRangeMatch) {
    const min = parseFloat(minRangeMatch[1]);
    const max = parseFloat(minRangeMatch[2]);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
      return [min, max];
    }
  }

  // Single minutes: "10 min", "10 mins", "10 minutes", "10m"
  const singleMinMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m\b)/i);
  if (singleMinMatch) {
    const val = parseFloat(singleMinMatch[1]);
    if (!isNaN(val) && val > 0) {
      return [val, val];
    }
  }

  // Seconds range: "45-60s", "45–60 sec", "45-60 seconds"
  const secRangeMatch = str.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:s\b|sec|secs|second|seconds)/i);
  if (secRangeMatch) {
    const minSec = parseFloat(secRangeMatch[1]);
    const maxSec = parseFloat(secRangeMatch[2]);
    if (!isNaN(minSec) && !isNaN(maxSec) && minSec > 0 && maxSec >= minSec) {
      return [minSec / 60, maxSec / 60];
    }
  }

  // Single seconds: "30s", "30 sec", "30 seconds"
  const singleSecMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:s\b|sec|secs|second|seconds)/i);
  if (singleSecMatch) {
    const val = parseFloat(singleSecMatch[1]);
    if (!isNaN(val) && val > 0) {
      return [val / 60, val / 60];
    }
  }

  return null;
}

/**
 * Classifies the exercise to apply specific work/rest timing assumptions.
 */
export function classifyMovementTimingCategory(name: string, notes?: string | null): keyof Omit<TimingAssumptions, 'exerciseTransitionMins'> {
  const text = `${name || ''} ${notes || ''}`.toLowerCase();

  // Unilateral resistance
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

  // Core accessory
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

  // Dynamic mobility / activation / warmup
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

  // Default bilateral resistance
  return 'bilateralResistance';
}

/**
 * Pure deterministic projection of Mission duration from finalized plan items.
 */
export function deriveMissionDuration(
  plan: MissionPlanItemInput[] | null | undefined,
  timing: TimingAssumptions = DEFAULT_TIMING_ASSUMPTIONS
): MissionDuration {
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

    // Case 1: Explicit block duration without sets (e.g. Warmup: "10 min" or Yoga: "15 min")
    if (explicitDur && (!setsRange || setsRange[0] <= 1)) {
      totalMinMinutes += explicitDur[0];
      totalMaxMinutes += explicitDur[1];
      validBlocksCount++;
      continue;
    }

    // Case 2: Explicit duration PER set (e.g. 3 sets of 30s plank)
    if (explicitDur && setsRange) {
      allExplicit = false; // Set transitions and rest introduce variation
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

    // Case 3: Set-based work with movement-specific timing assumptions
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

    // Case 4: Item has neither explicit duration nor parsable sets
    hasUncertainBlock = true;
  }

  if (validBlocksCount === 0 || hasUncertainBlock) {
    // If any key block cannot be parsed, preserve uncertainty rather than manufacturing false precision
    return {
      minMinutes: null,
      maxMinutes: null,
      display: 'Timing uncertain (unspecified volume)',
      confidence: 'UNCERTAIN'
    };
  }

  // Add inter-exercise transition buffer if there are multiple set-based movements
  if (validBlocksCount > 1 && !allExplicit) {
    const transitions = validBlocksCount - 1;
    totalMinMinutes += transitions * timing.exerciseTransitionMins.min;
    totalMaxMinutes += transitions * timing.exerciseTransitionMins.max;
  }

  const roundedMin = Math.round(totalMinMinutes);
  const roundedMax = Math.round(totalMaxMinutes);

  // EXACT confidence is reserved strictly when all blocks were explicitly specified and duration is exact
  if (allExplicit && roundedMin === roundedMax) {
    return {
      minMinutes: roundedMin,
      maxMinutes: roundedMax,
      display: `${roundedMin} min`,
      confidence: 'EXACT'
    };
  }

  // Derived range
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
