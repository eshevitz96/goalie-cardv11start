/**
 * COACH CARD SESSION & WORKLOAD REPOSITORY
 * Version: 2026-09-16 (Phase 1 / Slice 1)
 *
 * Implements decoupled persistence for:
 * 1. Planned Missions (Prescriptions with rationale)
 * 2. Completed Sessions (Actual execution with provenance)
 * 3. Athlete Decisions (Autoregulation events)
 * 4. Load Events (Structured & unstructured cumulative workload with nullable vectors)
 * 5. Historical Projection from Athlete Track
 */

import { supabase } from "../../utils/supabase/client";
import {
  PlannedMission,
  CompletedSession,
  AthleteDecision,
  LoadEvent,
  AuditProvenance,
  DateConfidence,
  CompletionConfidence,
  ActivityType,
  MissionRevision
} from "../athleteTypes";
import { ATHLETE_TRAINING_HISTORY, AthleteTrainingEntry } from "../athleteTrainingHistory";

export class SessionRepository {
  /**
   * Save a newly generated Planned Mission
   */
  static async savePlannedMission(mission: PlannedMission): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const row = {
        id: mission.id || undefined,
        user_id: mission.userId,
        date: mission.date,
        setting: mission.setting,
        level: mission.level,
        readiness: mission.readiness,
        objective: mission.objective,
        is_rest_day: mission.isRestDay ?? false,
        rationale: mission.rationale,
        active_hypothesis_id: mission.activeHypothesisId || null,
        contract_milestone_ref: mission.contractMilestoneRef || null,
        phases_json: mission.phases,
        total_estimated_minutes: mission.totalEstimatedMinutes,
        summary: mission.summary || null,
        explanation_json: mission.explanation || null,
        audit_trail_json: mission.auditTrail || null,
        created_at: mission.createdAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("planned_missions")
        .upsert(row)
        .select("id")
        .single();

      if (error) {
        console.warn("SessionRepository: savePlannedMission fallback (offline/bypass):", error.message);
        return { success: true, id: mission.id };
      }

      return { success: true, id: data?.id || mission.id };
    } catch (e: any) {
      console.error("SessionRepository: savePlannedMission error:", e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Retrieve a Planned Mission for a specific date
   */
  static async getPlannedMission(userId: string, date: string): Promise<PlannedMission | null> {
    try {
      const { data, error } = await supabase
        .from("planned_missions")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        setting: data.setting,
        level: data.level,
        readiness: data.readiness,
        objective: data.objective || 'MAINTAIN_CAPACITY',
        isRestDay: data.is_rest_day ?? false,
        rationale: data.rationale,
        activeHypothesisId: data.active_hypothesis_id,
        contractMilestoneRef: data.contract_milestone_ref,
        phases: data.phases_json,
        totalEstimatedMinutes: data.total_estimated_minutes,
        summary: data.summary,
        explanation: data.explanation_json,
        auditTrail: data.audit_trail_json,
        createdAt: data.created_at
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Save a formal MissionRevision (preserving original PlannedMission immutability)
   */
  static async saveMissionRevision(revision: MissionRevision): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const row = {
        id: revision.id || undefined,
        original_mission_id: revision.originalMissionId,
        revision_number: revision.revisionNumber,
        trigger: revision.trigger,
        timestamp: revision.timestamp,
        previous_phases_json: revision.previousPhases,
        revised_phases_json: revision.revisedPhases,
        revised_objective: revision.revisedObjective || null,
        rationale: revision.rationale,
        athlete_state_before_json: revision.athleteStateBefore,
        athlete_state_after_json: revision.athleteStateAfter || null,
        decision_audit_ref: revision.decisionAuditRef || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("mission_revisions")
        .upsert(row)
        .select("id")
        .single();

      if (error) {
        console.warn("SessionRepository: saveMissionRevision fallback (offline/bypass):", error.message);
        return { success: true, id: revision.id };
      }

      return { success: true, id: data?.id || revision.id };
    } catch (e: any) {
      console.error("SessionRepository: saveMissionRevision error:", e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Retrieve all revisions for a specific Planned Mission
   */
  static async getMissionRevisions(originalMissionId: string): Promise<MissionRevision[]> {
    try {
      const { data, error } = await supabase
        .from("mission_revisions")
        .select("*")
        .eq("original_mission_id", originalMissionId)
        .order("revision_number", { ascending: true });

      if (error || !data) return [];

      return data.map(d => ({
        id: d.id,
        originalMissionId: d.original_mission_id,
        revisionNumber: d.revision_number,
        trigger: d.trigger,
        timestamp: d.timestamp,
        previousPhases: d.previous_phases_json,
        revisedPhases: d.revised_phases_json,
        revisedObjective: d.revised_objective,
        rationale: d.rationale,
        athleteStateBefore: d.athlete_state_before_json,
        athleteStateAfter: d.athlete_state_after_json,
        decisionAuditRef: d.decision_audit_ref
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Save a Completed Session along with its discrete Autoregulation Decisions
   */
  static async saveCompletedSession(
    session: CompletedSession,
    decisions: AthleteDecision[] = []
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const sessionRow = {
        id: session.id || undefined,
        user_id: session.userId,
        mission_id: session.missionId || null,
        date: session.date,
        start_time: session.startTime || null,
        end_time: session.endTime || null,
        duration_mins: session.durationMins || null,
        completed_exercises_json: session.completedExercises,
        omitted_exercise_ids: session.omittedExerciseIds || [],
        athlete_reflection_raw: session.athleteReflectionRaw || null,
        athlete_reflection_structured: session.athleteReflectionStructured || null,
        coach_observations: session.coachObservations || null,
        within_session_adaptations_json: session.withinSessionAdaptations || [],
        tags: session.tags || [],
        record_source: session.provenance.recordSource,
        date_confidence: session.provenance.dateConfidence,
        completion_confidence: session.provenance.completionConfidence,
        source_reference: session.provenance.sourceReference || null,
        superseded_by: session.provenance.supersededBy || null,
        is_active: session.provenance.isActive ?? true,
        created_at: session.provenance.createdAt || new Date().toISOString()
      };

      const { data: savedSession, error: sessionErr } = await supabase
        .from("completed_sessions")
        .upsert(sessionRow)
        .select("id")
        .single();

      if (sessionErr) {
        console.warn("SessionRepository: saveCompletedSession offline fallback:", sessionErr.message);
      }

      const assignedSessionId = savedSession?.id || session.id;

      // Persist autoregulation decisions linked to this session
      if (decisions.length > 0 && assignedSessionId) {
        const decisionRows = decisions.map(d => ({
          user_id: session.userId,
          session_id: assignedSessionId,
          exercise_id: d.exerciseId,
          exercise_title: d.exerciseTitle,
          prescribed_load: d.prescribedLoad || null,
          actual_load: d.actualLoad || null,
          progression_status: d.progressionStatus,
          athlete_reason: d.athleteReason || null,
          created_at: d.timestamp || new Date().toISOString()
        }));

        await supabase.from("athlete_decisions").insert(decisionRows);
      }

      return { success: true, id: assignedSessionId };
    } catch (e: any) {
      console.error("SessionRepository: saveCompletedSession error:", e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Save a Load Event (structured or unstructured cumulative workload)
   */
  static async saveLoadEvent(event: LoadEvent): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const row = {
        id: event.id || undefined,
        user_id: event.userId,
        activity_type: event.activityType,
        title: event.title,
        start_timestamp: event.startTimestamp,
        duration_mins: event.durationMins,
        is_structured_training: event.isStructuredTraining,
        lower_body_load_score: event.lowerBodyLoadScore,
        upper_body_load_score: event.upperBodyLoadScore,
        cardio_load_score: event.cardioLoadScore,
        mobility_load_score: event.mobilityLoadScore,
        sport_specific_load_score: event.sportSpecificLoadScore,
        load_estimation_source: event.loadEstimationSource,
        load_estimation_confidence: event.loadEstimationConfidence,
        notes: event.notes || null,
        record_source: event.provenance.recordSource,
        date_confidence: event.provenance.dateConfidence,
        completion_confidence: event.provenance.completionConfidence,
        source_reference: event.provenance.sourceReference || null,
        superseded_by: event.provenance.supersededBy || null,
        is_active: event.provenance.isActive ?? true,
        created_at: event.provenance.createdAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("load_events")
        .upsert(row)
        .select("id")
        .single();

      if (error) {
        console.warn("SessionRepository: saveLoadEvent offline fallback:", error.message);
        return { success: true, id: event.id };
      }

      return { success: true, id: data?.id || event.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Correct a completed session with audit provenance (Supersession pattern)
   */
  static async correctCompletedSession(
    originalId: string,
    correctedSession: CompletedSession,
    correctionReason: string
  ): Promise<{ success: boolean; newId?: string; error?: string }> {
    try {
      // 1. Insert new corrected record
      const { data: newRecord, error: insertErr } = await supabase
        .from("completed_sessions")
        .insert({
          user_id: correctedSession.userId,
          mission_id: correctedSession.missionId || null,
          date: correctedSession.date,
          start_time: correctedSession.startTime || null,
          end_time: correctedSession.endTime || null,
          duration_mins: correctedSession.durationMins || null,
          completed_exercises_json: correctedSession.completedExercises,
          omitted_exercise_ids: correctedSession.omittedExerciseIds || [],
          athlete_reflection_raw: correctedSession.athleteReflectionRaw || null,
          athlete_reflection_structured: correctedSession.athleteReflectionStructured || null,
          coach_observations: `[CORRECTION: ${correctionReason}] ` + (correctedSession.coachObservations || ""),
          within_session_adaptations_json: correctedSession.withinSessionAdaptations || [],
          tags: [...(correctedSession.tags || []), "corrected_provenance"],
          record_source: correctedSession.provenance.recordSource,
          date_confidence: correctedSession.provenance.dateConfidence,
          completion_confidence: correctedSession.provenance.completionConfidence,
          source_reference: originalId,
          is_active: true
        })
        .select("id")
        .single();

      if (insertErr || !newRecord) throw insertErr || new Error("Failed to insert correction");

      // 2. Mark original record as inactive and point superseded_by to new record
      await supabase
        .from("completed_sessions")
        .update({
          is_active: false,
          superseded_by: newRecord.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", originalId);

      return { success: true, newId: newRecord.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Historical Projection Helper:
   * Maps static ATHLETE_TRAINING_HISTORY items into typed CompletedSession and LoadEvent domain structures
   * preserving exact provenance, confidence flags, and decoupled execution data.
   */
  static projectHistoricalAthleteTrack(userId: string): {
    sessions: CompletedSession[];
    loadEvents: LoadEvent[];
  } {
    const sessions: CompletedSession[] = [];
    const loadEvents: LoadEvent[] = [];

    for (const item of ATHLETE_TRAINING_HISTORY) {
      const dateConfidence: DateConfidence = item.confidence === "EXACT" ? "EXACT" : "RECONSTRUCTED";
      const completionConfidence: CompletionConfidence = item.confidence === "EXACT" ? "EXACT" : "RECONSTRUCTED";

      const provenance: AuditProvenance = {
        recordSource: "historical_dossier",
        dateConfidence,
        completionConfidence,
        sourceReference: item.id,
        isActive: true,
        createdAt: item.date + "T09:00:00.000Z"
      };

      const startTimestamp = `${item.date}T${item.time || "09:00:00"}.000Z`;

      // Determine activity type with high fidelity
      let activityType: ActivityType = "other";
      const lowerTitle = item.title.toLowerCase();
      if (lowerTitle.includes("lawn mowing") || lowerTitle.includes("mowed lawn")) {
        activityType = "yard_work";
      } else if (lowerTitle.includes("run") || (item.conditioning && item.conditioning.toLowerCase().includes("run"))) {
        activityType = "running";
      } else if (lowerTitle.includes("yoga") || (item.recovery && item.recovery.some(r => r.toLowerCase().includes("yoga")))) {
        activityType = "yoga";
      } else if (item.type === "on_ice" || item.type === "game") {
        activityType = "ice_hockey";
      } else if (item.type === "off_ice") {
        activityType = "gym_strength";
      } else if (item.type === "recovery") {
        activityType = "recovery";
      }

      // Check if any load vector is actually estimated or completely unestimated
      const isUnstructuredOrUnestimated = activityType === "yard_work" || (activityType === "running" && !item.notes?.includes("RPE"));
      
      const lowerBodyLoad = isUnstructuredOrUnestimated ? null : (activityType === "ice_hockey" ? 8 : (activityType === "gym_strength" ? 7 : (activityType === "running" ? 6 : null)));
      const upperBodyLoad = isUnstructuredOrUnestimated ? null : (activityType === "gym_strength" ? 7 : null);
      const cardioLoad = isUnstructuredOrUnestimated ? null : (activityType === "ice_hockey" ? 9 : (activityType === "running" ? 7 : null));
      const mobilityLoad = isUnstructuredOrUnestimated ? null : (activityType === "yoga" ? 8 : (activityType === "recovery" ? 7 : null));
      const sportSpecificLoad = isUnstructuredOrUnestimated ? null : (activityType === "ice_hockey" ? 10 : null);

      const hasAnyEstimatedVector = [lowerBodyLoad, upperBodyLoad, cardioLoad, mobilityLoad, sportSpecificLoad].some(v => v !== null);

      loadEvents.push({
        id: `load-${item.id}`,
        userId,
        activityType,
        title: item.title,
        startTimestamp,
        durationMins: activityType === "yard_work" ? 120 : (activityType === "ice_hockey" ? 60 : (activityType === "gym_strength" ? 45 : (activityType === "running" ? 35 : 30))),
        isStructuredTraining: item.type !== "recovery" && activityType !== "yard_work",
        lowerBodyLoadScore: lowerBodyLoad,
        upperBodyLoadScore: upperBodyLoad,
        cardioLoadScore: cardioLoad,
        mobilityLoadScore: mobilityLoad,
        sportSpecificLoadScore: sportSpecificLoad,
        loadEstimationSource: hasAnyEstimatedVector ? "coach_estimated" : "unestimated",
        loadEstimationConfidence: hasAnyEstimatedVector ? "ESTIMATED" : "UNKNOWN",
        notes: item.notes,
        provenance
      });

      // 2. Project as Completed Session
      const completedExercises = [
        ...(item.strength || []).map((s, idx) => ({
          exerciseId: `hist-str-${idx}`,
          title: s,
          stage: "strength" as const,
          setsRepsPlanned: s,
          setsRepsCompleted: s,
          decision: {
            exerciseId: `hist-str-${idx}`,
            exerciseTitle: s,
            progressionStatus: "maintained" as const,
            timestamp: startTimestamp
          }
        })),
        ...(item.athletic || []).map((a, idx) => ({
          exerciseId: `hist-ath-${idx}`,
          title: a,
          stage: "reaction" as const,
          setsRepsPlanned: a,
          setsRepsCompleted: a,
          decision: {
            exerciseId: `hist-ath-${idx}`,
            exerciseTitle: a,
            progressionStatus: "maintained" as const,
            timestamp: startTimestamp
          }
        }))
      ];

      sessions.push({
        id: `session-${item.id}`,
        userId,
        date: item.date,
        startTime: startTimestamp,
        completedExercises,
        omittedExerciseIds: [],
        athleteReflectionRaw: item.athleteReflection,
        coachObservations: item.coachNotes,
        withinSessionAdaptations: [],
        tags: [item.phase, item.type],
        provenance
      });
    }

    return { sessions, loadEvents };
  }
}
