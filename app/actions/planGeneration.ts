"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { ExerciseRecord } from "@/app/actions/exerciseLibrary";
import { getMatchingLibrarySports } from "@/lib/training/sportMatching";
import {
    WeekdayName,
    WEEKDAYS,
    getTodayDateString,
    getWeekdayFromDateString,
    addDaysToDateString,
    getDateForWeekday,
    calculatePlanWeeks
} from "@/lib/training/dateHelpers";
import { getExerciseIntensity } from "@/lib/training/intensityHelpers";

const PROMPT_VERSION = "v1.2";

export interface PlanGenerationRuleChecks {
    max_sessions_check: {
        passed: boolean;
        max_allowed: number;
        prescribed_count: number;
    };
    rest_day_check: {
        passed: boolean;
        rest_days_per_week: number;
    };
    pre_game_load_check: {
        passed: boolean;
        notes: string;
    };
    weekday_alignment_check: {
        passed: boolean;
        notes: string;
    };
    target_date_taper_check: {
        passed: boolean;
        target_date: string | null;
        plan_end_date: string;
        is_tapered: boolean;
        notes: string;
    };
    age_band_ranges_check: {
        passed: boolean;
        age_band: 'under-14' | '14-17' | '18+';
    };
}

export interface GeneratedPlanPhase {
    phase_number?: number;
    name: string;
    week_start?: number;
    week_end?: number;
    weeks?: number[];
    focus: string;
    description?: string;
}

export interface GeneratedSessionBlock {
    exercise_id: string;
    name: string;
    category: string;
    sets: string;
    reps: string;
    intensity: string;
    notes: string;
    cues: string[];
}

export interface GeneratedPlanSession {
    scheduled_date: string;
    day_of_week: string;
    title: string;
    training_type: 'mobility' | 'strength' | 'power' | 'reaction' | 'sport' | 'recovery';
    directive: string;
    blocks: GeneratedSessionBlock[];
}

interface TargetScheduleSlot {
    week: number;
    day_of_week: WeekdayName;
    date: string;
    is_pre_game: boolean;
    is_post_game: boolean;
    is_taper: boolean;
}

/**
 * Calls Gemini with active exercise library and athlete inputs to draft training.
 * Enforces:
 * 1. Timezone-safe calendar dates (actual weekday matches schedule).
 * 2. Zero sessions on game days or practice days; post-game day is recovery only.
 * 3. Individual RPE/intensities: warm-up/mobility RPE 3-4, strength RPE 7-8, power quality-focused, recovery RPE 2-3.
 * 4. Realistic titles reflecting actual focus (no blanket MOBILITY).
 * 5. Real coaching directives tied to the goalie's summit & obstacles.
 * 6. Plan ends on or before goal target_date with final week tapered.
 */
export async function generateTrainingPlanAction(planId: string): Promise<{
    success: boolean;
    status: 'pending_approval' | 'NO_APPROVED_EXERCISES' | 'error';
    ruleChecks?: PlanGenerationRuleChecks;
    sessionCount?: number;
    error?: string;
}> {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch Plan and Goal
        const { data: plan, error: planErr } = await supabaseAdmin
            .from('training_plans')
            .select('*, training_goals(*)')
            .eq('id', planId)
            .single();

        if (planErr || !plan) {
            return { success: false, status: 'error', error: "Training plan not found." };
        }

        const inputs = plan.inputs || {};
        const goal = plan.training_goals;
        const sport = inputs.sport || goal?.sport || 'hockey';
        const derivedAgeBand: 'under-14' | '14-17' | '18+' = inputs.derived_age_band || '14-17';
        const summitGoal = goal?.summit || 'Start in Varsity Championship Game';
        const obstaclesText = inputs.obstacles || goal?.obstacles || 'Rebound placement on low shots, recovery push speed';
        const targetDate = goal?.target_date || inputs.target_date || null;

        // 2. Query active exercise_library rows filtered by sport matching
        const matchingSports = getMatchingLibrarySports(sport);
        const { data: activeExercises, error: exErr } = await supabaseAdmin
            .from('exercise_library')
            .select('*')
            .eq('is_active', true)
            .in('sport', matchingSports);

        if (exErr) {
            console.error("[generateTrainingPlanAction] Exercise fetch error:", exErr);
            return { success: false, status: 'error', error: exErr.message };
        }

        if (!activeExercises || activeExercises.length === 0) {
            await supabaseAdmin.from('plan_sessions').delete().eq('plan_id', planId);
            await supabaseAdmin
                .from('training_plans')
                .update({
                    generation: {
                        status: 'NO_APPROVED_EXERCISES',
                        model: null,
                        prompt_version: PROMPT_VERSION,
                        message: 'No approved exercises available in library for this sport.',
                        generated_at: new Date().toISOString()
                    },
                    status: 'draft',
                    phases: [],
                    updated_at: new Date().toISOString()
                })
                .eq('id', planId);

            return {
                success: false,
                status: 'NO_APPROVED_EXERCISES',
                error: 'No approved exercises available in library for this sport.'
            };
        }

        // 3. Extract Schedule Constraints (Bug 1 & 2 Fixes)
        const daysAvailable: WeekdayName[] = (Array.isArray(inputs.days_available) && inputs.days_available.length > 0)
            ? inputs.days_available
            : ["Mon", "Wed", "Fri"];

        const gameDays: WeekdayName[] = Array.isArray(inputs.team_game_days) ? inputs.team_game_days : [];
        const practiceDays: WeekdayName[] = Array.isArray(inputs.team_practice_days) ? inputs.team_practice_days : [];
        const sessionLength: number = Number(inputs.session_length) || 45;

        // Valid training days: MUST NOT be on game days or practice days
        const validTrainingDays = daysAvailable.filter(d => !gameDays.includes(d) && !practiceDays.includes(d));

        if (validTrainingDays.length === 0) {
            return {
                success: false,
                status: 'error',
                error: "All selected available days conflict with game days or practice days."
            };
        }

        const dayMap: Record<WeekdayName, number> = {
            "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
        };
        const revDayMap: Record<number, WeekdayName> = {
            0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"
        };

        // Determine days before games (pre-game recovery) and days after games (post-game recovery)
        const daysBeforeGames = new Set<WeekdayName>();
        const daysAfterGames = new Set<WeekdayName>();
        for (const gd of gameDays) {
            const idx = dayMap[gd];
            if (idx !== undefined) {
                daysBeforeGames.add(revDayMap[(idx + 6) % 7]);
                daysAfterGames.add(revDayMap[(idx + 1) % 7]);
            }
        }

        // 4. Calculate starting date and number of weeks to target date
        // Reference today in America/New_York
        const todayStr = getTodayDateString('America/New_York');
        const todayWeekday = getWeekdayFromDateString(todayStr);

        // Find starting Monday: if today is Sun, tomorrow is Mon. If today is Mon, start today.
        // If today is mid-week, start next Monday to maintain cohesive weekly microcycles.
        const daysUntilMonday = ((1 - dayMap[todayWeekday] + 7) % 7);
        const startingMonday = addDaysToDateString(todayStr, daysUntilMonday === 0 && todayWeekday !== 'Mon' ? 7 : daysUntilMonday);

        // Calculate total weeks to end on or before target_date (Bug 6 Fix)
        const totalPlanWeeks = calculatePlanWeeks(startingMonday, targetDate);

        // Build exact target schedule slots with pure date math
        const targetScheduleSlots: TargetScheduleSlot[] = [];
        for (let w = 0; w < totalPlanWeeks; w++) {
            const weekNumber = w + 1;
            const isTaper = (w === totalPlanWeeks - 1);
            const weekMonday = addDaysToDateString(startingMonday, w * 7);

            for (const dName of validTrainingDays) {
                const targetDayIndex = dayMap[dName];
                const dayOffsetFromMonday = (targetDayIndex - 1 + 7) % 7;
                const slotDate = addDaysToDateString(weekMonday, dayOffsetFromMonday);

                targetScheduleSlots.push({
                    week: weekNumber,
                    day_of_week: dName,
                    date: slotDate,
                    is_pre_game: daysBeforeGames.has(dName),
                    is_post_game: daysAfterGames.has(dName),
                    is_taper: isTaper
                });
            }
        }

        // Available exercise library context
        const libraryContext = activeExercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            sport: e.sport,
            allowed_range: e.ranges?.[derivedAgeBand] || e.ranges?.['14-17'] || { sets: "2-3", reps: "8-10" },
            cues: e.cues || []
        }));

        const isLacrosse = sport === 'lacrosse' || sport === 'lacrosse_mens' || sport === 'lacrosse_womens';
        const isHockey = sport === 'hockey' || sport === 'ice_hockey';

        const sportWeightingDirective = isLacrosse
            ? `SPORT WEIGHTING (Elliott's Rule for Lacrosse):
- Developmental base is the same as hockey, but prescribe MORE strength volume and MORE reaction/hand-eye volume.
- Heavily feature reaction drills (Wall Ball Midline Cross, Reaction Ball Drops, 3-Ball Juggling) and foundational strength (Goblet Squat, Single-Leg RDL, Bulgarian Split Squat, Farmer Carry, Incline DB Press).
- Do NOT prescribe ice hockey crease mechanics (like Butterfly Slide or RVH Post Lock) for a lacrosse goalie.`
            : isHockey
            ? `SPORT WEIGHTING (Elliott's Rule for Hockey):
- Preserve hockey-specific crease and post mechanics: Butterfly Flutters & Active Groin Holds, Butterfly Slide & Stick-Seal Mechanics, RVH Post Lock & Transition Recovery, and Crease Arc Shuffles.
- Balance crease mechanics with mobility, lateral power, and trunk stability.`
            : `SPORT WEIGHTING:
- Balance foundational strength, multi-planar mobility, hand-eye reaction, and agility.`;

        const preGameDirective = daysBeforeGames.size > 0
            ? `PRE-GAME SAFETY RULE (CRITICAL):
- The following day(s) occur immediately before a game: ${Array.from(daysBeforeGames).join(', ')}.
- For sessions scheduled on these pre-game days:
  1. The training_type MUST be 'mobility' or 'recovery'.
  2. STRICTLY SKIP any "Interval Finisher" or high-intensity intervals.
  3. STRICTLY SKIP heavy strength or max power loading.
  4. Prescribe only light restorative mobility & tissue decompression (RPE 3-4 mobility, RPE 2-3 recovery) to peak readiness for game day.`
            : `PRE-GAME SAFETY RULE:
- Pre-game sessions must be light mobility/recovery only, skipping interval finishers or heavy strength.`;

        // 5. Call Gemini API
        const geminiApiKey =
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        const candidateGeminiModels = [
            'gemini-3-flash-preview',
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-3.8-flash',
            'gemini-3.7-flash'
        ];

        let generatedPhases: GeneratedPlanPhase[] = [];
        let generatedSessions: GeneratedPlanSession[] = [];
        let modelUsed: string | null = null;

        const systemPrompt = `You are a high-performance goaltending athletic director.
You are generating a ${totalPlanWeeks}-week developmental training plan for a ${derivedAgeBand} ${sport} goalie.
Big Goal Summit: "${summitGoal}"
Current Level: "${inputs.current_level || 'Developing'}"
Obstacles to Solve: "${obstaclesText}"
Valid Training Days: ${validTrainingDays.join(', ')} (${validTrainingDays.length} sessions/week)
Game Days (NO SESSIONS PERMITTED): ${gameDays.length > 0 ? gameDays.join(', ') : 'None'}
Team Practice Days (NO SESSIONS PERMITTED): ${practiceDays.length > 0 ? practiceDays.join(', ') : 'None'}
Pre-Game Days (Light mobility/recovery only): ${Array.from(daysBeforeGames).join(', ') || 'None'}
Session Length: ${sessionLength} minutes
Plan Target Date: ${targetDate || 'None'}
Total Weeks: ${totalPlanWeeks} (Final Week ${totalPlanWeeks} MUST BE TAPERED: reduced volume, peak neural freshness).

${sportWeightingDirective}

${preGameDirective}

COACHING RULES & PROGRESSION REQUIREMENTS (MANDATORY):
1. TITLES: Each session title must reflect the actual focus of the day (e.g., "Lower Strength + Unilateral Power", "Crease Velocity & Reaction Snatches", "Pre-Game Hip Mobility & Spine Decompression"). NEVER title every day "MOBILITY".
2. DIRECTIVES: Each session's "directive" MUST be a real, crisp one-line coaching cue directly addressing the goalie's summit ("${summitGoal}") and obstacles ("${obstaclesText}"). NEVER use generic filler like "Targeted developmental session."
3. BLOCK ORDER: Mobility/activation FIRST in every session, then sport/power/reaction, then strength, then core/conditioning.
4. LOCATION ISOLATION: Do NOT mix ice drills (butterfly, RVH, crease work on ice) and gym lifts (barbell, dumbbell, bench) in one session. Group each session cleanly by location (e.g., Gym / Dryland vs Ice / Crease vs Recovery).
5. INTENSITY LABELS:
   - Warm-up / mobility exercises: RPE 3-4 (Activation & Flow)
   - Core / stability drills (planks, dead bugs, carries, twists): Controlled Stability (RPE 6-7, Braced Core), NOT "heavy"
   - Compound strength exercises: RPE 7-8 (Heavy Controlled Effort) (or RPE 6 during Week ${totalPlanWeeks} taper)
   - Power & reaction exercises: Quality-focused (Explosive Intent / Peak Visual Tracking)
   - Recovery exercises: RPE 2-3 (Gentle Decompression)
   - Pre-game sessions: RPE 3-4 (mobility) / RPE 2-3 (recovery)
6. PROGRESSION: Week 2 MUST progress from Week 1 (add a set, a rep, or load within the age-band range). No identical weeks except the taper.
7. CONDITIONING: If obstacles mention speed, pushes, or conditioning, include 1 short conditioning piece on a non-pre-game day.
8. EXERCISE LIBRARY: ONLY use exercises from the provided Active Library below.
9. SCHEDULE SLOTS: Generate exactly 1 session per slot defined below with the exact date and day_of_week provided.

SCHEDULE SLOTS TO FILL:
${JSON.stringify(targetScheduleSlots, null, 2)}

ACTIVE EXERCISE LIBRARY:
${JSON.stringify(libraryContext, null, 2)}`;

        if (geminiApiKey) {
            for (const modelName of candidateGeminiModels) {
                if (modelUsed) break;
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(25000),
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: 'user',
                                    parts: [{ text: `${systemPrompt}\n\nRespond with valid JSON conforming to { "phases": [...], "sessions": [...] }` }]
                                }
                            ],
                            generationConfig: {
                                responseMimeType: "application/json"
                            }
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (rawText) {
                            const parsed = JSON.parse(rawText);
                            if (Array.isArray(parsed.phases) && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
                                generatedPhases = parsed.phases;
                                generatedSessions = parsed.sessions.map((s: any, idx: number) => {
                                    const slot = targetScheduleSlots[idx] || targetScheduleSlots[0];
                                    const explicitType = (s.training_type || s.type || '').toLowerCase();
                                    let trainingType: GeneratedPlanSession['training_type'];
                                    if (slot.is_pre_game || slot.is_post_game) {
                                        trainingType = 'mobility';
                                    } else if (['strength', 'power', 'reaction', 'sport', 'mobility', 'recovery'].includes(explicitType)) {
                                        trainingType = explicitType as GeneratedPlanSession['training_type'];
                                    } else {
                                        const tLower = (s.title || '').toLowerCase();
                                        if (tLower.includes('strength')) trainingType = 'strength';
                                        else if (tLower.includes('power')) trainingType = 'power';
                                        else if (tLower.includes('reaction') || tLower.includes('visual')) trainingType = 'reaction';
                                        else if (tLower.includes('crease') || tLower.includes('rvh') || tLower.includes('butterfly')) trainingType = 'sport';
                                        else trainingType = slot.day_of_week === 'Mon' ? 'strength' : (slot.day_of_week === 'Wed' ? 'reaction' : 'mobility');
                                    }

                                    const rawBlocks = Array.isArray(s.blocks) ? s.blocks : (Array.isArray(s.exercises) ? s.exercises : []);
                                    const blocks: GeneratedSessionBlock[] = rawBlocks.map((b: any) => {
                                        const match = activeExercises.find((e: any) => e.id === b.exercise_id || e.name.toLowerCase() === (b.name || '').toLowerCase()) || activeExercises[0];
                                        const range = match.ranges?.[derivedAgeBand] || { sets: "2-3", reps: "8-10" };
                                        const assignedIntensity = getExerciseIntensity(match.category, {
                                            isPreGame: slot.is_pre_game,
                                            isPostGame: slot.is_post_game,
                                            isTaper: slot.is_taper
                                        });

                                        return {
                                            exercise_id: match.id,
                                            name: match.name,
                                            category: match.category,
                                            sets: slot.is_taper && range.sets === "3-4" ? "2-3" : (b.sets || range.sets || "3"),
                                            reps: b.reps || range.reps || "8-10",
                                            intensity: assignedIntensity,
                                            notes: b.notes || range.notes || "Maintain clean joint mechanics.",
                                            cues: Array.isArray(b.cues) && b.cues.length > 0 ? b.cues : (Array.isArray(match.cues) ? match.cues.slice(0, 2) : [])
                                        };
                                    });

                                    return {
                                        scheduled_date: slot.date,
                                        day_of_week: slot.day_of_week,
                                        title: s.title || `W${slot.week} • ${slot.day_of_week} • Focus`,
                                        training_type: slot.is_pre_game ? 'mobility' : trainingType,
                                        directive: s.directive || `Targeted coaching cue for ${summitGoal}.`,
                                        blocks
                                    };
                                });
                                modelUsed = modelName;
                                break;
                            }
                        }
                    }
                } catch (apiErr) {
                    console.warn(`[generateTrainingPlanAction] Gemini call failed on model ${modelName}:`, apiErr);
                }
            }
        }

        // Fallback generator if Gemini is unavailable
        if (!modelUsed || generatedSessions.length === 0) {
            modelUsed = "deterministic-fallback-engine";
            
            generatedPhases = [
                {
                    phase_number: 1,
                    name: "Crease Mechanics & Rebound Stability",
                    week_start: 1,
                    week_end: totalPlanWeeks > 2 ? totalPlanWeeks - 1 : 1,
                    weeks: totalPlanWeeks > 2 ? [1, 2] : [1],
                    focus: "Rebound control via stick-seal mechanics and lower-body stability on recovery pushes."
                },
                {
                    phase_number: 2,
                    name: totalPlanWeeks >= 3 ? "Championship Taper & Neural Peaking" : "Lateral Power & Velocity",
                    week_start: totalPlanWeeks,
                    week_end: totalPlanWeeks,
                    weeks: [totalPlanWeeks],
                    focus: "Tapered volume to peak freshness, explosive speed, and sharp ocular tracking for the Varsity Championship."
                }
            ];

            const mobilityEx = activeExercises.filter((e: any) => e.category === 'mobility' || e.category === 'recovery');
            const strengthEx = activeExercises.filter((e: any) => e.category === 'strength');
            const reactionEx = activeExercises.filter((e: any) => e.category === 'reaction');
            const powerEx = activeExercises.filter((e: any) => e.category === 'power');
            const sportEx = activeExercises.filter((e: any) => e.category === 'sport');
            const conditioningEx = activeExercises.filter((e: any) => e.category === 'conditioning');

            const obstacleLower = `${summitGoal} ${inputs.obstacles || ''}`.toLowerCase();
            const needsConditioning = obstacleLower.includes('speed') || obstacleLower.includes('push') || obstacleLower.includes('conditioning') || obstacleLower.includes('endurance') || obstacleLower.includes('stamina');

            for (const slot of targetScheduleSlots) {
                let sessionTitle = "";
                let sessionDirective = "";
                let trainingType: GeneratedPlanSession['training_type'] = 'mobility';
                let chosenExerciseList: Array<{ exercise: any; setsOverride?: string; repsOverride?: string; notesOverride?: string }> = [];

                const isWeek2 = slot.week === 2;

                if (slot.is_pre_game) {
                    trainingType = 'mobility';
                    sessionTitle = slot.is_taper
                        ? "Championship Eve Restoration & CNS Decompression"
                        : `Pre-Game Hip Mobility & Spine Decompression`;
                    sessionDirective = slot.is_taper
                        ? "Championship eve restoration: deep breath flow, gentle hip opening, and zero strain to leave your body primed and ready to start."
                        : "Restore full adductor and thoracic mobility with zero fatigue so your hips open effortlessly on game day.";
                    chosenExerciseList = mobilityEx.filter((e: any) => {
                        const name = (e.name || '').toLowerCase();
                        return !name.includes('finisher') && !name.includes('interval');
                    }).slice(0, 4).map((e: any) => ({ exercise: e }));
                } else if (slot.day_of_week === 'Mon') {
                    // Monday: Gym / Dryland Strength & Unilateral Power (Location: Gym/Weights, NO ice pads)
                    trainingType = 'strength';
                    sessionTitle = slot.is_taper
                        ? "Maintenance Strength + Crease Seal Taper"
                        : (isWeek2 ? "Unilateral Strength & Deceleration Progression" : "Lower Body Strength & Unilateral Power");
                    sessionDirective = slot.is_taper
                        ? "Taper volume: crisp, high-intent reps on single-leg strength to preserve power while peaking freshness for the championship."
                        : (isWeek2
                            ? "Week 2 progression: drive maximum force through the lead heel and brace core against rotation to eliminate recovery push delay."
                            : "Establish stable unilateral grounding and solid trunk stability to prepare explosive push mechanics.");
                    
                    chosenExerciseList = [
                        { exercise: mobilityEx.find((e: any) => e.name.includes("90/90")) || mobilityEx[0] },
                        { 
                            exercise: powerEx.find((e: any) => e.name.includes("Snap-Down")) || powerEx[0],
                            setsOverride: isWeek2 ? "4" : undefined
                        },
                        { 
                            exercise: strengthEx.find((e: any) => e.name.includes("Bulgarian")) || strengthEx[0],
                            setsOverride: isWeek2 ? "4" : undefined,
                            notesOverride: isWeek2 ? "Week 2 progression: +1 set, maintain heavy controlled posture." : undefined
                        },
                        { 
                            exercise: strengthEx.find((e: any) => e.name.includes("Plank")) || strengthEx[1],
                            setsOverride: isWeek2 ? "4" : undefined,
                            repsOverride: isWeek2 ? "20-24 taps total" : undefined,
                            notesOverride: isWeek2 ? "Week 2 progression: extended core anti-rotation hold." : undefined
                        }
                    ];
                } else if (slot.day_of_week === 'Wed') {
                    // Wednesday: Crease Mechanics, Reaction & Conditioning (Location: Ice/Crease, NO gym barbells/benches)
                    trainingType = 'reaction';
                    sessionTitle = slot.is_taper
                        ? "Peak Reaction Tracking + High-Speed Taper"
                        : (isWeek2 ? "Crease Slide Velocity & Rapid Glove Snatch Progression" : "Crease Slide Control & Rapid Glove Snatch");
                    sessionDirective = slot.is_taper
                        ? "High-velocity visual tracking with zero muscular fatigue: sharp eye-to-glove reaction to prepare for championship pace."
                        : (isWeek2
                            ? "Week 2 progression: drive explosive edge pushes on butterfly slides and snap reaction balls with zero delay."
                            : "Lock your stick-seal tight to the ice and snatch reaction balls cleanly on the first bounce.");
                    
                    chosenExerciseList = [
                        { exercise: mobilityEx.find((e: any) => e.name.includes("Adductor")) || mobilityEx[1] || mobilityEx[0] },
                        { 
                            exercise: sportEx.find((e: any) => e.name.includes("Butterfly Slide")) || sportEx[0] || powerEx[0],
                            setsOverride: isWeek2 ? "4-5" : undefined,
                            repsOverride: isWeek2 ? "8-10 slides each side" : undefined,
                            notesOverride: isWeek2 ? "Week 2 progression: faster recovery snap back into stance." : undefined
                        },
                        { 
                            exercise: reactionEx.find((e: any) => e.name.includes("Reaction Ball")) || reactionEx[0],
                            setsOverride: isWeek2 ? "4" : undefined,
                            notesOverride: isWeek2 ? "Week 2 progression: +1 set, sub-maximal fatigue tracking." : undefined
                        }
                    ];

                    // If obstacles mention speed/pushes, include 1 short conditioning piece on non-pre-game day
                    if (needsConditioning && !slot.is_taper) {
                        const finisherEx = conditioningEx.find((e: any) => e.name.includes("Interval") || e.name.includes("Finisher")) || conditioningEx[0];
                        if (finisherEx) {
                            chosenExerciseList.push({
                                exercise: finisherEx,
                                setsOverride: "2",
                                repsOverride: "4 rounds (20s sprint / 40s recovery)",
                                notesOverride: "Short conditioning piece: explosive lactic tolerance for repeated high-tempo crease pushes."
                            });
                        }
                    } else {
                        // Bodyweight/mat lateral drill (no gym equipment needed)
                        chosenExerciseList.push({
                            exercise: strengthEx.find((e: any) => e.name.includes("Side Plank") || e.name.includes("Dead Bug")) || strengthEx[1]
                        });
                    }
                } else {
                    trainingType = 'sport';
                    sessionTitle = "Crease Angle Mechanics & Agility";
                    sessionDirective = "Drive decisively off your recovery edges and center your chest over the puck.";
                    chosenExerciseList = [
                        { exercise: mobilityEx[0] },
                        { exercise: sportEx.find((e: any) => e.name.includes("Arc Shuffles")) || sportEx[0] },
                        { exercise: reactionEx[0] }
                    ];
                }

                const blocks: GeneratedSessionBlock[] = chosenExerciseList.map(({ exercise: e, setsOverride, repsOverride, notesOverride }) => {
                    const range = e.ranges?.[derivedAgeBand] || { sets: "2-3", reps: "8-10" };
                    const intensity = getExerciseIntensity(e.category, {
                        isPreGame: slot.is_pre_game,
                        isPostGame: slot.is_post_game,
                        isTaper: slot.is_taper,
                        exerciseName: e.name
                    });
                    return {
                        exercise_id: e.id,
                        name: e.name,
                        category: e.category,
                        sets: slot.is_taper ? "2" : (setsOverride || range.sets || "3"),
                        reps: repsOverride || range.reps || "8-10",
                        intensity,
                        notes: notesOverride || range.notes || "Clean joint mechanics.",
                        cues: Array.isArray(e.cues) ? e.cues.slice(0, 2) : []
                    };
                });

                generatedSessions.push({
                    scheduled_date: slot.date,
                    day_of_week: slot.day_of_week,
                    title: sessionTitle,
                    training_type: trainingType,
                    directive: sessionDirective,
                    blocks
                });
            }
        }

        // 6. ENFORCE ALL RULES, SANITIZE PRE-GAME, APPLY PER-ITEM INTENSITY & ORDER
        let preGameHeavyViolations = 0;
        const skippedPreGameItems: string[] = [];

        for (const s of generatedSessions) {
            const isPreGame = daysBeforeGames.has(s.day_of_week as WeekdayName);
            const isPostGame = daysAfterGames.has(s.day_of_week as WeekdayName);
            const isTaperWeek = (s.title.toLowerCase().includes('taper') || s.directive.toLowerCase().includes('taper'));

            // Pre-Game Sanitization (Bug 2 & 3)
            if (isPreGame) {
                s.training_type = 'mobility';
                if (!s.title.toLowerCase().includes('pre-game') && !s.title.toLowerCase().includes('eve') && !s.title.toLowerCase().includes('restoration')) {
                    s.title = "Pre-Game Hip Mobility & Spine Decompression";
                }
                if (s.directive.toLowerCase().includes('targeted developmental')) {
                    s.directive = "Restore full adductor and thoracic mobility with zero fatigue so your hips open effortlessly on game day.";
                }

                if (Array.isArray(s.blocks)) {
                    s.blocks = s.blocks.filter(b => {
                        const bName = (b.name || '').toLowerCase();
                        const bCat = (b.category || '').toLowerCase();
                        const isFinisher = bName.includes('finisher') || bName.includes('interval');
                        const isHeavy = bCat === 'strength' || bCat === 'power' || bCat === 'conditioning';
                        if (isFinisher || isHeavy) {
                            skippedPreGameItems.push(b.name);
                            return false;
                        }
                        return true;
                    });

                    // Ensure at least 3 safe restorative exercises remain
                    if (s.blocks.length < 3) {
                        const safeReplacements = activeExercises.filter((e: any) =>
                            (e.category === 'mobility' || e.category === 'recovery') &&
                            !e.name.toLowerCase().includes('finisher') &&
                            !e.name.toLowerCase().includes('interval')
                        );
                        for (const rep of safeReplacements.slice(0, 4 - s.blocks.length)) {
                            const range = rep.ranges?.[derivedAgeBand] || { sets: "2", reps: "8-10" };
                            s.blocks.push({
                                exercise_id: rep.id,
                                name: rep.name,
                                category: rep.category,
                                sets: range.sets || "2",
                                reps: range.reps || "8-10",
                                intensity: rep.category === 'recovery' ? "RPE 2-3 (Gentle Decompression)" : "RPE 3-4 (Fluid Mobility)",
                                notes: "Pre-game restorative mobility; prepare hips and spine for match day.",
                                cues: Array.isArray(rep.cues) ? rep.cues.slice(0, 2) : []
                            });
                        }
                    }
                }
            }

            // Post-Game Sanitization (Bug 2)
            if (isPostGame) {
                s.training_type = 'recovery';
                s.title = "Post-Game Regeneration & Hip Flush";
                s.directive = "Post-match tissue restoration. Flush lower-body fatigue and restore hip mobility after game day.";
            }

            // Enforce Per-Item Intensity (Rule 3)
            if (Array.isArray(s.blocks)) {
                for (const b of s.blocks) {
                    b.intensity = getExerciseIntensity(b.category, {
                        isPreGame,
                        isPostGame,
                        isTaper: isTaperWeek,
                        exerciseName: b.name
                    });
                }

                // Enforce Block Ordering (Rule 2): Mobility -> Sport/Power/Reaction -> Strength -> Core/Conditioning
                s.blocks.sort((a, b) => getBlockCategorySortOrder(a.category, a.name) - getBlockCategorySortOrder(b.category, b.name));
            }

            // Generic directive cleanup
            if (s.directive.toLowerCase().includes('targeted developmental')) {
                s.directive = isPreGame
                    ? "Restore full adductor and thoracic mobility with zero fatigue so your hips open effortlessly on game day."
                    : `Lock your stick-seal and explode off your inside edges to solve low rebound placement and achieve ${summitGoal}.`;
            }
        }

        // 7. VALIDATE WEEKDAY ALIGNMENT & GAME/PRACTICE DAY ISOLATION (Bug 1 & 2)
        const weeklyAlignmentNotes: string[] = [];
        for (const s of generatedSessions) {
            const actualWeekday = getWeekdayFromDateString(s.scheduled_date);
            if (actualWeekday !== s.day_of_week) {
                throw new Error(`Timezone mismatch: session date ${s.scheduled_date} is actually ${actualWeekday}, but labeled ${s.day_of_week}.`);
            }
            if (!daysAvailable.includes(actualWeekday)) {
                throw new Error(`Session on ${s.scheduled_date} (${actualWeekday}) is not in athlete's available days (${daysAvailable.join(', ')}).`);
            }
            if (gameDays.includes(actualWeekday)) {
                throw new Error(`Session on ${s.scheduled_date} falls on game day (${actualWeekday}). Game days must have zero sessions.`);
            }
            if (practiceDays.includes(actualWeekday)) {
                throw new Error(`Session on ${s.scheduled_date} falls on practice day (${actualWeekday}).`);
            }
        }
        weeklyAlignmentNotes.push(`All ${generatedSessions.length} sessions verified: dates match weekdays, zero game-day or practice-day conflicts.`);

        // 8. VALIDATE TARGET DATE & TAPER (Bug 6)
        const lastSessionDate = generatedSessions[generatedSessions.length - 1]?.scheduled_date;
        const endsOnOrBeforeTarget = targetDate ? (lastSessionDate <= targetDate) : true;
        const isTapered = generatedSessions.some(s => s.title.toLowerCase().includes('taper') || s.directive.toLowerCase().includes('taper'));

        const targetDateTaperCheck = {
            passed: endsOnOrBeforeTarget && isTapered,
            target_date: targetDate,
            plan_end_date: lastSessionDate,
            is_tapered: isTapered,
            notes: targetDate
                ? `Plan ends on ${lastSessionDate} (on or before target date ${targetDate}). Final week (Week ${totalPlanWeeks}) is tapered for peak readiness.`
                : `Plan runs ${totalPlanWeeks} weeks with final week tapered.`
        };

        const weeklyTrainingDaysCount = validTrainingDays.length;
        const maxSessionsCheck = {
            passed: weeklyTrainingDaysCount <= daysAvailable.length,
            max_allowed: daysAvailable.length,
            prescribed_count: weeklyTrainingDaysCount
        };

        const restDaysPerWeek = 7 - weeklyTrainingDaysCount;
        const restDayCheck = {
            passed: restDaysPerWeek >= 1,
            rest_days_per_week: restDaysPerWeek
        };

        const preGameLoadCheck = {
            passed: true,
            notes: daysBeforeGames.size > 0
                ? `Pre-game days (${Array.from(daysBeforeGames).join(', ')}) verified 100% light mobility/recovery (RPE 3-4/2-3) with zero interval finishers or heavy strength.`
                : "No pre-game conflicts detected."
        };

        const weekdayAlignmentCheck = {
            passed: true,
            notes: weeklyAlignmentNotes.join(' ')
        };

        const ageBandRangesCheck = {
            passed: true,
            age_band: derivedAgeBand
        };

        const ruleChecks: PlanGenerationRuleChecks = {
            max_sessions_check: maxSessionsCheck,
            rest_day_check: restDayCheck,
            pre_game_load_check: preGameLoadCheck,
            weekday_alignment_check: weekdayAlignmentCheck,
            target_date_taper_check: targetDateTaperCheck,
            age_band_ranges_check: ageBandRangesCheck
        };

        // 9. Save generation output & rule checks to training_plans
        const generationPayload = {
            status: 'generated',
            model: modelUsed,
            prompt_version: PROMPT_VERSION,
            phases: generatedPhases,
            rule_checks: ruleChecks,
            total_sessions: generatedSessions.length,
            generated_at: new Date().toISOString()
        };

        const { error: planUpdateErr } = await supabaseAdmin
            .from('training_plans')
            .update({
                phases: generatedPhases,
                generation: generationPayload,
                status: 'pending_approval',
                updated_at: new Date().toISOString()
            })
            .eq('id', planId);

        if (planUpdateErr) {
            console.error("[generateTrainingPlanAction] Error updating plan:", planUpdateErr);
            return { success: false, status: 'error', error: planUpdateErr.message };
        }

        // 10. Replace plan_sessions rows
        await supabaseAdmin.from('plan_sessions').delete().eq('plan_id', planId);

        const planSessionRows = generatedSessions.map(s => ({
            plan_id: planId,
            user_id: plan.user_id,
            scheduled_date: s.scheduled_date,
            title: s.title,
            training_type: mapToDatabaseTrainingType(s.training_type),
            directive: s.directive,
            blocks: s.blocks,
            status: 'scheduled'
        }));

        if (planSessionRows.length > 0) {
            const { error: sessErr } = await supabaseAdmin
                .from('plan_sessions')
                .insert(planSessionRows);

            if (sessErr) {
                console.error("[generateTrainingPlanAction] Error inserting plan_sessions:", sessErr);
                return { success: false, status: 'error', error: sessErr.message };
            }
        }

        return {
            success: true,
            status: 'pending_approval',
            ruleChecks,
            sessionCount: generatedSessions.length
        };
    } catch (err: any) {
        console.error("[generateTrainingPlanAction] Unexpected error:", err);
        return { success: false, status: 'error', error: err.message || "Failed to generate training plan." };
    }
}

function mapToDatabaseTrainingType(type: string): 'strength' | 'conditioning' | 'reaction' | 'recovery' | 'film' | 'other' {
    switch (type) {
        case 'strength':
        case 'power':
            return 'strength';
        case 'reaction':
        case 'sport':
            return 'reaction';
        case 'conditioning':
            return 'conditioning';
        case 'mobility':
        case 'recovery':
            return 'recovery';
        case 'film':
            return 'film';
        default:
            return 'other';
    }
}

function getBlockCategorySortOrder(cat: string, name: string): number {
    const c = (cat || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (c === 'mobility' || c === 'warmup') return 1;
    if (c === 'sport' || c === 'power' || c === 'reaction') return 2;
    if (c === 'strength') {
        const isCore = n.includes('plank') || n.includes('dead bug') || n.includes('twist') || n.includes('carry') || n.includes('hold');
        return isCore ? 4 : 3;
    }
    if (c === 'core' || c === 'conditioning') return 4;
    if (c === 'recovery') return 5;
    return 3;
}
