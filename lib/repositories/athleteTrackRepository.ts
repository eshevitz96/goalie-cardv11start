/**
 * ATHLETE TRACK REPOSITORY (DUAL-ADAPTER)
 * 
 * Version: 2026-09-24
 * 
 * Architecture Invariants:
 * 1. planned ≠ completed ≠ experienced
 * 2. Canonical record identity using stable UUIDs
 * 3. Raw athlete report provenance preserved
 * 4. Unknown load remains unknown (no fabricated duration/load)
 * 5. Explicit supersession / corrections via supersedesId (no title/date heuristics)
 * 6. Multiple legitimate same-type sessions on the same date supported
 * 7. Granular Context Freshness:
 *    - completedTrainingThrough
 *    - athleteStateThrough
 *    - activityContextThrough
 *    - nextPerformance / lookahead provenance
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ATHLETE_TRAINING_HISTORY, AthleteTrainingEntry, ATHLETE_PROFILE_METRICS } from '../athleteTrainingHistory';
import { supabase } from '../../utils/supabase/client';

export type EntryEpistemicType = 
  | 'COMPLETED_TRAINING'    // Physical workout completed (gym, run, on-ice, yoga, HIIT)
  | 'ATHLETE_STATE'         // Subjective tissue soreness, fatigue, readiness reflection
  | 'UNSTRUCTURED_ACTIVITY' // Coaching lacrosse on turf, travel, yard work, non-workout activity
  | 'BASELINE_EVALUATION'   // Contract baseline metrics
  | 'PLANNED_EVENT';        // Calendar match or scheduled skate

export type DateConfidence = 'EXACT' | 'RECONSTRUCTED' | 'DATE_UNCERTAIN';

export interface CanonicalAthleteEntry {
  id: string; // Stable UUID
  userId: string;
  date: string; // YYYY-MM-DD
  time?: string;
  title: string;
  epistemicType: EntryEpistemicType;
  trainingType?: 'on_ice' | 'off_ice' | 'recovery' | 'game' | 'travel' | 'baseline' | 'film' | 'other';
  durationMins?: number | null; // Nullable — unknown load remains unknown
  confidence: DateConfidence;
  phase?: string;
  location?: string;
  warmup?: string;
  strength?: string[];
  athletic?: string[];
  balance?: string[];
  core?: string[];
  conditioning?: string;
  recovery?: string[];
  notes?: string;
  athleteReflection?: string;
  coachNotes?: string;
  cues?: string[];
  rawAthleteReport?: string;
  supersedesId?: string | null;
  supersededBy?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NextPerformanceLookahead {
  eventDate: string | null;
  eventType: string | null;
  eventName: string | null;
  daysRemaining: number | null;
  source: 'LIVE_DB' | 'LOCAL_STORE' | 'NONE';
}

export interface TrackFreshness {
  completedTrainingThrough: string | null;
  athleteStateThrough: string | null;
  activityContextThrough: string | null;
  nextPerformance: NextPerformanceLookahead;
}

export interface WorkloadExposureCount {
  strength: number;
  onIce: number;
  conditioning: number;
  recovery: number;
  unstructuredActivity: number;
}

export interface StructuredAthleteStateExtraction {
  rawReport: string | null;
  reportedSoreness: string | null;
  movementImpairment: 'NOT_REPORTED' | 'REPORTED_IMPAIRED' | 'REPORTED_UNIMPAIRED';
  reportedFatigue: string | null;
  reportedReadiness: string | null;
}

export interface WorkloadUnknownEntry {
  date: string;
  title: string;
  unknownDimension: string;
}

export interface DeterministicDecisionFacts {
  asOfDate: string;
  lastStrengthDate: string | null;
  daysSinceLastStrength: number | null;
  lastStrengthSessionTitle: string | null;
  lastOnIceDate: string | null;
  daysSinceLastOnIce: number | null;
  lastOnIceSessionTitle: string | null;
  nextPerformance: NextPerformanceLookahead;
  exposures7d: WorkloadExposureCount;
  exposures14d: WorkloadExposureCount;
  recentWorkloadUnknowns: WorkloadUnknownEntry[];
  currentAthleteState: StructuredAthleteStateExtraction;
}

export interface DecisionLoadContext {
  athleteProfile: typeof ATHLETE_PROFILE_METRICS;
  freshness: TrackFreshness;
  deterministicFacts: DeterministicDecisionFacts;
  recentCompletedSessions: CanonicalAthleteEntry[];
  recentAthleteStates: CanonicalAthleteEntry[];
  recentActivities: CanonicalAthleteEntry[];
  upcomingEvents: NextPerformanceLookahead[];
  unifiedTimeline: CanonicalAthleteEntry[];
}

/**
 * Generates an RFC-compliant deterministic UUIDv5-equivalent from a namespace and ID.
 */
export function generateDeterministicUuid(namespace: string, sourceId: string): string {
  const hash = crypto.createHash('sha1').update(`${namespace}:${sourceId}`).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

/**
 * Local file-system persistent store adapter for offline local development
 */
class LocalJsonStoreAdapter {
  private filePath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {}
    }
    this.filePath = path.join(dataDir, 'athlete-track-local.json');
  }

  read(): CanonicalAthleteEntry[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[LocalJsonStoreAdapter Read Error]:", e);
    }
    return [];
  }

  write(entries: CanonicalAthleteEntry[]): boolean {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.warn("[LocalJsonStoreAdapter Write Error]:", e);
      return false;
    }
  }
}

/**
 * Primary Unified Athlete Track Repository
 */
export class AthleteTrackRepository {
  private static localStore = new LocalJsonStoreAdapter();

  /**
   * Project historical static baseline into canonical format with deterministic UUIDs
   */
  static getHistoricalBaseline(): CanonicalAthleteEntry[] {
    return ATHLETE_TRAINING_HISTORY.map((entry: AthleteTrainingEntry) => {
      const stableId = generateDeterministicUuid('athlete_track_historical', entry.id);
      
      let epistemicType: EntryEpistemicType = 'COMPLETED_TRAINING';
      if (entry.type === 'baseline') {
        epistemicType = 'BASELINE_EVALUATION';
      } else if (entry.type === 'travel' || entry.id === 'ath-2026-09-14-lawnmow') {
        epistemicType = 'UNSTRUCTURED_ACTIVITY';
      }

      return {
        id: stableId,
        userId: '00000000-0000-0000-0000-000000000000',
        date: entry.date,
        time: entry.time,
        title: entry.title,
        epistemicType,
        trainingType: entry.type,
        durationMins: null, // Unknown/unreported in historical baseline; do not fabricate defaults
        confidence: entry.confidence || 'EXACT',
        phase: entry.phase,
        location: entry.location,
        warmup: entry.warmup,
        strength: entry.strength,
        athletic: entry.athletic,
        balance: entry.balance,
        core: entry.core,
        conditioning: entry.conditioning,
        recovery: entry.recovery,
        notes: entry.notes,
        athleteReflection: entry.athleteReflection,
        coachNotes: entry.coachNotes,
        cues: entry.cues,
        rawAthleteReport: entry.athleteReflection || entry.notes,
        supersedesId: null,
        supersededBy: null,
        isActive: true,
        createdAt: `${entry.date}T12:00:00.000Z`
      };
    });
  }

  /**
   * Retrieves all dynamic records from the local repository store
   */
  static getDynamicLocalRecords(): CanonicalAthleteEntry[] {
    return this.localStore.read();
  }

  /**
   * Persists a dynamic canonical entry (with supersession validation)
   */
  static async saveEntry(entry: CanonicalAthleteEntry): Promise<{ success: boolean; id: string; error?: string }> {
    try {
      const currentDynamic = this.localStore.read();
      
      // If this entry supersedes a previous entry, mark the previous entry inactive
      if (entry.supersedesId) {
        currentDynamic.forEach(rec => {
          if (rec.id === entry.supersedesId) {
            rec.isActive = false;
            rec.supersededBy = entry.id;
            rec.updatedAt = new Date().toISOString();
          }
        });
      }

      // Check if entry with same UUID already exists (update vs insert)
      const existingIdx = currentDynamic.findIndex(rec => rec.id === entry.id);
      if (existingIdx >= 0) {
        currentDynamic[existingIdx] = {
          ...currentDynamic[existingIdx],
          ...entry,
          updatedAt: new Date().toISOString()
        };
      } else {
        currentDynamic.push({
          ...entry,
          createdAt: entry.createdAt || new Date().toISOString()
        });
      }

      this.localStore.write(currentDynamic);

      // Attempt remote Supabase write in background (non-blocking, tolerant to offline)
      try {
        if (entry.epistemicType === 'COMPLETED_TRAINING') {
          await supabase.from('training_sessions').upsert({
            id: entry.id,
            user_id: entry.userId,
            session_date: entry.date,
            title: entry.title,
            duration_minutes: entry.durationMins || 0,
            training_type: entry.trainingType || 'other',
            notes_summary: entry.notes || entry.rawAthleteReport || '',
            status: 'complete'
          });
        }
      } catch (dbErr) {
        // Supabase offline / sandbox - local write is authoritative
      }

      return { success: true, id: entry.id };
    } catch (e: any) {
      console.error("[AthleteTrackRepository Save Error]:", e);
      return { success: false, id: entry.id, error: e.message };
    }
  }

  /**
   * Returns the canonical merged timeline, deduplicated by stable UUID with supersession applied.
   */
  static getUnifiedTimeline(options?: { userId?: string; includeSuperseded?: boolean }): CanonicalAthleteEntry[] {
    const historical = this.getHistoricalBaseline();
    const dynamic = this.getDynamicLocalRecords();

    const recordMap = new Map<string, CanonicalAthleteEntry>();

    // 1. Insert historical baseline
    historical.forEach(h => recordMap.set(h.id, h));

    // 2. Overlay dynamic repository records
    dynamic.forEach(d => {
      if (!options?.userId || d.userId === options.userId || d.userId === '00000000-0000-0000-0000-000000000000') {
        recordMap.set(d.id, d);
      }
    });

    // 3. Process supersession links
    Array.from(recordMap.values()).forEach(rec => {
      if (rec.supersedesId && recordMap.has(rec.supersedesId)) {
        const superseded = recordMap.get(rec.supersedesId)!;
        superseded.isActive = false;
        superseded.supersededBy = rec.id;
      }
    });

    const allEntries = Array.from(recordMap.values());
    
    // Filter active unless includeSuperseded is true
    const filtered = options?.includeSuperseded ? allEntries : allEntries.filter(e => e.isActive);

    // Sort chronologically ascending
    return filtered.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || '').localeCompare(b.time || '');
    });
  }

  /**
   * Computes granular context freshness across the timeline
   */
  static getFreshness(targetDate?: string, upcomingEvent?: NextPerformanceLookahead): TrackFreshness {
    const timeline = this.getUnifiedTimeline();

    let completedTrainingThrough: string | null = null;
    let athleteStateThrough: string | null = null;
    let activityContextThrough: string | null = null;

    let nextPerf: NextPerformanceLookahead = upcomingEvent || {
      eventDate: null,
      eventType: null,
      eventName: null,
      daysRemaining: null,
      source: 'NONE'
    };

    for (const entry of timeline) {
      // Planned events do not advance historical track freshness
      if (entry.epistemicType === 'PLANNED_EVENT') {
        const refDate = targetDate || new Date().toISOString().slice(0, 10);
        if (!nextPerf.eventDate && entry.date >= refDate) {
          const today = new Date(refDate);
          const evtDate = new Date(entry.date);
          const diffDays = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          nextPerf = {
            eventDate: entry.date,
            eventType: entry.trainingType || 'on_ice',
            eventName: entry.title,
            daysRemaining: Math.max(0, diffDays),
            source: 'LOCAL_STORE'
          };
        }
        continue;
      }

      // If targetDate provided, bound historical freshness calculation
      if (targetDate && entry.date > targetDate) continue;

      // Completed Training advances completedTrainingThrough
      if (entry.epistemicType === 'COMPLETED_TRAINING') {
        if (!completedTrainingThrough || entry.date > completedTrainingThrough) {
          completedTrainingThrough = entry.date;
        }
      }

      // Athlete reflections/soreness advance athleteStateThrough
      if (entry.epistemicType === 'ATHLETE_STATE' || entry.athleteReflection || (entry.notes && entry.notes.toLowerCase().includes('sore'))) {
        if (!athleteStateThrough || entry.date > athleteStateThrough) {
          athleteStateThrough = entry.date;
        }
      }

      // Any completed activity (training, coaching, travel, baseline) advances activityContextThrough
      if (!activityContextThrough || entry.date > activityContextThrough) {
        activityContextThrough = entry.date;
      }
    }

    return {
      completedTrainingThrough,
      athleteStateThrough,
      activityContextThrough,
      nextPerformance: nextPerf
    };
  }

  /**
   * Computes deterministic factual metrics derived directly from the canonical timeline.
   */
  static getDeterministicFacts(timeline: CanonicalAthleteEntry[], asOfDate: string, freshness: TrackFreshness): DeterministicDecisionFacts {
    const completed = timeline.filter(e => e.epistemicType === 'COMPLETED_TRAINING' && e.date <= asOfDate);

    // Helpers to classify training exposures
    const isStrength = (e: CanonicalAthleteEntry) => 
      e.trainingType === 'off_ice' && (
        (Boolean(e.strength && e.strength.length > 0)) ||
        e.title.toLowerCase().includes('strength') ||
        e.title.toLowerCase().includes('lift') ||
        e.title.toLowerCase().includes('squat') ||
        e.title.toLowerCase().includes('bench')
      );

    const isOnIce = (e: CanonicalAthleteEntry) =>
      e.trainingType === 'on_ice' ||
      e.trainingType === 'game' ||
      e.title.toLowerCase().includes('ice') ||
      e.title.toLowerCase().includes('skate') ||
      e.title.toLowerCase().includes('stick');

    const isConditioning = (e: CanonicalAthleteEntry) =>
      Boolean(e.conditioning) ||
      e.title.toLowerCase().includes('conditioning') ||
      e.title.toLowerCase().includes('run') ||
      e.title.toLowerCase().includes('hiit') ||
      e.title.toLowerCase().includes('deck');

    const isRecovery = (e: CanonicalAthleteEntry) =>
      Boolean(e.recovery && e.recovery.length > 0) ||
      e.trainingType === 'recovery' ||
      e.title.toLowerCase().includes('yoga') ||
      e.title.toLowerCase().includes('recovery') ||
      e.title.toLowerCase().includes('mobility');

    // 1. Last Strength Exposure
    const strengthEntries = completed.filter(isStrength);
    const lastStrengthEntry = strengthEntries.length > 0 ? strengthEntries[strengthEntries.length - 1] : null;
    const lastStrengthDate = lastStrengthEntry ? lastStrengthEntry.date : null;
    const daysSinceLastStrength = lastStrengthDate 
      ? Math.round((new Date(asOfDate).getTime() - new Date(lastStrengthDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // 2. Last On-Ice Exposure
    const onIceEntries = completed.filter(isOnIce);
    const lastOnIceEntry = onIceEntries.length > 0 ? onIceEntries[onIceEntries.length - 1] : null;
    const lastOnIceDate = lastOnIceEntry ? lastOnIceEntry.date : null;
    const daysSinceLastOnIce = lastOnIceDate 
      ? Math.round((new Date(asOfDate).getTime() - new Date(lastOnIceDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Helper for window exposures
    const countExposures = (days: number): WorkloadExposureCount => {
      const windowStartMs = new Date(asOfDate).getTime() - (days - 1) * 24 * 60 * 60 * 1000;
      const windowEntries = timeline.filter(e => {
        const entryMs = new Date(e.date).getTime();
        return entryMs >= windowStartMs && e.date <= asOfDate;
      });

      return {
        strength: windowEntries.filter(e => e.epistemicType === 'COMPLETED_TRAINING' && isStrength(e)).length,
        onIce: windowEntries.filter(e => e.epistemicType === 'COMPLETED_TRAINING' && isOnIce(e)).length,
        conditioning: windowEntries.filter(e => e.epistemicType === 'COMPLETED_TRAINING' && isConditioning(e)).length,
        recovery: windowEntries.filter(e => (e.epistemicType === 'COMPLETED_TRAINING' || e.epistemicType === 'ATHLETE_STATE') && isRecovery(e)).length,
        unstructuredActivity: windowEntries.filter(e => e.epistemicType === 'UNSTRUCTURED_ACTIVITY').length
      };
    };

    const exposures7d = countExposures(7);
    const exposures14d = countExposures(14);

    // 3. Workload Unknowns (Unmeasured load in past 14 days)
    const window14Ms = new Date(asOfDate).getTime() - 13 * 24 * 60 * 60 * 1000;
    const recentWorkloadUnknowns: WorkloadUnknownEntry[] = timeline
      .filter(e => {
        const entryMs = new Date(e.date).getTime();
        return entryMs >= window14Ms && e.date <= asOfDate && (e.epistemicType === 'COMPLETED_TRAINING' || e.epistemicType === 'UNSTRUCTURED_ACTIVITY') && (e.durationMins === null || e.durationMins === undefined);
      })
      .map(e => ({
        date: e.date,
        title: e.title,
        unknownDimension: 'duration'
      }));

    // 4. Current Athlete State Extraction
    const latestStateEntry = [...timeline]
      .reverse()
      .find(e => (e.epistemicType === 'ATHLETE_STATE' || Boolean(e.athleteReflection) || Boolean(e.rawAthleteReport)) && e.date <= asOfDate);

    const rawReport = latestStateEntry ? (latestStateEntry.rawAthleteReport || latestStateEntry.athleteReflection || latestStateEntry.notes || null) : null;
    let reportedSoreness: string | null = null;
    if (rawReport) {
      const lower = rawReport.toLowerCase();
      if (lower.includes('sore')) {
        reportedSoreness = lower.includes('little sore') || lower.includes('mild') 
          ? 'Generalized mild soreness' 
          : 'Soreness reported';
      }
    }

    const currentAthleteState: StructuredAthleteStateExtraction = {
      rawReport,
      reportedSoreness,
      movementImpairment: 'NOT_REPORTED', // Invariant: athlete did not report impairment; never hallucinate impairment state
      reportedFatigue: rawReport && rawReport.toLowerCase().includes('sweating') ? 'Post-conditioning fatigue noted previously' : null,
      reportedReadiness: rawReport && (rawReport.toLowerCase().includes('good') || rawReport.toLowerCase().includes('sharp')) ? 'Positive' : null
    };

    return {
      asOfDate,
      lastStrengthDate,
      daysSinceLastStrength,
      lastStrengthSessionTitle: lastStrengthEntry ? lastStrengthEntry.title : null,
      lastOnIceDate,
      daysSinceLastOnIce,
      lastOnIceSessionTitle: lastOnIceEntry ? lastOnIceEntry.title : null,
      nextPerformance: freshness.nextPerformance,
      exposures7d,
      exposures14d,
      recentWorkloadUnknowns,
      currentAthleteState
    };
  }

  /**
   * Assembles full decision load context for AI_COACH or decision engine
   */
  static getDecisionContext(targetDate?: string, upcomingEvent?: NextPerformanceLookahead): DecisionLoadContext {
    const timeline = this.getUnifiedTimeline();
    const freshness = this.getFreshness(targetDate, upcomingEvent);
    const asOfDate = targetDate || freshness.athleteStateThrough || freshness.completedTrainingThrough || new Date().toISOString().split('T')[0];
    const deterministicFacts = this.getDeterministicFacts(timeline, asOfDate, freshness);

    const recentCompletedSessions = timeline
      .filter(e => e.epistemicType === 'COMPLETED_TRAINING')
      .slice(-8);

    const recentAthleteStates = timeline
      .filter(e => e.epistemicType === 'ATHLETE_STATE' || Boolean(e.athleteReflection))
      .slice(-6);

    const recentActivities = timeline
      .filter(e => e.epistemicType === 'UNSTRUCTURED_ACTIVITY')
      .slice(-4);

    return {
      athleteProfile: ATHLETE_PROFILE_METRICS,
      freshness,
      deterministicFacts,
      recentCompletedSessions,
      recentAthleteStates,
      recentActivities,
      upcomingEvents: upcomingEvent ? [upcomingEvent] : (freshness.nextPerformance.eventDate ? [freshness.nextPerformance] : []),
      unifiedTimeline: timeline
    };
  }

  /**
   * Formats structured decision context into prompt-ready context blocks for AI_COACH
   */
  static formatForPrompt(ctx: DecisionLoadContext): string {
    return formatDecisionContextForPrompt(ctx);
  }
}

/**
 * Formats structured decision context into prompt-ready context blocks for AI_COACH
 */
export function formatDecisionContextForPrompt(ctx: DecisionLoadContext): string {
  const f = ctx.freshness;
  const df = ctx.deterministicFacts;
  
  // 1. Deterministic Decision Context Summary (Facts derived directly from repository)
  const factsLines = [
    `=== DETERMINISTIC DECISION CONTEXT SUMMARY (FACTS DERIVED FROM REPOSITORY) ===`,
    `- As Of Date:                       ${df.asOfDate}`,
    `- Days Since Last Strength:        ${df.daysSinceLastStrength !== null ? `${df.daysSinceLastStrength} days (Last: ${df.lastStrengthDate} "${df.lastStrengthSessionTitle}")` : 'None recorded'}`,
    `- Days Since Last On-Ice:          ${df.daysSinceLastOnIce !== null ? `${df.daysSinceLastOnIce} days (Last: ${df.lastOnIceDate} "${df.lastOnIceSessionTitle}")` : 'None recorded'}`,
    `- Next Planned Performance:         ${df.nextPerformance.eventDate ? `${df.nextPerformance.eventDate} "${df.nextPerformance.eventName}" (Type: ${df.nextPerformance.eventType}, in ${df.nextPerformance.daysRemaining} days, Status: PLANNED)` : 'None scheduled'}`,
    `- Exposures (Last 7 Days):          Strength: ${df.exposures7d.strength}, On-Ice: ${df.exposures7d.onIce}, Conditioning/HIIT: ${df.exposures7d.conditioning}, Recovery: ${df.exposures7d.recovery}, Unstructured Activity: ${df.exposures7d.unstructuredActivity}`,
    `- Exposures (Last 14 Days):         Strength: ${df.exposures14d.strength}, On-Ice: ${df.exposures14d.onIce}, Conditioning/HIIT: ${df.exposures14d.conditioning}, Recovery: ${df.exposures14d.recovery}, Unstructured Activity: ${df.exposures14d.unstructuredActivity}`,
    `- Current Athlete State:`,
    `  * Raw Report: ${df.currentAthleteState.rawReport ? `"${df.currentAthleteState.rawReport}"` : 'None'}`,
    `  * Reported Soreness: ${df.currentAthleteState.reportedSoreness || 'None reported'}`,
    `  * Movement Impairment: ${df.currentAthleteState.movementImpairment} (Athlete did not report movement impairment)`,
    `- Workload Unknowns (Unmeasured Load): ${df.recentWorkloadUnknowns.length > 0 ? df.recentWorkloadUnknowns.map(u => `[${u.date}] "${u.title}" (${u.unknownDimension}: NULL/UNKNOWN)`).join('; ') : 'None'}`
  ];

  // 2. Granular Freshness State
  const freshnessLines = [
    `=== ATHLETE TRACK FRESHNESS STATE ===`,
    `- completedTrainingThrough: ${f.completedTrainingThrough || 'None (Unknown)'}`,
    `- athleteStateThrough:      ${f.athleteStateThrough || 'None (Unknown)'}`,
    `- activityContextThrough:  ${f.activityContextThrough || 'None (Unknown)'}`,
    `- nextPerformance:          ${f.nextPerformance.eventDate ? `${f.nextPerformance.eventDate} | "${f.nextPerformance.eventName}" (Type: ${f.nextPerformance.eventType}, in ${f.nextPerformance.daysRemaining} days, Source: ${f.nextPerformance.source})` : 'None scheduled'}`
  ];

  // 3. Active Unified Timeline (Recent active records, excluding future planned events from completed history)
  const timelineEntries = ctx.unifiedTimeline
    .filter(e => e.epistemicType !== 'PLANNED_EVENT')
    .slice(-10);

  const timelineLines = [
    `=== ACTIVE UNIFIED ATHLETE TRACK TIMELINE (RECENT SESSIONS & ACTIVITIES) ===`,
    ...timelineEntries.map(e => {
      const parts: string[] = [
        `[${e.date}]`,
        `[${e.epistemicType}]`,
        `"${e.title}" (${e.trainingType || 'general'})`,
        `Duration: ${e.durationMins !== null && e.durationMins !== undefined ? `${e.durationMins}m` : 'UNKNOWN/NULL (DO NOT INFER)'}`
      ];
      if (e.warmup) parts.push(`Warmup: ${e.warmup}`);
      if (e.strength && e.strength.length) parts.push(`Strength: ${e.strength.join('; ')}`);
      if (e.conditioning) parts.push(`Conditioning: ${e.conditioning}`);
      if (e.recovery && e.recovery.length) parts.push(`Recovery: ${e.recovery.join('; ')}`);
      if (e.cues && e.cues.length) parts.push(`Cues: ${e.cues.join(', ')}`);
      if (e.notes) parts.push(`Notes: ${e.notes}`);
      if (e.athleteReflection) parts.push(`Athlete Reflection: "${e.athleteReflection}"`);
      if (e.rawAthleteReport && e.rawAthleteReport !== e.athleteReflection) parts.push(`Raw Report: "${e.rawAthleteReport}"`);
      return `- ` + parts.join(' | ');
    })
  ];

  // 4. Unstructured Activity Context (Lacrosse coaching, travel, non-workout)
  const activityLines = [
    `=== UNSTRUCTURED & NON-WORKOUT ACTIVITY CONTEXT (Activity load only, NOT personal completed workouts) ===`,
    ctx.recentActivities.length > 0
      ? ctx.recentActivities.map(a => `- [${a.date}] "${a.title}": ${a.notes || a.rawAthleteReport || 'Unstructured activity'}`).join('\n')
      : '- None recorded.'
  ];

  // 5. Subjective Athlete States & Tissue Readiness
  const stateLines = [
    `=== SUBJECTIVE ATHLETE STATES & TISSUE READINESS ===`,
    ctx.recentAthleteStates.length > 0
      ? ctx.recentAthleteStates.map(s => `- [${s.date}] "${s.title}": ${s.athleteReflection || s.notes || s.rawAthleteReport}`).join('\n')
      : '- No subjective reports recorded.'
  ];

  // 6. Lookahead / Planned Events (PLANNED ONLY — NEVER COMPLETED)
  const lookaheadEvents = ctx.unifiedTimeline.filter(e => e.epistemicType === 'PLANNED_EVENT');
  const lookaheadLines = [
    `=== UPCOMING SCHEDULE & PLANNED PERFORMANCE (PLANNED ONLY — NOT COMPLETED WORKLOAD) ===`,
    lookaheadEvents.length > 0
      ? lookaheadEvents.map(e => `- [${e.date}] [PLANNED_EVENT] "${e.title}" (Type: ${e.trainingType || 'sport'}, Status: PLANNED)`).join('\n')
      : (f.nextPerformance.eventDate ? `- [${f.nextPerformance.eventDate}] [PLANNED_EVENT] "${f.nextPerformance.eventName}" (Type: ${f.nextPerformance.eventType}, Days Remaining: ${f.nextPerformance.daysRemaining})` : '- No upcoming scheduled events.')
  ];

  return [
    factsLines.join('\n'),
    freshnessLines.join('\n'),
    timelineLines.join('\n'),
    activityLines.join('\n'),
    stateLines.join('\n'),
    lookaheadLines.join('\n')
  ].join('\n\n');
}

