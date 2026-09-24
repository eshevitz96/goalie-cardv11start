/**
 * GOALIE CARD / COACH CARD DOMAIN MODEL
 * Version: 2026-09-16 (Phase 1 / Slice 1)
 *
 * Governing Principle:
 * The workout generator is not the product. The decision-making + learning loop is the product.
 *
 * Epistemic Hierarchy:
 * FACT -> ATHLETE_REPORT -> COACH_OBSERVATION -> HYPOTHESIS -> EMERGING_PATTERN -> ESTABLISHED_PATTERN / DISCONFIRMED_PATTERN
 */

// ============================================================================
// 1. EPISTEMIC CLASSIFICATION & PROVENANCE
// ============================================================================

export type EpistemicClassification =
  | 'FACT'
  | 'ATHLETE_REPORT'
  | 'COACH_OBSERVATION'
  | 'HYPOTHESIS'
  | 'EMERGING_PATTERN'
  | 'ESTABLISHED_PATTERN'
  | 'DISCONFIRMED_PATTERN';

export type DateConfidence = 'EXACT' | 'RECONSTRUCTED' | 'DATE_UNCERTAIN';
export type CompletionConfidence = 'EXACT' | 'RECONSTRUCTED' | 'PARTIAL_UNCONFIRMED' | 'UNKNOWN';
export type EstimationConfidence = 'EXACT' | 'ESTIMATED' | 'UNKNOWN' | 'NOT_APPLICABLE';

export type RecordSource =
  | 'historical_dossier'
  | 'athlete_track_manual'
  | 'mission_completion'
  | 'conversational_import'
  | 'external_device';

export interface AuditProvenance {
  recordSource: RecordSource;
  dateConfidence: DateConfidence;
  completionConfidence: CompletionConfidence;
  sourceReference?: string;
  supersededBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// 2. WORKLOAD & LOAD EVENTS
// ============================================================================

export type ActivityType =
  | 'running'
  | 'gym_strength'
  | 'ice_hockey'
  | 'stick_and_puck'
  | 'tryout'
  | 'rollerblading'
  | 'yoga'
  | 'yard_work'
  | 'walking'
  | 'travel'
  | 'recovery'
  | 'other';

export interface LoadEvent {
  id: string;
  userId: string;
  activityType: ActivityType;
  title: string;
  startTimestamp: string; // ISO 8601
  durationMins: number;
  isStructuredTraining: boolean;

  // Nullable load vectors — no fabricated precision
  lowerBodyLoadScore: number | null; // 0-10 or null
  upperBodyLoadScore: number | null;
  cardioLoadScore: number | null;
  mobilityLoadScore: number | null;
  sportSpecificLoadScore: number | null;

  loadEstimationSource: 'athlete_reported' | 'coach_estimated' | 'measured_device' | 'unestimated';
  loadEstimationConfidence: EstimationConfidence;

  notes?: string;
  provenance: AuditProvenance;
}

// ============================================================================
// 3. PROGRESSION & AUTOREGULATION
// ============================================================================

export type ProgressionStatus =
  | 'progressed'
  | 'maintained'
  | 'intentionally_held'
  | 'attempted_failed'
  | 'reduced_for_readiness'
  | 'reduced_for_fatigue'
  | 'reduced_for_pain'
  | 'reduced_for_schedule'
  | 'technique_limited'
  | 'equipment_limited'
  | 'athlete_modified'
  | 'omitted';

export interface AthleteDecision {
  id?: string;
  sessionId?: string;
  exerciseId: string;
  exerciseTitle: string;
  prescribedLoad?: string;
  actualLoad?: string;
  progressionStatus: ProgressionStatus;
  athleteReason?: string;
  timestamp: string;
}

// ============================================================================
// 4. WITHIN-SESSION ADAPTATION & REASSESSMENT
// ============================================================================

export type ReassessmentDimension = 'soreness' | 'neuromuscular' | 'movement';

export interface WithinSessionAdaptation {
  exerciseId: string;
  exerciseTitle?: string;
  dimension?: ReassessmentDimension;
  initialQuality: string; // e.g. 'unstable', 'stiff', 'sluggish', 'tight_hips'
  withinSessionChange: 'self_corrected_improved' | 'unchanged' | 'fatigued_declined';
  finalQuality: string; // e.g. 'controlled', 'sharp', 'resolved', 'persistent'
  notes?: string;
}

// ============================================================================
// ============================================================================
// 5. PLANNED MISSION (Prescription) & MISSION REVISION (Immutability Chain)
// ============================================================================

export type TrainingSetting = 'gym' | 'home' | 'facility' | 'field' | 'travel' | 'other';
export type JourneyLevel = 'foundation' | 'competitive' | 'elite';
export type ReadinessRating = 1 | 2 | 3 | 4 | 5;

export type MissionObjective =
  | 'CREATE_ADAPTATION'
  | 'MAINTAIN_CAPACITY'
  | 'PRESERVE_READINESS'
  | 'PRIME_FOR_PERFORMANCE'
  | 'RECOVER'
  | 'TECHNICAL_DEVELOPMENT'
  | 'TEST_LEVEL'
  | 'NO_TRAINING';

export interface WorkoutExercise {
  id: string;
  stage: 'mobility' | 'reaction' | 'strength' | 'recovery';
  title: string;
  subtitle?: string;
  setsReps: string;
  durationSecs?: number;
  equipment?: string;
  cues: string[];
  isGame?: boolean;
}

export interface WorkoutPhase {
  id: 'mobility' | 'reaction' | 'strength' | 'recovery';
  title: string;
  phaseNumber: number;
  badge: string;
  focus: string;
  description: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  isWarmupReassessmentCheckpoint?: boolean; // If transient soreness/sluggishness was sensed
}

export type RevisionTrigger =
  | 'warmup_reassessment'
  | 'safety_gate_symptom'
  | 'athlete_modification'
  | 'schedule_shift'
  | 'coach_override';

export interface MissionRevision {
  id: string;
  originalMissionId: string;
  revisionNumber: number;
  trigger: RevisionTrigger;
  timestamp: string;
  previousPhases: WorkoutPhase[];
  revisedPhases: WorkoutPhase[];
  revisedObjective?: MissionObjective;
  rationale: string;
  athleteStateBefore: PreSessionAthleteState;
  athleteStateAfter?: PreSessionAthleteState;
  decisionAuditRef?: string;
}

export interface PlannedMission {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  setting: TrainingSetting;
  level: JourneyLevel;
  readiness: ReadinessRating;
  objective: MissionObjective;
  isRestDay?: boolean;
  rationale: string;
  activeHypothesisId?: string;
  contractMilestoneRef?: string;
  phases: WorkoutPhase[];
  totalEstimatedMinutes: number;
  summary: string;
  revisions?: MissionRevision[];
  explanation?: CoachDecisionExplanation;
  auditTrail?: DecisionAuditTrail;
  createdAt: string;
}

// ============================================================================
// 6. COMPLETED SESSION (Execution Reality)
// ============================================================================

export interface CompletedExerciseRecord {
  exerciseId: string;
  title: string;
  stage: 'mobility' | 'reaction' | 'strength' | 'recovery';
  setsRepsPlanned: string;
  setsRepsCompleted?: string;
  actualLoadCompleted?: string;
  decision: AthleteDecision;
  withinSessionAdaptation?: WithinSessionAdaptation;
}

export interface CompletedSession {
  id?: string;
  userId: string;
  missionId?: string; // Reference to planned mission if derived from one
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  durationMins?: number;
  completedExercises: CompletedExerciseRecord[];
  omittedExerciseIds: string[];
  athleteReflectionRaw?: string;
  athleteReflectionStructured?: Record<string, any>;
  coachObservations?: string;
  preSessionState?: PreSessionAthleteState;
  withinSessionAdaptations: WithinSessionAdaptation[];
  tags: string[];
  provenance: AuditProvenance;
}

// ============================================================================
// 7. MULTI-DIMENSIONAL STATE SENSING & CONFIRMATION
// ============================================================================

export type ConfirmationStatus = 'unconfirmed' | 'athlete_confirmed' | 'athlete_corrected';
export type ExtractionConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'AMBIGUOUS' | 'MANUAL';

export type PhysicalSensation = 'heavy_fatigued' | 'neutral' | 'loose' | 'springy' | 'strong';
export type NeuromuscularQuality = 'sluggish' | 'unstable' | 'neutral' | 'sharp' | 'reactive';
export type MentalState = 'rushed' | 'neutral' | 'calm' | 'slow_clear';
export type GoalieState = 'chasing' | 'neutral' | 'patient' | 'compact' | 'sitting_into_edges';

export type SorenessBehavior =
  | 'none'
  | 'transient_resolves'
  | 'persistent_manageable'
  | 'progressive'
  | 'movement_altering';

export type SorenessLocation =
  | 'hips'
  | 'adductors'
  | 'groin'
  | 'quads'
  | 'hamstrings'
  | 'ankles_feet'
  | 'lower_back'
  | 'core'
  | 'shoulders'
  | 'upper_body'
  | 'other';

export interface SorenessAssessment {
  behavior: SorenessBehavior;
  locations: SorenessLocation[];
  notes?: string;
  reassessmentStatus?: 'pending_warmup' | 'resolved' | 'persistent' | 'aggravated';
}

export interface StructuredReadinessVectors {
  physical: PhysicalSensation | null;
  neuromuscular: NeuromuscularQuality | null;
  mental: MentalState | null;
  goalieState: GoalieState | null;
  soreness: SorenessAssessment;
}

export interface AmbiguousInterpretation {
  rawPhrase: string;
  clarificationPrompt: string;
  candidateOptions: {
    label: string;
    vectorKey: keyof StructuredReadinessVectors;
    value: any;
  }[];
}

export interface PreSessionAthleteState {
  rawReport: string;
  structured: StructuredReadinessVectors;
  confirmationStatus: ConfirmationStatus;
  extractionConfidence: ExtractionConfidence;
  ambiguities?: AmbiguousInterpretation[];
  timestamp: string;
}

// ============================================================================
// 8. SPORT-EXTENSIBLE PERFORMANCE SESSION
// ============================================================================

export interface GenericPerformanceSession {
  id: string;
  userId: string;
  date: string;
  sport: string; // e.g. 'Ice Hockey'
  eventType: 'game' | 'stick_and_puck' | 'tryout' | 'practice' | 'scrimmage';
  classification?: 'BENCHMARK' | 'STANDARD' | 'ASSESSMENT';
  opponentOrContext?: string;
  durationMins?: number;
  athleteReflectionRaw?: string;
  coachObservations?: string;
  confidenceRating?: number;
  provenance: AuditProvenance;
  sportSpecificOverlay?: GoaliePerformanceOverlay | Record<string, any>;
}

export interface GoaliePerformanceOverlay {
  shooterContext?: string;
  goalsAgainstTotal?: number;
  goalsBreakdown?: {
    cleanFirstShot?: number;
    breakaway?: number;
    reboundSequence?: number;
    screenOrTip?: number;
    scrambleMultiSave?: number;
    lateralPlay?: number;
  };
  perceivedControl?: 'low' | 'moderate' | 'high' | 'very_high';
  movementAutomaticity?: 1 | 2 | 3 | 4 | 5; // 1: conscious construction -> 5: automatic read-and-react
  stanceCompactness?: 'tall_exaggerated' | 'moderate' | 'compact_patient';
  edgeQuality?: 'sluggish' | 'moderate' | 'clean_sharp';
  anglesQuality?: 'inconsistent' | 'solid' | 'great';
  transientSorenessNotes?: string;
}

// ============================================================================
// 9. LEARNED PATTERNS & MULTI-FACTOR AUDIT PROMOTION
// ============================================================================

export interface LearnedPattern {
  id: string;
  classification: EpistemicClassification;
  title: string;
  sequenceContext: string[];
  observedOutcome: string;
  hypothesis: string;
  confidence: 'LOW' | 'EMERGING' | 'MODERATE' | 'HIGH';
  replicationsCount: number;
  comparabilityScore?: number; // 0-1
  contextDiversityNotes?: string;
  hasContradictoryEvidence: boolean;
  contradictoryEvidenceNotes?: string;
  nextVerificationTest: string;
  associatedCues: string[];
  dateLogged: string;
  provenance: AuditProvenance;
}

// ============================================================================
// 10. DECISION ENGINE, CALENDAR LOOKAHEAD, LOAD HORIZONS & EXPLAINABILITY
// ============================================================================

export type PerformanceEventType =
  | 'game'
  | 'tryout'
  | 'practice'
  | 'stick_and_puck'
  | 'private_lesson'
  | 'tournament'
  | 'testing_benchmark'
  | 'other';

export type EventPriority = 'CHAMPIONSHIP' | 'HIGH' | 'MEDIUM' | 'LOW' | 'DEVELOPMENTAL';

export interface CalendarPerformanceEvent {
  id: string;
  userId: string;
  eventType: PerformanceEventType;
  title: string;
  opponentOrVenue?: string;
  startDateTime: string; // ISO 8601
  endDateTime?: string;
  priority: EventPriority;
  expectedPhysicalDemand: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  technicalImportance: 'CRITICAL' | 'HIGH' | 'STANDARD';
  status: 'CONFIRMED' | 'TENTATIVE' | 'RESCHEDULED';
  hoursUntilEvent: number;
}

export type RuleSource =
  | 'BASE_COACHING_HEURISTIC'
  | 'ATHLETE_TRACK_EVIDENCE'
  | 'HYPOTHESIS_TRIAL'
  | 'SAFETY_GATE'
  | 'MANUAL_OVERRIDE';

export interface DecisionRule {
  ruleId: string;
  name: string;
  ruleSource: RuleSource;
  replaceableByAthleteEvidence: boolean;
  epistemicClassification: EpistemicClassification;
  rationale: string;
}

export interface LoadHorizonSummary {
  windowHours: 24 | 48 | 72 | 168; // 24h, 48h, 72h, 7d
  completedEventCount: number;
  totalDurationMins: number;
  activities: { activityType: string; title: string; durationMins: number; isStructured: boolean }[];
  knownLowerBodyExposures: number;
  knownUpperBodyExposures: number;
  knownSportSpecificExposures: number;
  unstructuredActivityMentions: string[]; // e.g. "2h yard work", "4mi run"
  hasUnknownLoadMagnitudes: boolean;
}

export interface MultiHorizonLoadContext {
  horizon24h: LoadHorizonSummary;
  horizon48h: LoadHorizonSummary;
  horizon72h: LoadHorizonSummary;
  horizon7d: LoadHorizonSummary;
  lastLowerBodyOverloadDate?: string;
  lastOnIcePerformanceDate?: string;
}

export interface CoachDecisionExplanation {
  objective: MissionObjective;
  primaryConstraint: string;
  keyFactors: string[];
  planSummary: string[];
  rulesApplied: DecisionRule[];
  safetyNotice?: string;
  counterfactualNotes?: string;
}

export interface DecisionAuditTrail {
  decisionId: string;
  timestamp: string;
  hierarchyStepEvaluations: {
    contractContext?: string;
    lookaheadEvents?: CalendarPerformanceEvent[];
    loadContext?: MultiHorizonLoadContext;
    athleteState?: PreSessionAthleteState;
    bottlenecks?: string[];
    activePatternsApplied?: string[];
    hypothesesEvaluated?: string[];
  };
  selectedObjective: MissionObjective;
  explanation: CoachDecisionExplanation;
  athleteOverrode: boolean;
  athleteOverrideRationale?: string;
}
