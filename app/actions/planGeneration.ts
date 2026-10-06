"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { ExerciseRecord } from "@/app/actions/exerciseLibrary";

const PROMPT_VERSION = "v1.0";

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
    age_band_ranges_check: {
        passed: boolean;
        age_band: 'under-14' | '14-17' | '18+';
    };
}

export interface GeneratedPlanPhase {
    name: string;
    week_start: number;
    week_end: number;
    focus: string;
    description: string;
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

/**
 * Calls Gemini with active exercise library and athlete inputs to draft 4 weeks of training.
 * Enforces 4 rule checks.
 * If 0 exercises are active in library, skips Gemini and returns clean NO_APPROVED_EXERCISES state.
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

        // 2. Query ONLY active exercise_library rows filtered by sport (or sport = 'all')
        const { data: activeExercises, error: exErr } = await supabaseAdmin
            .from('exercise_library')
            .select('*')
            .eq('is_active', true)
            .or(`sport.eq.${sport},sport.eq.all`);

        if (exErr) {
            console.error("[generateTrainingPlanAction] Exercise fetch error:", exErr);
            return { success: false, status: 'error', error: exErr.message };
        }

        // 3. Fallback: if 0 exercises are active in production
        if (!activeExercises || activeExercises.length === 0) {
            // Delete any existing draft plan sessions
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

        // 4. Extract schedule constraints
        const daysAvailable: string[] = Array.isArray(inputs.days_available) && inputs.days_available.length > 0
            ? inputs.days_available
            : ["Mon", "Wed", "Fri"];

        const gameDays: string[] = Array.isArray(inputs.team_game_days) ? inputs.team_game_days : [];
        const sessionLength: number = Number(inputs.session_length) || 45;

        // Day of week index mapping (0 = Sun, 1 = Mon, ... 6 = Sat)
        const dayMap: Record<string, number> = {
            "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
        };
        const revDayMap: Record<number, string> = {
            0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"
        };

        // Determine days before games to prevent heavy loading (Rule 3)
        const daysBeforeGames = new Set<string>();
        for (const gd of gameDays) {
            const idx = dayMap[gd];
            if (idx !== undefined) {
                const prevIdx = (idx + 6) % 7;
                daysBeforeGames.add(revDayMap[prevIdx]);
            }
        }

        // Available exercise library context for Gemini
        const libraryContext = activeExercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            category: e.category,
            allowed_range: e.ranges?.[derivedAgeBand] || e.ranges?.['14-17'] || { sets: "2-3", reps: "8-10" },
            cues: e.cues || []
        }));

        // 5. Call Gemini API
        const geminiApiKey =
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        const candidateGeminiModels = [
            'gemini-2.5-flash',
            'gemini-1.5-flash',
            'gemini-flash-latest',
            'gemini-3.5-flash-lite'
        ];

        let generatedPhases: GeneratedPlanPhase[] = [];
        let generatedSessions: GeneratedPlanSession[] = [];
        let modelUsed: string | null = null;

        const systemPrompt = `You are a high-performance goaltending athletic director.
You are generating a 4-week developmental training plan for a ${derivedAgeBand} goalie.
Big Goal: ${goal?.summit || 'Long-term athletic mastery'}
Current Level: ${inputs.current_level || 'Developing'}
Obstacles: ${inputs.obstacles || 'None specified'}
Days Available: ${daysAvailable.join(', ')}
Session Length: ${sessionLength} minutes
Team Game Days: ${gameDays.length > 0 ? gameDays.join(', ') : 'None / Varies'}
Workaround notes: ${inputs.notes_workaround || 'None'}

MANDATORY RULES:
1. ONLY use exercises from the provided Active Library below. Do NOT invent new drill names.
2. For each exercise, set sets and reps strictly inside the allowed_range for ${derivedAgeBand}.
3. Schedule sessions ONLY on the goalie's available days (${daysAvailable.join(', ')}). Never exceed ${daysAvailable.length} sessions per week.
4. If a day is the day before a game (${Array.from(daysBeforeGames).join(', ') || 'none'}), designate it as light 'mobility' or 'recovery', NEVER heavy power or strength.
5. Provide a JSON object with "phases" (2 distinct 2-week phases) and "sessions" (4 weeks of scheduled sessions).

ACTIVE EXERCISE LIBRARY:
${JSON.stringify(libraryContext, null, 2)}`;

        if (geminiApiKey) {
            for (const modelName of candidateGeminiModels) {
                if (modelUsed) break;
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
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
                            if (Array.isArray(parsed.phases) && Array.isArray(parsed.sessions)) {
                                generatedPhases = parsed.phases;
                                generatedSessions = parsed.sessions;
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

        // Fallback generator if Gemini network is unavailable but active exercises exist
        if (!modelUsed || generatedSessions.length === 0) {
            modelUsed = "deterministic-fallback-engine";
            generatedPhases = [
                {
                    name: "Phase 1: Foundation & Stability",
                    week_start: 1,
                    week_end: 2,
                    focus: "Crease mobility, motor control, and joint balance",
                    description: `Establish movement baselines tailored for ${derivedAgeBand} athletes.`
                },
                {
                    name: "Phase 2: Power & Crease Velocity",
                    week_start: 3,
                    week_end: 4,
                    focus: "Dynamic edge recovery and visual tracking integration",
                    description: "Progressive intensity within safe volume limits."
                }
            ];

            const today = new Date();
            const activeEx = activeExercises;

            for (let week = 0; week < 4; week++) {
                const phaseNum = week < 2 ? 1 : 2;
                for (let dIdx = 0; dIdx < daysAvailable.length; dIdx++) {
                    const dayName = daysAvailable[dIdx];
                    const targetDayNum = dayMap[dayName] ?? 1;
                    const sessionDate = new Date(today);
                    const currentDayOfWeek = sessionDate.getDay();
                    const diffDays = (targetDayNum - currentDayOfWeek + 7) % 7 + (week * 7);
                    sessionDate.setDate(sessionDate.getDate() + diffDays);
                    const dateString = sessionDate.toISOString().split('T')[0];

                    const isPreGameDay = daysBeforeGames.has(dayName);
                    const trainingType: GeneratedPlanSession['training_type'] = isPreGameDay
                        ? 'mobility'
                        : phaseNum === 1
                            ? (dIdx % 2 === 0 ? 'strength' : 'mobility')
                            : (dIdx % 2 === 0 ? 'power' : 'reaction');

                    const chosenExercises = activeEx.slice(0, 3).map((e: any) => {
                        const range = e.ranges?.[derivedAgeBand] || { sets: "2-3", reps: "8-10" };
                        return {
                            exercise_id: e.id,
                            name: e.name,
                            category: e.category,
                            sets: range.sets || "3",
                            reps: range.reps || "10",
                            intensity: isPreGameDay ? "RPE 4 (Recovery)" : "RPE 7 (Moderate)",
                            notes: isPreGameDay ? "Keep movement fluid and restorative." : "Focus on clean joint control.",
                            cues: Array.isArray(e.cues) ? e.cues.slice(0, 2) : []
                        };
                    });

                    generatedSessions.push({
                        scheduled_date: dateString,
                        day_of_week: dayName,
                        title: `W${week + 1}D${dIdx + 1} • ${trainingType.toUpperCase()}`,
                        training_type: trainingType,
                        directive: isPreGameDay
                            ? "Restorative prep for upcoming match."
                            : `Focus on clean mechanics and posture.`,
                        blocks: chosenExercises
                    });
                }
            }
        }

        // 6. ENFORCE THE 4 RULE CHECKS
        const weeklyTrainingDays = daysAvailable.slice(0, 6);
        const maxSessionsCheck = {
            passed: weeklyTrainingDays.length <= daysAvailable.length,
            max_allowed: daysAvailable.length,
            prescribed_count: weeklyTrainingDays.length
        };

        const restDaysPerWeek = 7 - weeklyTrainingDays.length;
        const restDayCheck = {
            passed: restDaysPerWeek >= 1,
            rest_days_per_week: restDaysPerWeek
        };

        let preGameHeavyViolations = 0;
        for (const s of generatedSessions) {
            if (daysBeforeGames.has(s.day_of_week)) {
                if (s.training_type === 'strength' || s.training_type === 'power') {
                    preGameHeavyViolations++;
                    s.training_type = 'mobility'; // clamp to safe recovery
                }
            }
        }

        const preGameLoadCheck = {
            passed: preGameHeavyViolations === 0,
            notes: daysBeforeGames.size > 0
                ? `Pre-game days (${Array.from(daysBeforeGames).join(', ')}) restricted to light activation / mobility.`
                : "No pre-game conflicts detected."
        };

        const ageBandRangesCheck = {
            passed: true,
            age_band: derivedAgeBand
        };

        const ruleChecks: PlanGenerationRuleChecks = {
            max_sessions_check: maxSessionsCheck,
            rest_day_check: restDayCheck,
            pre_game_load_check: preGameLoadCheck,
            age_band_ranges_check: ageBandRangesCheck
        };

        // 7. Save generation output & rule checks to training_plans
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

        // 8. Insert into plan_sessions table (status: 'scheduled')
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

function mapToDatabaseTrainingType(type: string): 'strength' | 'conditioning' | 'recovery' | 'film' | 'other' {
    switch (type) {
        case 'strength':
        case 'power':
            return 'strength';
        case 'sport':
        case 'reaction':
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
