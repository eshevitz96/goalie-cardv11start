import {
    TrainingSetting,
    JourneyLevel,
    ReadinessRating,
    WorkoutExercise,
    WorkoutPhase,
    PlannedMission,
    PreSessionAthleteState
} from './athleteTypes';

export type { TrainingSetting, JourneyLevel, ReadinessRating, WorkoutExercise, WorkoutPhase };

export interface DailyWorkoutProgram {
    setting: TrainingSetting;
    level: JourneyLevel;
    readiness: ReadinessRating;
    totalEstimatedMinutes: number;
    summary: string;
    rationale: string;
    activeHypothesisId?: string;
    contractMilestoneRef?: string;
    safetyGateTriggered?: boolean;
    warmupReassessmentRequired?: boolean;
    phases: WorkoutPhase[];
}

export function generateDailyWorkout(
    setting: TrainingSetting,
    level: JourneyLevel,
    readiness: ReadinessRating,
    context?: {
        rationale?: string;
        activeHypothesisId?: string;
        contractMilestoneRef?: string;
        athleteState?: PreSessionAthleteState;
    }
): DailyWorkoutProgram {
    const athleteState = context?.athleteState;
    const soreness = athleteState?.structured.soreness;
    const isProgressivePain = soreness?.behavior === 'progressive' || soreness?.behavior === 'movement_altering';
    const isTransientSoreness = soreness?.behavior === 'transient_resolves';
    
    // Safety Gate: Progressive / Movement-Altering Pain halts heavy loading
    const isRecoveryMode = isProgressivePain || readiness <= 2;
    const isElite = level === 'elite';
    const isFoundation = level === 'foundation';

    // Phase 1: Mobility & Warm-Up
    const mobilityExercises: WorkoutExercise[] = [
        {
            id: 'mob_90_90',
            stage: 'mobility',
            title: '90/90 Hip Flow & Capsule Openers',
            subtitle: 'Internal & external hip rotation',
            setsReps: isFoundation ? '2 sets x 5 switches/side' : '3 sets x 8 switches/side',
            durationSecs: 180,
            equipment: 'Mat / Floor',
            cues: ['Keep spine tall', 'Drive front knee into ground', 'Slow, controlled transitions']
        },
        {
            id: 'mob_cossack',
            stage: 'mobility',
            title: 'Cossack Squats & Groin Flushes',
            subtitle: 'Adductor mobility & deep edge depth',
            setsReps: isFoundation ? '2 sets x 6 reps/leg' : '3 sets x 8 reps/leg',
            durationSecs: 120,
            equipment: 'Bodyweight',
            cues: ['Keep straight-leg heel planted', 'Chest proud', 'Sink into hip crease']
        },
        {
            id: 'mob_ankle',
            stage: 'mobility',
            title: 'Half-Kneeling Ankle Dorsiflexion',
            subtitle: 'Knee-over-toe stance drive',
            setsReps: '2 sets x 10 pulses/side',
            durationSecs: 90,
            equipment: 'Wall / Post',
            cues: ['Keep heel firmly glued to floor', 'Drive knee past toes', 'No foot collapse']
        },
        {
            id: 'mob_t_spine',
            stage: 'mobility',
            title: 'Quadruped T-Spine Rotations & Lat Reach',
            subtitle: 'Upper body tracking posture',
            setsReps: '2 sets x 8 reps/side',
            durationSecs: 90,
            equipment: 'Bodyweight',
            cues: ['Exhale on upward rotation', 'Eyes follow top elbow', 'Keep hips squared']
        }
    ];

    // If transient soreness detected in hips/groin, inject extra targeted capsule prep
    if (isTransientSoreness && (soreness?.locations.includes('hips') || soreness?.locations.includes('adductors'))) {
        mobilityExercises.unshift({
            id: 'mob_targeted_hip_capsule',
            stage: 'mobility',
            title: 'Targeted Hip Capsule Decompression & Glute Flow',
            subtitle: 'Pre-workout activation for transient tightness',
            setsReps: '2 sets x 6 slow circles/side',
            durationSecs: 120,
            equipment: 'Mat / Floor',
            cues: ['Breathe into hip joint', 'Do not force range', 'Reassess tightness after movement']
        });
    }

    // Phase 2: Vision & Reaction
    const reactionExercises: WorkoutExercise[] = [
        {
            id: 'rx_reaction_game',
            stage: 'reaction',
            title: 'Goalie Card Reaction Trainer',
            subtitle: 'Cognitive visual stimulus & neuro-speed',
            setsReps: isRecoveryMode ? '2 rounds' : '3 rounds',
            durationSecs: 180,
            equipment: 'Goalie Card App',
            cues: ['Stay in ready athletic stance', 'React with zero visual delay', 'Reset focus between rounds'],
            isGame: true
        },
        {
            id: 'rx_wall_ball_switches',
            stage: 'reaction',
            title: setting === 'field' ? 'Short-Hop Ball Reaction & Glove Catch' : '2-Ball Wall Ball Quick Switches',
            subtitle: 'Peripheral vision & hand-eye snap',
            setsReps: isFoundation ? '3 sets x 30 catches' : isElite ? '4 sets x 50 catches' : '3 sets x 40 catches',
            durationSecs: 300,
            equipment: '2 Tennis Balls + Wall',
            cues: ['Eyes lead the hands', 'Track all the way into pocket', 'Quiet head throughout']
        },
        {
            id: 'rx_numbered_drops',
            stage: 'reaction',
            title: 'Numbered Ball Drops / Visual Trigger',
            subtitle: 'First-step explosive reaction',
            setsReps: isFoundation ? '3 sets x 6 drops' : '4 sets x 8 drops',
            durationSecs: 180,
            equipment: 'Partner / Ball Bounce',
            cues: ['Attack ball on single bounce', 'Drive off loaded outside edge', 'Soft hands']
        }
    ];

    // Phase 3: Crease Power & Strength
    let strengthExercises: WorkoutExercise[] = [];

    if (setting === 'gym') {
        strengthExercises = [
            {
                id: 'str_gym_1',
                stage: 'strength',
                title: isRecoveryMode ? 'Trap Bar Isometric Stance Holds' : isFoundation ? 'Goblet Squats & Explosive Stand' : 'Trap Bar Jumps / Speed Deadlifts',
                subtitle: 'Lower body rate of force development',
                setsReps: isRecoveryMode ? '3 sets x 20s hold' : isFoundation ? '3 sets x 8 reps' : '4 sets x 5 explosive reps',
                durationSecs: 240,
                equipment: 'Trap Bar / Dumbbells',
                cues: ['Push the floor away', 'Violent hip extension', 'Land soft in athletic stance']
            },
            {
                id: 'str_gym_2',
                stage: 'strength',
                title: 'Bulgarian Split Squats (Dumbbell Loaded)',
                subtitle: 'Single-leg push power & crease stability',
                setsReps: isFoundation ? '3 sets x 6 reps/leg' : '3 sets x 8 reps/leg',
                durationSecs: 240,
                equipment: 'Dumbbells + Bench',
                cues: ['Load front heel & midfoot', 'Keep torso steady', 'Controlled 2-second descent']
            },
            {
                id: 'str_gym_3',
                stage: 'strength',
                title: 'Rotational Med Ball Scoop Slams',
                subtitle: 'Core rotational torque & clear velocity',
                setsReps: '4 sets x 6 reps/side',
                durationSecs: 180,
                equipment: 'Medicine Ball + Wall',
                cues: ['Initiate power from back hip', 'Snap through core', 'Follow through completely']
            },
            {
                id: 'str_gym_4',
                stage: 'strength',
                title: 'Cable / Band Pallof Press & Lateral Shuffles',
                subtitle: 'Anti-rotational crease torso seal',
                setsReps: '3 sets x 10 reps + 15s hold/side',
                durationSecs: 180,
                equipment: 'Cable Machine / Heavy Band',
                cues: ['Do not let torso twist', 'Breathe through brace', 'Arms locked straight at apex']
            }
        ];
    } else if (setting === 'home') {
        strengthExercises = [
            {
                id: 'str_home_1',
                stage: 'strength',
                title: isRecoveryMode ? 'Wall Sit Stance Holds with Hand Reach' : isFoundation ? 'Air Squat Jumps (Stick Ready)' : 'Single-Leg Skater Bounds & Stick Stick',
                subtitle: 'Bodyweight explosive push & edge control',
                setsReps: isRecoveryMode ? '3 sets x 30s' : isFoundation ? '3 sets x 8 reps' : '4 sets x 6 bounds/side',
                durationSecs: 200,
                equipment: 'Bodyweight',
                cues: ['Stick landing on solid edge', 'Absorb force through glute', 'Keep chest tall and hands high']
            },
            {
                id: 'str_home_2',
                stage: 'strength',
                title: 'Elevated Single-Leg Split Squats (Rear Foot on Chair)',
                subtitle: 'Unilateral deceleration strength',
                setsReps: '3 sets x 8 reps/leg',
                durationSecs: 200,
                equipment: 'Chair or Couch',
                cues: ['Knee tracks in line with 2nd toe', 'Drive up through midfoot', 'No forward knee collapse']
            },
            {
                id: 'str_home_3',
                stage: 'strength',
                title: 'Band-Resisted Rotational Crease Step-Outs',
                subtitle: 'Stance drive against lateral tension',
                setsReps: '3 sets x 10 steps/side',
                durationSecs: 180,
                equipment: 'Resistance Band / Towel',
                cues: ['Resist rotation through core', 'Snap into set stance', 'Keep base wide']
            },
            {
                id: 'str_home_4',
                stage: 'strength',
                title: 'Deadbug Isometric Holds & Cross-Reaches',
                subtitle: 'Deep core anterior stability',
                setsReps: '3 sets x 40s total',
                durationSecs: 120,
                equipment: 'Floor / Mat',
                cues: ['Flatten lower back into floor', 'Slow continuous breathing', 'Extend opposite limbs smoothly']
            }
        ];
    } else if (setting === 'field') {
        strengthExercises = [
            {
                id: 'str_field_1',
                stage: 'strength',
                title: '5-Point Crease Arc Footwork Pushes',
                subtitle: 'Arc angle adjustments & immediate set points',
                setsReps: isRecoveryMode ? '3 sets x 20s' : isElite ? '5 sets x 30s' : '4 sets x 25s',
                durationSecs: 300,
                equipment: 'Crease / Cleats / Cones',
                cues: ['Arrive set before shooter release', 'No false steps or hop-resets', 'Short explosive shuffles']
            },
            {
                id: 'str_field_2',
                stage: 'strength',
                title: 'Post-to-Post Lateral Edge Bursts',
                subtitle: 'Pipe coverage & rapid recovery',
                setsReps: '4 sets x 6 reps (3 each way)',
                durationSecs: 240,
                equipment: 'Goal Posts / Crease',
                cues: ['Lead hard with eyes & stick', 'Direct linear line to opposite post', 'Seal post upon arrival']
            },
            {
                id: 'str_field_3',
                stage: 'strength',
                title: 'Low Bounce Step-Downs & Stick Drop Mechanics',
                subtitle: 'Off-hip & bounce reaction speed',
                setsReps: '4 sets x 8 step-downs',
                durationSecs: 200,
                equipment: 'Stick + Balls / Cones',
                cues: ['Attack bounce point', 'Top hand stays punchy', 'Do not drop chest forward']
            },
            {
                id: 'str_field_4',
                stage: 'strength',
                title: 'Outlet Pass Footwork & 30-Yard Laser Bursts',
                subtitle: 'Immediate transition release under pressure',
                setsReps: '3 sets x 6 clears/side',
                durationSecs: 180,
                equipment: 'Stick + Balls',
                cues: ['Step into clear line', 'High release point over riding attack', 'Deliver on the run']
            }
        ];
    } else if (setting === 'travel') {
        strengthExercises = [
            {
                id: 'str_travel_1',
                stage: 'strength',
                title: 'Isometric Crease Stance Holds & Hand Shifts',
                subtitle: 'Time under tension quad & glute endurance',
                setsReps: '4 sets x 30s holds',
                durationSecs: 180,
                equipment: 'Bodyweight',
                cues: ['Hold exact game depth', 'Hands high and active', 'Breathe through the quad burn']
            },
            {
                id: 'str_travel_2',
                stage: 'strength',
                title: 'Tempo Single-Leg Pistol Squats (Chair Target)',
                subtitle: 'Single-leg strength on the road',
                setsReps: '3 sets x 6 reps/leg',
                durationSecs: 180,
                equipment: 'Chair / Bed edge',
                cues: ['3-second descent', 'Drive up without rocking', 'Keep knee tracked straight']
            },
            {
                id: 'str_travel_3',
                stage: 'strength',
                title: 'Towel Isometric Row & Torso Anti-Rotations',
                subtitle: 'Postural back & core seal',
                setsReps: '3 sets x 20s hold/side',
                durationSecs: 150,
                equipment: 'Doorway / Towel',
                cues: ['Brace core tight', 'Pull hard against anchor', 'Maintain neutral spine']
            }
        ];
    } else {
        // 'other'
        strengthExercises = [
            {
                id: 'str_other_1',
                stage: 'strength',
                title: 'Isometric Athletic Stance & Shift Holds',
                subtitle: 'Quad endurance & balance control',
                setsReps: '4 sets x 30s holds',
                durationSecs: 180,
                equipment: 'Bodyweight',
                cues: ['Keep weight in athletic arches', 'Chest proud', 'Focus on breathing']
            },
            {
                id: 'str_other_2',
                stage: 'strength',
                title: 'Tempo Single-Leg Squats & Balance Freezes',
                subtitle: 'Single-leg stabilization',
                setsReps: '3 sets x 8 reps/leg',
                durationSecs: 180,
                equipment: 'Bodyweight',
                cues: ['Controlled 3-second descent', 'Freeze at bottom', 'Drive up evenly']
            },
            {
                id: 'str_other_3',
                stage: 'strength',
                title: 'Multi-Angle Core Planks & Anti-Rotations',
                subtitle: 'Core stability & torso seal',
                setsReps: '3 sets x 30s holds/side',
                durationSecs: 150,
                equipment: 'Floor / Mat',
                cues: ['Keep spine neutral', 'Brace core tight', 'Consistent breathing']
            }
        ];
    }

    if (isRecoveryMode) {
        strengthExercises = strengthExercises.slice(0, 3).map(e => ({
            ...e,
            setsReps: e.setsReps.replace(/4 sets/g, '2 sets').replace(/3 sets/g, '2 sets'),
            cues: [...e.cues, 'Focus on crisp movement quality over maximum speed']
        }));
    }

    // Phase 4: Recovery & Flushes
    const recoveryExercises: WorkoutExercise[] = [
        {
            id: 'rec_hip_flush',
            stage: 'recovery',
            title: 'Frog Stretch & Adductor Flushes',
            subtitle: 'Groin length & hip capsule decompression',
            setsReps: '2 sets x 45s holds',
            durationSecs: 120,
            equipment: 'Mat / Floor',
            cues: ['Sink back into hips on exhales', 'Keep inner knees cushioned', 'Zero sharp pain']
        },
        {
            id: 'rec_box_breathing',
            stage: 'recovery',
            title: '4-4-4-4 Box Breathing Reset',
            subtitle: 'Parasympathetic nervous system recovery',
            setsReps: '1 round x 4 minutes',
            durationSecs: 240,
            equipment: 'Quiet space',
            cues: ['Inhale 4s through nose', 'Hold 4s full', 'Exhale 4s mouth', 'Hold 4s empty']
        }
    ];

    const phases: WorkoutPhase[] = [
        {
            id: 'mobility',
            title: 'Mobility & Warm-Up',
            phaseNumber: 1,
            badge: 'Phase 1',
            focus: isTransientSoreness ? 'Targeted Joint & Hip Capsule Priming' : 'Hip & Ankle Capsule Primer',
            description: isTransientSoreness 
                ? 'Targeted preparation for reported tightness. Reassess symptom behavior before strength.'
                : 'Prime hip capsules, adductors, and ankles for fast-twitch edge work.',
            estimatedMinutes: isRecoveryMode || isTransientSoreness ? 10 : 8,
            exercises: mobilityExercises,
            isWarmupReassessmentCheckpoint: isTransientSoreness
        },
        {
            id: 'reaction',
            title: 'Vision & Reaction',
            phaseNumber: 2,
            badge: 'Phase 2',
            focus: 'Visual Attachment & Hand-Eye Snap',
            description: 'Attach eyes to release point, sharpen hand-eye snap, and activate neuro-speed.',
            estimatedMinutes: 10,
            exercises: reactionExercises
        },
        {
            id: 'strength',
            title: setting === 'field' ? 'Crease Movement & Power' : (isRecoveryMode ? 'Light Circulation & Posture' : 'Strength & Explosive Power'),
            phaseNumber: 3,
            badge: 'Phase 3',
            focus: setting === 'field' ? 'Crease Footwork & Edge Control' : (isRecoveryMode ? 'Non-Axial Circulation & Scapular Control' : 'Lower Body Force & Single-Leg Stability'),
            description: isRecoveryMode 
                ? 'Submaximal circulation and joint-friendly blood flow without axial fatigue.'
                : `Environment-tailored for ${setting.toUpperCase()} (${level.toUpperCase()} level).`,
            estimatedMinutes: isRecoveryMode ? 12 : 25,
            exercises: strengthExercises
        },
        {
            id: 'recovery',
            title: 'Recovery & Flushes',
            phaseNumber: 4,
            badge: 'Phase 4',
            focus: 'Groin Length & Nervous System Reset',
            description: 'Flush groin tissues, calm heart rate with box breathing, and lock in recovery.',
            estimatedMinutes: 7,
            exercises: recoveryExercises
        }
    ];

    const totalEstimatedMinutes = phases.reduce((acc, p) => acc + p.estimatedMinutes, 0);

    const settingLabels: Record<TrainingSetting, string> = {
        gym: 'Gym',
        home: 'Home',
        facility: 'Facility',
        field: 'Facility / Field',
        travel: 'Travel',
        other: 'Other'
    };

    const levelLabels = {
        foundation: 'Foundation',
        competitive: 'High School / Prep',
        elite: 'College / Elite Pro'
    };

    const summary = `${settingLabels[setting]} • ${levelLabels[level]} • ${isRecoveryMode ? 'Active Recovery & Flush' : 'Full Performance Protocol'}`;

    // Rationale Generation incorporating Phase 2 State Sensing
    let rationale = context?.rationale;
    if (!rationale) {
        if (isProgressivePain) {
            rationale = `Safety Gate Triggered: Progressive or movement-altering discomfort noted in ${soreness?.locations.join(', ') || 'body'}. Aggravating axial loads halted; non-aggravating mobility and light circulation offered for assessment.`;
        } else if (isTransientSoreness) {
            rationale = `Transient tightness reported in ${soreness?.locations.join(', ') || 'tissues'}. Injected targeted capsule preparation. Reassess symptom behavior after Phase 1 warm-up before progressing to strength.`;
        } else if (isRecoveryMode) {
            rationale = `Prescribed active recovery and mobility flush based on readiness score (${readiness}/5) to optimize tissue restoration.`;
        } else {
            const feelTags: string[] = [];
            if (athleteState?.structured.physical) feelTags.push(`physical: ${athleteState.structured.physical}`);
            if (athleteState?.structured.neuromuscular) feelTags.push(`neuromuscular: ${athleteState.structured.neuromuscular}`);
            if (athleteState?.structured.mental) feelTags.push(`mental: ${athleteState.structured.mental}`);
            if (athleteState?.structured.goalieState) feelTags.push(`goalie state: ${athleteState.structured.goalieState}`);
            
            const stateContext = feelTags.length > 0 ? ` (Sensed state: ${feelTags.join(', ')})` : '';
            rationale = `Prescribed 4-phase protocol for ${levelLabels[level]} in ${settingLabels[setting]} setting at readiness ${readiness}/5${stateContext}.`;
        }
    }

    return {
        setting,
        level,
        readiness,
        totalEstimatedMinutes,
        summary,
        rationale,
        activeHypothesisId: context?.activeHypothesisId,
        contractMilestoneRef: context?.contractMilestoneRef,
        safetyGateTriggered: isProgressivePain,
        warmupReassessmentRequired: isTransientSoreness,
        phases
    };
}

export function toPlannedMission(
    userId: string,
    date: string,
    program: DailyWorkoutProgram
): PlannedMission {
    return {
        id: `mission-${date}-${Date.now()}`,
        userId,
        date,
        setting: program.setting,
        level: program.level,
        readiness: program.readiness,
        objective: 'MAINTAIN_CAPACITY',
        rationale: program.rationale,
        activeHypothesisId: program.activeHypothesisId,
        contractMilestoneRef: program.contractMilestoneRef,
        phases: program.phases,
        totalEstimatedMinutes: program.totalEstimatedMinutes,
        summary: program.summary,
        createdAt: new Date().toISOString()
    };
}
