/**
 * COACH CARD PERFORMANCE-AWARE DECISION ENGINE
 * Version: 2026-09-16 (Phase 3)
 *
 * Core Principles:
 * 1. 8-LAYER DECISION HIERARCHY:
 *    Contract -> Upcoming Performance Demand -> Athlete Track / Recent Load -> Current Athlete State ->
 *    Technical Bottlenecks -> Active Learned Patterns -> Active Hypotheses -> Today's Mission.
 * 2. STANDING SAFETY INVARIANT:
 *    Movement-altering symptoms trigger safety locks (NO axial loading / NO_TRAINING).
 * 3. BASE_COACHING_HEURISTIC PROVENANCE:
 *    General coaching priors (e.g., avoid failure before high-priority game) are explicitly marked
 *    as BASE_COACHING_HEURISTIC and replaceableByAthleteEvidence = true.
 * 4. FACTUAL LOAD SENSING:
 *    Reasons from known activity exposure without manufacturing unverified fatigue inferences.
 * 5. PLANNED MISSIONS ARE IMMUTABLE:
 *    Mid-session adaptations create MissionRevision objects; original missions remain unmutated.
 * 6. REST IS A VALID MISSION:
 *    NO_TRAINING represents optimal coaching restraint, never failure or non-compliance.
 */

import {
  PlannedMission,
  MissionObjective,
  CalendarPerformanceEvent,
  MultiHorizonLoadContext,
  PreSessionAthleteState,
  LearnedPattern,
  CoachDecisionExplanation,
  DecisionAuditTrail,
  DecisionRule,
  MissionRevision,
  RevisionTrigger,
  WorkoutPhase,
  WorkoutExercise,
  TrainingSetting,
  JourneyLevel,
  ReadinessRating
} from './athleteTypes';
import { generateDailyWorkout } from './workoutEngine';

export interface DecisionEngineInput {
  userId: string;
  targetDate: string; // YYYY-MM-DD
  setting: TrainingSetting;
  level: JourneyLevel;
  preSessionState: PreSessionAthleteState;
  calendarEvents: CalendarPerformanceEvent[];
  loadContext: MultiHorizonLoadContext;
  contractGoal?: string;
  technicalBottleneck?: string;
  activePatterns?: LearnedPattern[];
  activeHypothesisId?: string;
  isExplicitHypothesisTrial?: boolean;
}

export class CoachDecisionEngine {
  /**
   * Executes the 8-layer decision hierarchy and generates the authoritative daily PlannedMission.
   */
  static evaluateDailyMission(input: DecisionEngineInput): PlannedMission {
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const rulesApplied: DecisionRule[] = [];
    const keyFactors: string[] = [];
    const planSummary: string[] = [];

    // ------------------------------------------------------------------------
    // LAYER 1: CONTRACT & SEASON HORIZON
    // ------------------------------------------------------------------------
    const contractContext = input.contractGoal || "In-Season Readiness & Performance Maintenance";

    // ------------------------------------------------------------------------
    // LAYER 2: UPCOMING PERFORMANCE DEMAND (CALENDAR LOOKAHEAD)
    // ------------------------------------------------------------------------
    const sortedUpcomingEvents = [...input.calendarEvents]
      .filter(e => e.hoursUntilEvent >= 0 && e.hoursUntilEvent <= 72)
      .sort((a, b) => a.hoursUntilEvent - b.hoursUntilEvent);

    const imminentHighPriorityEvent = sortedUpcomingEvents.find(
      e => (e.priority === 'HIGH' || e.priority === 'CHAMPIONSHIP') && e.hoursUntilEvent <= 36
    );

    const moderateUpcomingEvent = sortedUpcomingEvents.find(
      e => e.hoursUntilEvent <= 48
    );

    // ------------------------------------------------------------------------
    // LAYER 3: ATHLETE TRACK & RECENT LOAD
    // ------------------------------------------------------------------------
    const load48h = input.loadContext.horizon48h;
    const hasSubstantialRecentExposure = load48h.completedEventCount >= 2 || load48h.totalDurationMins >= 90;

    // ------------------------------------------------------------------------
    // LAYER 4: CURRENT ATHLETE STATE SENSING (SAFETY GATE CHECK)
    // ------------------------------------------------------------------------
    const sorenessBehavior = input.preSessionState.structured.soreness.behavior;
    const isMovementAlteringPain = sorenessBehavior === 'movement_altering' || sorenessBehavior === 'progressive';
    const isTransientSoreness = sorenessBehavior === 'transient_resolves';
    const physicalSensation = input.preSessionState.structured.physical;
    const isHeavyFatigued = physicalSensation === 'heavy_fatigued';

    // ------------------------------------------------------------------------
    // LAYER 5-7: BOTTLENECK, PATTERNS & HYPOTHESIS TESTING
    // ------------------------------------------------------------------------
    const activeHypothesis = input.activeHypothesisId;
    const canRunHypothesisTrial = input.isExplicitHypothesisTrial && !isMovementAlteringPain && !isHeavyFatigued;

    // ------------------------------------------------------------------------
    // OBJECTIVE DETERMINATION VIA DECISION HIERARCHY
    // ------------------------------------------------------------------------
    let objective: MissionObjective = 'MAINTAIN_CAPACITY';
    let primaryConstraint = "Standard in-season capacity maintenance window.";

    // Dominance Rule 1: SAFETY GATE (Highest Priority Constraint)
    if (isMovementAlteringPain) {
      objective = 'NO_TRAINING';
      primaryConstraint = "Safety Gate: Movement-altering pain reported.";
      rulesApplied.push({
        ruleId: 'SAFETY-GATE-01',
        name: 'Movement-Altering Pain Safety Constraint',
        ruleSource: 'SAFETY_GATE',
        replaceableByAthleteEvidence: false,
        epistemicClassification: 'FACT',
        rationale: `Sharp or movement-altering discomfort reported in ${input.preSessionState.structured.soreness.locations.join(', ') || 'somatic area'}. Axial loading and explosive impact halted.`
      });
      keyFactors.push(`Safety gate active due to reported movement-altering discomfort (${input.preSessionState.structured.soreness.locations.join(', ') || 'somatic area'}).`);
      planSummary.push("No training or explosive axial loading recommended today.");
      planSummary.push("Focus on non-aggravating tissue circulation, breathing, and rest.");
    }
    // Dominance Rule 2: IMMINENT HIGH-PRIORITY EVENT (Base Coaching Prior)
    else if (imminentHighPriorityEvent) {
      if (imminentHighPriorityEvent.hoursUntilEvent <= 18) {
        objective = 'PRIME_FOR_PERFORMANCE';
        primaryConstraint = `Imminent ${imminentHighPriorityEvent.title} in ${Math.round(imminentHighPriorityEvent.hoursUntilEvent)}h.`;
      } else {
        objective = 'PRESERVE_READINESS';
        primaryConstraint = `High-priority ${imminentHighPriorityEvent.title} within ${Math.round(imminentHighPriorityEvent.hoursUntilEvent)}h.`;
      }

      rulesApplied.push({
        ruleId: 'HEURISTIC-LOOKAHEAD-01',
        name: 'Pre-Competition Neural Readiness Heuristic',
        ruleSource: 'BASE_COACHING_HEURISTIC',
        replaceableByAthleteEvidence: true,
        epistemicClassification: 'COACH_OBSERVATION',
        rationale: 'Protect neuromuscular freshness before high-priority performance. Avoid lower-body failure or deep fatigue.'
      });

      keyFactors.push(`${imminentHighPriorityEvent.title} scheduled in ~${Math.round(imminentHighPriorityEvent.hoursUntilEvent)} hours (${imminentHighPriorityEvent.priority} Priority).`);
      if (hasSubstantialRecentExposure) {
        keyFactors.push(`Recent 48h activity includes: ${load48h.activities.map(a => a.title).join(', ')}.`);
      }

      if (objective === 'PRIME_FOR_PERFORMANCE') {
        planSummary.push("Low-volume, high-quality neural and movement preparation designed to preserve or improve readiness without meaningful fatigue.");
        planSummary.push("Reaction Trainer hand-eye tracking + short hip capsule glide.");
      } else {
        planSummary.push("Upper-body strength stimulus + light lower-body movement primer.");
        planSummary.push("Zero lower-body failure work or heavy axial spinal load.");
      }

      // Check if testing an explicit preparation hypothesis (e.g. Sept 15 prep lift)
      if (canRunHypothesisTrial && activeHypothesis) {
        rulesApplied.push({
          ruleId: 'HYPOTHESIS-TRIAL-01',
          name: `Hypothesis Trial (${activeHypothesis})`,
          ruleSource: 'HYPOTHESIS_TRIAL',
          replaceableByAthleteEvidence: true,
          epistemicClassification: 'HYPOTHESIS',
          rationale: 'Executing controlled preparation trial subordinate to current readiness.'
        });
        keyFactors.push(`Running scheduled verification trial: Controlled strength preparation prior to on-ice performance.`);
      }
    }
    // Dominance Rule 3: HIGH CUMULATIVE FATIGUE SPIKE
    else if (isHeavyFatigued && hasSubstantialRecentExposure) {
      objective = 'RECOVER';
      primaryConstraint = "Heavy somatic fatigue following substantial recent load.";
      rulesApplied.push({
        ruleId: 'HEURISTIC-RECOVERY-01',
        name: 'Heavy Fatigue Down-Regulation Heuristic',
        ruleSource: 'BASE_COACHING_HEURISTIC',
        replaceableByAthleteEvidence: true,
        epistemicClassification: 'COACH_OBSERVATION',
        rationale: 'High cumulative workload combined with reported heavy fatigue warrants active recovery flush.'
      });
      keyFactors.push("Athlete reported heavy physical fatigue / dead legs.");
      keyFactors.push(`Substantial 48h workload (${load48h.totalDurationMins}m total across ${load48h.completedEventCount} activities).`);
      planSummary.push("Down-regulation protocol: 90/90 hip capsule flow, foam rolling, and mobility flush.");
      planSummary.push("Omit heavy loading to allow supercompensation.");
    }
    // Dominance Rule 4: OPEN WINDOW & HIGH FRESHNESS
    else if (physicalSensation === 'springy' || physicalSensation === 'strong') {
      if (!moderateUpcomingEvent || moderateUpcomingEvent.hoursUntilEvent > 48) {
        objective = 'CREATE_ADAPTATION';
        primaryConstraint = "Open training window with positive somatic readiness.";
        rulesApplied.push({
          ruleId: 'HEURISTIC-OVERLOAD-01',
          name: 'Open Window Progressive Stimulus Heuristic',
          ruleSource: 'BASE_COACHING_HEURISTIC',
          replaceableByAthleteEvidence: true,
          epistemicClassification: 'COACH_OBSERVATION',
          rationale: 'Positive readiness with no imminent competition in 48h allows progressive capacity overload.'
        });
        keyFactors.push("Athlete reported springy/strong physical sensation.");
        keyFactors.push("Clear calendar window with no high-priority events in next 48h.");
        planSummary.push("Full 4-phase protocol with progressive crease power and strength stimulus.");
      } else {
        objective = 'MAINTAIN_CAPACITY';
        primaryConstraint = "Event in 48h window limits progressive overload; maintaining capacity.";
        keyFactors.push("Moderate event in lookahead window; maintaining capacity without fatigue overshoot.");
        planSummary.push("Standard maintenance protocol with controlled sets and clean technique focus.");
      }
    }
    // Dominance Rule 5: DEFAULT IN-SEASON CAPACITY MAINTENANCE
    else {
      objective = 'MAINTAIN_CAPACITY';
      primaryConstraint = "Baseline in-season training window.";
      keyFactors.push("Standard in-season profile baseline.");
      planSummary.push("Balanced 4-phase athletic protocol (Mobility, Vision, Power, Recovery).");
    }

    // ------------------------------------------------------------------------
    // BUILD WORKOUT PHASES BASED ON OBJECTIVE
    // ------------------------------------------------------------------------
    const readinessNumber: ReadinessRating = 
      objective === 'PRIME_FOR_PERFORMANCE' ? 4 :
      objective === 'PRESERVE_READINESS' ? 3 :
      objective === 'RECOVER' ? 2 :
      objective === 'NO_TRAINING' ? 1 :
      (input.preSessionState.structured.physical === 'springy' ? 5 : 3);

    let phases: WorkoutPhase[] = [];

    if (objective === 'NO_TRAINING') {
      phases = [
        {
          id: 'recovery',
          title: 'Phase 1: Active Tissue Rest & Circulation',
          phaseNumber: 1,
          badge: 'REST & RESTORE',
          focus: 'Gentle non-aggravating breathing, tissue glide, and joint decompression',
          description: 'Zero loading. Coach Card recommends complete rest and tissue circulation.',
          estimatedMinutes: 15,
          exercises: [
            {
              id: 'rest-diaphragmatic-breathing',
              stage: 'recovery',
              title: '90/90 Diaphragmatic Box Breathing',
              setsReps: '3 sets x 2 mins',
              durationSecs: 360,
              cues: ['Inhale 4s through nose, hold 4s, exhale 6s through mouth', 'Downregulate nervous system']
            },
            {
              id: 'rest-gentle-hip-circulation',
              stage: 'recovery',
              title: 'Gentle Supine Hip Circles & Ankle Pumps',
              setsReps: '2 sets x 10 slow reps',
              durationSecs: 300,
              cues: ['Stay in pain-free range of motion', 'Zero strain or loaded resistance']
            }
          ]
        }
      ];
    } else {
      const generated = generateDailyWorkout(input.setting, input.level, readinessNumber, {
        athleteState: input.preSessionState
      });
      phases = generated.phases;

      // If PRESERVE_READINESS, modify Phase 3 to omit lower-body failure work
      if (objective === 'PRESERVE_READINESS') {
        const strengthPhase = phases.find(p => p.id === 'strength');
        if (strengthPhase) {
          strengthPhase.focus = "Upper-body stimulus + non-fatiguing lower primer (No failure)";
          strengthPhase.exercises = strengthPhase.exercises.map(e => {
            if (e.title.toLowerCase().includes('squat') || e.title.toLowerCase().includes('lunge') || e.title.toLowerCase().includes('hop')) {
              return {
                ...e,
                setsReps: '2 sets x 3 reps (Primer tempo)',
                cues: ['Move with pristine control; stop 3 reps before fatigue', ...e.cues]
              };
            }
            return e;
          });
        }
      }
    }

    const totalEstimatedMinutes = phases.reduce((acc, p) => acc + p.estimatedMinutes, 0);

    // ------------------------------------------------------------------------
    // EXPLAINABILITY & AUDIT TRAIL CONSTRUCTION
    // ------------------------------------------------------------------------
    const explanation: CoachDecisionExplanation = {
      objective,
      primaryConstraint,
      keyFactors,
      planSummary,
      rulesApplied,
      safetyNotice: isMovementAlteringPain ? "Safety Gate Active: Movement-altering pain reported. Axial loads removed." : undefined
    };

    const auditTrail: DecisionAuditTrail = {
      decisionId: auditId,
      timestamp: new Date().toISOString(),
      hierarchyStepEvaluations: {
        contractContext,
        lookaheadEvents: sortedUpcomingEvents,
        loadContext: input.loadContext,
        athleteState: input.preSessionState,
        bottlenecks: input.technicalBottleneck ? [input.technicalBottleneck] : [],
        activePatternsApplied: input.activePatterns?.map(p => p.title) || [],
        hypothesesEvaluated: activeHypothesis ? [activeHypothesis] : []
      },
      selectedObjective: objective,
      explanation,
      athleteOverrode: false
    };

    return {
      id: `mission-${input.targetDate}-${input.userId}`,
      userId: input.userId,
      date: input.targetDate,
      setting: input.setting,
      level: input.level,
      readiness: readinessNumber,
      objective,
      isRestDay: objective === 'NO_TRAINING',
      rationale: explanation.primaryConstraint,
      activeHypothesisId: activeHypothesis,
      contractMilestoneRef: contractContext,
      phases,
      totalEstimatedMinutes,
      summary: `Coach Card ${objective} Mission: ${keyFactors[0] || 'Standard protocol'}`,
      revisions: [],
      explanation,
      auditTrail,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Creates a formal MissionRevision upon post-warmup reassessment or mid-session symptom change.
   * PlannedMission is NEVER mutated in place.
   */
  static createMissionRevision(
    originalMission: PlannedMission,
    trigger: RevisionTrigger,
    reassessmentResult: 'resolved' | 'persistent' | 'aggravated',
    currentState: PreSessionAthleteState
  ): MissionRevision {
    const revisionNumber = (originalMission.revisions?.length || 0) + 1;
    const previousPhases = originalMission.phases;
    let revisedPhases = [...previousPhases];
    let revisedObjective = originalMission.objective;
    let rationale = "";

    if (reassessmentResult === 'resolved') {
      rationale = "Transient tightness resolved completely during warmup flow. Proceeding with full target protocol.";
    } else if (reassessmentResult === 'persistent') {
      rationale = "Tightness persists following warmup. Restricting heavy axial loads and reducing explosive impact.";
      revisedPhases = revisedPhases.map(p => {
        if (p.id === 'strength') {
          return {
            ...p,
            focus: "Controlled tempo strength (Axial load capped)",
            exercises: p.exercises.map(e => ({
              ...e,
              setsReps: '2 sets x 5 reps (Controlled tempo)',
              cues: ['Do not force end-range depth', ...e.cues]
            }))
          };
        }
        return p;
      });
    } else if (reassessmentResult === 'aggravated') {
      rationale = "Safety notice: Discomfort aggravated during warmup. Main strength phase halted to prevent injury.";
      revisedObjective = 'NO_TRAINING';
      revisedPhases = revisedPhases.filter(p => p.id === 'mobility' || p.id === 'recovery');
    }

    return {
      id: `rev-${Date.now()}-${revisionNumber}`,
      originalMissionId: originalMission.id,
      revisionNumber,
      trigger,
      timestamp: new Date().toISOString(),
      previousPhases,
      revisedPhases,
      revisedObjective,
      rationale,
      athleteStateBefore: originalMission.auditTrail?.hierarchyStepEvaluations.athleteState || currentState,
      athleteStateAfter: currentState,
      decisionAuditRef: originalMission.auditTrail?.decisionId
    };
  }
}
