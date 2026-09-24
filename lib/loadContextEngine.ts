/**
 * COACH CARD MULTI-HORIZON LOAD CONTEXT ENGINE
 * Version: 2026-09-16 (Phase 3)
 *
 * Governing Principle:
 * - Read Athlete Track rather than conversational memory.
 * - Reason across 24h, 48h, 72h, and 7d horizons from known facts.
 * - Truth in load sensing: Never fabricate arbitrary physiological load scores.
 * - If load magnitude is unestimated/unknown, it remains UNKNOWN.
 * - Combine known activity exposures directly with current athlete state rather than manufacturing fatigue classifications.
 */

import { LoadEvent, MultiHorizonLoadContext, LoadHorizonSummary } from './athleteTypes';

export class LoadContextEngine {
  /**
   * Evaluates historical load events across 24h, 48h, 72h, and 7d horizons relative to a target timestamp.
   */
  static evaluateLoadContext(
    events: LoadEvent[],
    targetIsoTimestamp: string = new Date().toISOString()
  ): MultiHorizonLoadContext {
    const targetMs = new Date(targetIsoTimestamp).getTime();

    const horizon24h = this.calculateHorizonSummary(events, targetMs, 24);
    const horizon48h = this.calculateHorizonSummary(events, targetMs, 48);
    const horizon72h = this.calculateHorizonSummary(events, targetMs, 72);
    const horizon7d = this.calculateHorizonSummary(events, targetMs, 168);

    // Find last dates for specific exposures
    let lastLowerBodyOverloadDate: string | undefined = undefined;
    let lastOnIcePerformanceDate: string | undefined = undefined;

    const sortedEvents = [...events].sort(
      (a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime()
    );

    for (const evt of sortedEvents) {
      const evtMs = new Date(evt.startTimestamp).getTime();
      if (evtMs <= targetMs) {
        if (!lastOnIcePerformanceDate && (evt.activityType === 'ice_hockey' || evt.activityType === 'tryout' || evt.activityType === 'stick_and_puck')) {
          lastOnIcePerformanceDate = evt.startTimestamp.slice(0, 10);
        }
        if (!lastLowerBodyOverloadDate && (evt.lowerBodyLoadScore !== null && evt.lowerBodyLoadScore >= 6)) {
          lastLowerBodyOverloadDate = evt.startTimestamp.slice(0, 10);
        }
      }
    }

    return {
      horizon24h,
      horizon48h,
      horizon72h,
      horizon7d,
      lastLowerBodyOverloadDate,
      lastOnIcePerformanceDate
    };
  }

  private static calculateHorizonSummary(
    events: LoadEvent[],
    targetMs: number,
    windowHours: 24 | 48 | 72 | 168
  ): LoadHorizonSummary {
    const windowMs = windowHours * 60 * 60 * 1000;
    const windowStartMs = targetMs - windowMs;

    const matchingEvents = events.filter(evt => {
      const evtMs = new Date(evt.startTimestamp).getTime();
      return evtMs >= windowStartMs && evtMs <= targetMs;
    });

    let totalDurationMins = 0;
    let knownLowerBodyExposures = 0;
    let knownUpperBodyExposures = 0;
    let knownSportSpecificExposures = 0;
    let hasUnknownLoadMagnitudes = false;
    const unstructuredActivityMentions: string[] = [];
    const activities: { activityType: string; title: string; durationMins: number; isStructured: boolean }[] = [];

    for (const evt of matchingEvents) {
      totalDurationMins += evt.durationMins || 0;
      activities.push({
        activityType: evt.activityType,
        title: evt.title,
        durationMins: evt.durationMins || 0,
        isStructured: evt.isStructuredTraining
      });

      if (evt.lowerBodyLoadScore !== null && evt.lowerBodyLoadScore > 0) {
        knownLowerBodyExposures++;
      }
      if (evt.upperBodyLoadScore !== null && evt.upperBodyLoadScore > 0) {
        knownUpperBodyExposures++;
      }
      if (evt.sportSpecificLoadScore !== null && evt.sportSpecificLoadScore > 0) {
        knownSportSpecificExposures++;
      }

      if (!evt.isStructuredTraining || evt.loadEstimationConfidence === 'UNKNOWN' || evt.loadEstimationSource === 'unestimated') {
        hasUnknownLoadMagnitudes = true;
        unstructuredActivityMentions.push(`${evt.title} (${evt.durationMins}m)`);
      }
    }

    return {
      windowHours,
      completedEventCount: matchingEvents.length,
      totalDurationMins,
      activities,
      knownLowerBodyExposures,
      knownUpperBodyExposures,
      knownSportSpecificExposures,
      unstructuredActivityMentions,
      hasUnknownLoadMagnitudes
    };
  }

  /**
   * Produces a human-readable factual summary of recent exposures without manufacturing unverified fatigue inferences.
   */
  static formatFactualExposureSummary(context: MultiHorizonLoadContext): string {
    const recent48h = context.horizon48h;
    if (recent48h.completedEventCount === 0) {
      return "No recent training or physical activity recorded in the last 48 hours.";
    }

    const activityList = recent48h.activities
      .map(a => `${a.title}${a.durationMins > 0 ? ` (${a.durationMins}m)` : ''}`)
      .join(', ');

    let summary = `48h activity exposure includes: ${activityList}.`;
    if (recent48h.hasUnknownLoadMagnitudes) {
      summary += " (Physiological magnitude for some exposures is unestimated).";
    }
    return summary;
  }
}
