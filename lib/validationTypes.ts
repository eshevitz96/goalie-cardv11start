/**
 * COACH CARD LIVE COACHING VALIDATION SCHEMA
 * Version: 2026-09-16
 *
 * Core Principle:
 * - This is PRODUCT VALIDATION metadata.
 * - Kept strictly decoupled and separate from Athlete Track and domain models.
 * - Software QA judgments / validation records do NOT contaminate the athlete's training record or learned patterns.
 */

export type ValidationRating = 'yes' | 'partial' | 'no';
export type AdaptationValidationRating = 'yes' | 'partial' | 'no' | 'not_applicable';

export type ValidationFailureCategory =
  | 'missing_data'
  | 'incorrect_data'
  | 'inappropriate_heuristic'
  | 'engine_bug'
  | 'ux_problem'
  | 'coaching_disagreement'
  | 'insufficient_evidence'
  | 'none';

export interface LiveCoachingValidation {
  id: string;
  sessionId?: string;
  decisionId?: string;
  missionId?: string;
  sessionDate: string; // YYYY-MM-DD
  athleteId: string;

  // Seven Core Validation Criteria
  historyComplete: ValidationRating;
  objectiveAppropriate: ValidationRating;
  explanationUseful: ValidationRating;
  missionAppropriate: ValidationRating;
  adaptationWorked: AdaptationValidationRating;
  extractionAccurate: ValidationRating;

  // Qualitative & Failure Diagnostic Metadata
  athleteFeedbackRaw: string;
  architectureFailureDetected: boolean;
  failureCategory: ValidationFailureCategory;
  notes: string;

  createdAt: string;
}
