/**
 * COACH CARD NATURAL-LANGUAGE STATE EXTRACTION ENGINE
 * Version: 2026-09-16 (Phase 2)
 *
 * Core Rules:
 * 1. NULL IS NOT NEUTRAL: Unreported dimensions remain null.
 * 2. AMBIGUOUS EXTRACTION: Terms like "slow" trigger a clarification prompt and do not influence prescription until resolved.
 * 3. TRANSIENT SORENESS: Tags as transient_resolves with reassessmentStatus: 'pending_warmup'.
 * 4. PROGRESSIVE / PAIN SAFETY GATE: Tags as progressive or movement_altering to trigger safety notice.
 * 5. RAW TEXT IS IMMUTABLE: Preserves verbatim athlete input.
 */

import {
  StructuredReadinessVectors,
  PreSessionAthleteState,
  AmbiguousInterpretation,
  PhysicalSensation,
  NeuromuscularQuality,
  MentalState,
  GoalieState,
  SorenessBehavior,
  SorenessLocation,
  WithinSessionAdaptation
} from './athleteTypes';

export class StateExtractionEngine {
  /**
   * Parse Pre-Session Athlete Natural Language
   */
  static parsePreSessionText(rawText: string): PreSessionAthleteState {
    const text = rawText.trim().toLowerCase();
    const ambiguities: AmbiguousInterpretation[] = [];

    // Initialize all vectors to NULL (Null is not neutral)
    let physical: PhysicalSensation | null = null;
    let neuromuscular: NeuromuscularQuality | null = null;
    let mental: MentalState | null = null;
    let goalieState: GoalieState | null = null;
    
    let sorenessBehavior: SorenessBehavior = 'none';
    const sorenessLocations: SorenessLocation[] = [];
    let sorenessNotes: string | undefined = undefined;

    if (!text) {
      return {
        rawReport: rawText,
        structured: {
          physical: null,
          neuromuscular: null,
          mental: null,
          goalieState: null,
          soreness: { behavior: 'none', locations: [] }
        },
        confirmationStatus: 'unconfirmed',
        extractionConfidence: 'MANUAL',
        timestamp: new Date().toISOString()
      };
    }

    // 1. Detect Ambiguities First
    // Ambiguity A: "slow" (Could be sluggish body or calm/clear mind or pacing)
    if (/\b(slow|slower)\b/.test(text)) {
      const hasMindContext = /\b(mind|head|thinking|brain)\b/.test(text);
      const hasBodyContext = /\b(body|legs|feet|muscles|moving)\b/.test(text);

      if (hasMindContext && !hasBodyContext) {
        mental = 'slow_clear';
      } else if (hasBodyContext && !hasMindContext) {
        neuromuscular = 'sluggish';
      } else {
        // Truly ambiguous
        ambiguities.push({
          rawPhrase: "slow",
          clarificationPrompt: "When you say slow — body sluggish or mind calm and clear?",
          candidateOptions: [
            { label: "Body is sluggish / slow legs", vectorKey: "neuromuscular", value: "sluggish" },
            { label: "Mind is calm / slow & clear", vectorKey: "mental", value: "slow_clear" },
            { label: "Both body sluggish & mind calm", vectorKey: "neuromuscular", value: "sluggish" }
          ]
        });
      }
    }

    // Ambiguity B: "loose" (Could be loose muscles / relaxed or loose focus / sloppy)
    if (/\bloose\b/.test(text)) {
      if (/\b(focus|mind|sloppy)\b/.test(text)) {
        ambiguities.push({
          rawPhrase: "loose",
          clarificationPrompt: "Did you mean loose and relaxed physically, or loose focus?",
          candidateOptions: [
            { label: "Physically loose and relaxed", vectorKey: "physical", value: "loose" },
            { label: "Unfocused / sloppy", vectorKey: "mental", value: "rushed" }
          ]
        });
      } else {
        physical = 'loose';
      }
    }

    // 2. Physical Sensation Extraction
    if (/\b(springy|explosive|bouncy|popping)\b/.test(text)) {
      physical = 'springy';
    } else if (/\b(strong|powerful|solid|locked in)\b/.test(text)) {
      physical = 'strong';
    } else if (/\b(heavy|dead legs|tired|exhausted|fatigued)\b/.test(text)) {
      physical = 'heavy_fatigued';
    } else if (/\b(physical normal|body feels fine|body normal|average)\b/.test(text)) {
      physical = 'neutral';
    }

    // 3. Neuromuscular Quality Extraction
    if (/\b(sharp|snappy|reactive|fast twitch|quick|responsive)\b/.test(text)) {
      neuromuscular = 'sharp';
    } else if (/\b(sluggish|delayed|heavy feet|slow reaction|flat)\b/.test(text)) {
      neuromuscular = 'sluggish';
    } else if (/\b(wobbly|off balance|unstable|shaky)\b/.test(text)) {
      neuromuscular = 'unstable';
    } else if (/\b(neuro normal|reactions normal|timing normal)\b/.test(text)) {
      neuromuscular = 'neutral';
    }

    // 4. Mental State Extraction
    if (/\b(slow and clear|calm|quiet mind|zen|slow-clear|clear)\b/.test(text)) {
      mental = 'slow_clear';
    } else if (/\b(rushed|scattered|overwhelmed|stressed|distracted)\b/.test(text)) {
      mental = 'rushed';
    } else if (/\b(mind normal|mental baseline|mind fine)\b/.test(text)) {
      mental = 'neutral';
    }

    // 5. Goalie State Extraction
    if (/\b(patient|compact|sitting into edges|staying on feet|edges locked)\b/.test(text)) {
      goalieState = 'patient';
    } else if (/\b(chasing|reaching|standing tall|biting early|over sliding)\b/.test(text)) {
      goalieState = 'chasing';
    } else if (/\b(goalie baseline|standard stance)\b/.test(text)) {
      goalieState = 'neutral';
    }

    // 6. Soreness & Discomfort Behavior Extraction
    // Location scanning
    if (/\b(hip|hips)\b/.test(text)) sorenessLocations.push('hips');
    if (/\b(adductor|adductors|groin)\b/.test(text)) sorenessLocations.push('adductors');
    if (/\b(leg|legs|quad|quads)\b/.test(text)) sorenessLocations.push('legs' as any);
    if (/\b(back|lower back|spine)\b/.test(text)) sorenessLocations.push('lower_back');
    if (/\b(shoulder|shoulders|neck)\b/.test(text)) sorenessLocations.push('shoulders');
    if (/\b(ankle|ankles|feet)\b/.test(text)) sorenessLocations.push('ankles_feet');
    if (/\b(core|abs|oblique)\b/.test(text)) sorenessLocations.push('core');

    // Behavior classification
    const hasProgressivePain = /\b(sharp pain|shooting pain|getting worse|hurts to move|worsening|movement altering)\b/.test(text);
    const hasTransientPattern = /\b(loosen|loosens up|fine once moving|stiff at first|transient|warms up|goes away)\b/.test(text);
    const hasPersistentPattern = /\b(always tight|chronic|usual tightness|manageable soreness)\b/.test(text);
    const hasAnySorenessWord = /\b(sore|tight|stiff|achy|discomfort|hurts|pain)\b/.test(text);

    if (hasProgressivePain) {
      sorenessBehavior = 'movement_altering';
      sorenessNotes = "Athlete reported sharp or progressive movement-altering discomfort.";
    } else if (hasTransientPattern || (sorenessLocations.length > 0 && hasTransientPattern)) {
      sorenessBehavior = 'transient_resolves';
      sorenessNotes = "Reported tightness that resolves with movement / warm-up. Reassessment checkpoint scheduled.";
    } else if (hasPersistentPattern) {
      sorenessBehavior = 'persistent_manageable';
      sorenessNotes = "Reported manageable persistent soreness.";
    } else if (hasAnySorenessWord) {
      // Default non-progressive soreness mentions without explicit behavior
      sorenessBehavior = 'transient_resolves';
      sorenessNotes = "Soreness noted; requires warmup movement reassessment.";
    }

    const extractionConfidence = ambiguities.length > 0 ? 'AMBIGUOUS' : 'HIGH';

    return {
      rawReport: rawText,
      structured: {
        physical,
        neuromuscular,
        mental,
        goalieState,
        soreness: {
          behavior: sorenessBehavior,
          locations: sorenessLocations,
          notes: sorenessNotes,
          reassessmentStatus: sorenessBehavior === 'transient_resolves' ? 'pending_warmup' : undefined
        }
      },
      confirmationStatus: 'unconfirmed',
      extractionConfidence,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse Post-Session Athlete Natural Language Reflection
   */
  static parsePostSessionText(rawText: string): {
    rawReport: string;
    structuredObservations: Record<string, any>;
    withinSessionAdaptations: WithinSessionAdaptation[];
    candidateChips: { label: string; tag: string }[];
  } {
    const text = rawText.trim().toLowerCase();
    const candidateChips: { label: string; tag: string }[] = [];
    const withinSessionAdaptations: WithinSessionAdaptation[] = [];
    const structuredObservations: Record<string, any> = {};

    // 1. Upper Strength Perception
    if (/\b(pull-ups|pullups|incline|press|upper|bench)\b/.test(text)) {
      if (/\b(solid|great|strong|easy|popping|smooth)\b/.test(text)) {
        structuredObservations.upperStrengthQuality = 'strong';
        candidateChips.push({ label: "Upper Strength: Solid / Strong", tag: "upper_strong" });
      }
    }

    // 2. Autoregulation / Restraint Intent
    if (/\b(didn't chase|didnt chase|held|stopped after|left early|saved legs|didn't want to go too hard)\b/.test(text)) {
      structuredObservations.autoregulation = 'intentionally_held';
      structuredObservations.autoregulationReason = 'preserve_reserve_for_upcoming_performance';
      candidateChips.push({ label: "Autoregulation: Preserved Reserve", tag: "intentionally_held" });
    }

    // 3. Within-Session Adaptation (Motor Self-Correction or Soreness Resolution)
    if (/\b(off at first|wobbly at first|unstable at first|imperfect at first)\b/.test(text) && /\b(fixed|corrected|self-corrected|improved|felt solid)\b/.test(text)) {
      withinSessionAdaptations.push({
        exerciseId: 'adaptation-general-movement',
        dimension: 'movement',
        initialQuality: 'unstable',
        withinSessionChange: 'self_corrected_improved',
        finalQuality: 'controlled',
        notes: "Initial balance/movement instability self-corrected during execution."
      });
      candidateChips.push({ label: "Movement: Self-Corrected / Controlled", tag: "adaptation_improved" });
    }

    // 4. Transient Soreness Resolution
    if (/\b(bounced back|loosened up|disappeared|felt fine after warm-up|no pain)\b/.test(text)) {
      withinSessionAdaptations.push({
        exerciseId: 'adaptation-soreness-resolution',
        dimension: 'soreness',
        initialQuality: 'tight',
        withinSessionChange: 'self_corrected_improved',
        finalQuality: 'resolved',
        notes: "Transient tightness resolved completely with movement."
      });
      candidateChips.push({ label: "Soreness: Resolved with Movement", tag: "soreness_resolved" });
    }

    // 5. Automaticity & Perceptual Calm
    if (/\b(body just did|automatic|mind was going slow|slow mind|loose and clear|zen)\b/.test(text)) {
      structuredObservations.automaticity = 5;
      candidateChips.push({ label: "Automaticity: High / Read-and-React", tag: "automaticity_high" });
    }

    return {
      rawReport: rawText,
      structuredObservations,
      withinSessionAdaptations,
      candidateChips
    };
  }
}
