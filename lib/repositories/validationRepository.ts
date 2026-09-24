/**
 * COACH CARD VALIDATION REPOSITORY
 * Version: 2026-09-16
 *
 * Dedicated repository for recording LiveCoachingValidation records.
 * Completely separate from Athlete Track to prevent QA contamination.
 */

import { LiveCoachingValidation } from '../validationTypes';
import { supabase } from '../../utils/supabase/client';

const LOCAL_STORAGE_KEY = 'coach_card_live_validations';

export class ValidationRepository {
  /**
   * Saves a product validation entry to dedicated table and local backup.
   */
  static async recordValidation(entry: LiveCoachingValidation): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Local backup
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const list: LiveCoachingValidation[] = stored ? JSON.parse(stored) : [];
        list.push(entry);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      }

      // 2. Supabase storage if available
      const { error } = await supabase
        .from('live_coaching_validations')
        .insert({
          id: entry.id,
          session_id: entry.sessionId,
          decision_id: entry.decisionId,
          mission_id: entry.missionId,
          session_date: entry.sessionDate,
          athlete_id: entry.athleteId,
          history_complete: entry.historyComplete,
          objective_appropriate: entry.objectiveAppropriate,
          explanation_useful: entry.explanationUseful,
          mission_appropriate: entry.missionAppropriate,
          adaptation_worked: entry.adaptationWorked,
          extraction_accurate: entry.extractionAccurate,
          athlete_feedback_raw: entry.athleteFeedbackRaw,
          architecture_failure_detected: entry.architectureFailureDetected,
          failure_category: entry.failureCategory,
          notes: entry.notes,
          created_at: entry.createdAt
        });

      if (error) {
        // Non-blocking if table not yet migrated in Supabase; local persistence preserves the log
        console.warn("ValidationRepository: Supabase sync skipped or failed, preserved locally:", error.message);
      }

      return { success: true };
    } catch (e: any) {
      console.error("ValidationRepository error:", e);
      return { success: false, error: e?.message || "Unknown error" };
    }
  }

  /**
   * Retrieves all recorded validation entries.
   */
  static async getValidations(athleteId?: string): Promise<LiveCoachingValidation[]> {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const list: LiveCoachingValidation[] = JSON.parse(stored);
        if (athleteId) {
          return list.filter(v => v.athleteId === athleteId);
        }
        return list;
      }
    }
    return [];
  }
}
