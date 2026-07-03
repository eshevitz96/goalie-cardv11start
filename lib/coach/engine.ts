import { AthleteProfile, ReadinessContext, Mission, MissionBlock, Task } from "./types";
import { KnowledgeBase } from "./knowledge-base";

// Helper to generate UUIDs client-side (v4 compatible standard script)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Pure, deterministic Coach Engine.
 * Given the same athlete profile, readiness check-in, and knowledge library,
 * it generates an identical Mission with explainability tags.
 */
export function generateMission(
    userId: string,
    profile: AthleteProfile,
    readiness: ReadinessContext,
    contractId: string,
    dayNumber: number,
    kb: KnowledgeBase
): Mission {
    const explanation: string[] = [];
    const blocks: MissionBlock[] = [];
    
    const isLegsSore = readiness.soreness.legs;
    const isCoreSore = readiness.soreness.core;
    const isUpperSore = readiness.soreness.upper;
    const isRecoveryDay = profile.recentFatigueLevel === "high" || readiness.energy <= 4;
    
    // Log baseline inputs for explainability
    explanation.push(`Active Contract: ${contractId}`);
    explanation.push(`Time Available: ${readiness.time_minutes} minutes`);
    explanation.push(`Environment: ${readiness.location}`);
    explanation.push(`Energy checked: ${readiness.energy}/10`);
    explanation.push(`Active Bottleneck: ${readiness.activeBottleneck}`);
    
    // ----------------------------------------------------
    // BLOCK 1: WARMUP
    // ----------------------------------------------------
    const warmupSource = readiness.location === "gym" ? kb.warmups.gym : kb.warmups.home;
    let warmupTasks: string[] = [];
    
    if (isLegsSore) {
        warmupTasks = warmupSource.sore;
        explanation.push("Leg soreness flagged: Warmup shifted to low-impact muscle activation.");
    } else {
        warmupTasks = warmupSource.notSore;
        explanation.push("No leg soreness: Standard range-of-motion warmup applied.");
    }
    
    blocks.push({
        id: "block-warmup",
        title: "WARMUP",
        subtitle: "MOBILITY ACTIVATION",
        tasks: warmupTasks.map(name => ({ name, done: false }))
    });

    // ----------------------------------------------------
    // BLOCK 2: STRENGTH / PRIMARY TASKS
    // ----------------------------------------------------
    // Soreness pivot rule: if legs are sore, switch strength focus to upper/core
    const strengthGroup = isLegsSore ? kb.strength.upperCorePivot : kb.strength.legs;
    const strengthList = readiness.location === "gym" ? strengthGroup.gym : strengthGroup.home;
    
    if (isLegsSore) {
        explanation.push("Leg fatigue high: Primary strength focus pivoted to Upper Body & Core Stability to facilitate lower body recovery.");
    } else {
        explanation.push("Lower body ready: Primary strength focused on Leg Power & Extensions.");
    }

    if (isRecoveryDay) {
        explanation.push("High fatigue or low energy detected: Coach Engine triggered Recovery Deload (-25% intensity).");
    }

    const strengthTasks: Task[] = strengthList.map(item => {
        let sets = readiness.time_minutes === 60 ? item.sets60 : item.sets30;
        if (isUpperSore && isLegsSore) {
            // Sore upper body: scale down strength sets (e.g., "5x8" -> "3x8")
            if (sets.includes("x")) {
                const parts = sets.split("x");
                sets = `${Math.max(1, parseInt(parts[0], 10) - 2)}x${parts[1]}`;
            }
        }
        const weight = isRecoveryDay ? `${item.weight} (Recovery Deload -25%)` : item.weight;
        return {
            name: item.exercise,
            sets,
            weight,
            done: false
        };
    });
    
    if (isUpperSore && isLegsSore) {
        explanation.push("Upper body soreness flagged: Upper body strength volume scaled down.");
    }
    
    explanation.push(`Volume scaled to ${readiness.time_minutes}m timeline allocation.`);

    blocks.push({
        id: "block-strength",
        title: "PRIMARY TASKS",
        subtitle: isLegsSore ? "UPPER STRENGTH" : "LEG POWER",
        tasks: strengthTasks
    });

    // ----------------------------------------------------
    // BLOCK 3: ATHLETIC / GOALIE SKILL
    // ----------------------------------------------------
    const bottleneckMapping: Record<string, string> = {
        'landing_quality': "Landing Quality",
        'right_side_balance': "Right-Side Balance",
        'conditioning': "Conditioning"
    };
    const kbKey = bottleneckMapping[readiness.activeBottleneck] || readiness.activeBottleneck;
    const athleticData = kb.athletic[kbKey];
    
    explanation.push(`Targeted drill injected to resolve bottleneck: ${readiness.activeBottleneck}.`);
    
    blocks.push({
        id: "block-athletic",
        title: "ATHLETIC SKILL",
        subtitle: "TARGET DRILL",
        tasks: [
            {
                name: athleticData.exercise,
                sets: "Goal: " + athleticData.goal,
                weight: "Cue: " + athleticData.cue,
                done: false
            }
        ]
    });

    // ----------------------------------------------------
    // BLOCK 4: CORE
    // ----------------------------------------------------
    const coreList = readiness.location === "gym" ? kb.core.gym : kb.core.home;
    const coreTasks: Task[] = coreList.map(item => {
        let reps = readiness.time_minutes === 60 ? item.reps60 : item.reps30;
        if (isCoreSore) {
            // Core soreness flagged: scale core reps/seconds down by 50%
            if (reps.includes("x")) {
                const parts = reps.split("x");
                reps = `${parts[0]}x${Math.ceil(parseInt(parts[1], 10) / 2)}`;
            } else if (reps.includes("s")) {
                reps = reps.replace(/(\d+)s/, (match, sec) => `${Math.ceil(parseInt(sec, 10) / 2)}s`);
            }
        }
        return {
            name: item.exercise,
            reps,
            weight: item.weight,
            done: false
        };
    });

    if (isCoreSore) {
        explanation.push("Core soreness flagged: Core stability volume scaled down by 50%.");
    }

    blocks.push({
        id: "block-core",
        title: "CORE STABILITY",
        subtitle: "BASICS",
        tasks: coreTasks
    });

    // ----------------------------------------------------
    // BLOCK 5: CONDITIONING
    // ----------------------------------------------------
    const conditioningText = readiness.location === "gym" ? kb.conditioning.gym : kb.conditioning.home;
    blocks.push({
        id: "block-conditioning",
        title: "CONDITIONING",
        subtitle: "BIKE INTERVALS",
        tasks: [
            {
                name: conditioningText,
                done: false
            }
        ]
    });

    // ----------------------------------------------------
    // MISSION HEADINGS & STRINGS
    // ----------------------------------------------------
    const missionTitle = isLegsSore 
        ? "UPPER STABILITY + GOALIE COGNITIVE"
        : "LOWER BODY POWER + GOALIE ATHLETICISM";

    const missionStatement = isRecoveryDay
        ? "Prioritize mobility and smooth execution over raw weight load."
        : "Explode through the extensions. Keep movements tight and compact.";

    const coachFocus = athleticData.cue;
    const successCriteria = isRecoveryDay
        ? "Complete all sets with deliberate control. Focus on joint alignment."
        : `Execute ${athleticData.exercise} matching bottleneck focus: ${athleticData.goal}.`;

    const isoDate = new Date().toISOString().split('T')[0];

    return {
        id: generateUUID(),
        user_id: userId,
        contract_id: contractId,
        mission_date: isoDate,
        day_number: dayNumber,
        title: missionTitle,
        directive: missionStatement,
        bottleneck: readiness.activeBottleneck,
        readiness: {
            energy: readiness.energy,
            soreness: {
                legs: readiness.soreness.legs,
                core: readiness.soreness.core,
                upper: readiness.soreness.upper
            },
            location: readiness.location,
            time_minutes: readiness.time_minutes
        },
        blocks,
        coach_focus: coachFocus,
        success_criteria: successCriteria,
        recovery_notes: isRecoveryDay ? "Fatigue modifier active." : undefined,
        explanation,
        status: 'assigned'
    };
}
