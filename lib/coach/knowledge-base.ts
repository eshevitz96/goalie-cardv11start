export interface ExerciseItem {
    exercise: string;
    sets60: string;
    sets30: string;
    weight: string;
}

export interface AthleticDrill {
    exercise: string;
    goal: string;
    cue: string;
}

export interface CoreItem {
    exercise: string;
    reps60: string;
    reps30: string;
    weight: string;
}

export interface KnowledgeBase {
    warmups: {
        gym: {
            sore: string[];
            notSore: string[];
        };
        home: {
            sore: string[];
            notSore: string[];
        };
    };
    strength: {
        legs: {
            gym: ExerciseItem[];
            home: ExerciseItem[];
        };
        upperCorePivot: {
            gym: ExerciseItem[];
            home: ExerciseItem[];
        };
    };
    athletic: Record<string, AthleticDrill>;
    core: {
        gym: CoreItem[];
        home: CoreItem[];
    };
    conditioning: {
        gym: string;
        home: string;
    };
}

export const GLADIATORS_KNOWLEDGE_BASE: KnowledgeBase = {
    warmups: {
        gym: {
            sore: ["Bike (Light, 5m)", "Deep Squat Hold (2m)", "Leg Swings (15/side)"],
            notSore: ["Bike (Moderate, 5m)", "Deep Squat Hold (2m)", "Cossack Squats (10/side)", "Lunges (10/side)", "Leg Swings (15/side)"]
        },
        home: {
            sore: ["Jumping Jacks (1m)", "Deep Squat Hold (2m)", "Leg Swings (15/side)"],
            notSore: ["Jumping Jacks (2m)", "Deep Squat Hold (2m)", "Cossack Squats (10/side)", "Lunges (10/side)", "Leg Swings (15/side)"]
        }
    },
    strength: {
        legs: {
            gym: [
                { exercise: "Goblet Squat", sets60: "5x6", sets30: "3x6", weight: "75 lbs" },
                { exercise: "Bulgarian Split Squat", sets60: "3x8", sets30: "2x8", weight: "35 lbs" },
                { exercise: "RDL", sets60: "3x8", sets30: "2x8", weight: "70 lbs" }
            ],
            home: [
                { exercise: "Bodyweight Goblet Squat", sets60: "5x12", sets30: "3x12", weight: "Bodyweight" },
                { exercise: "Bodyweight Bulgarian", sets60: "3x10", sets30: "2x10", weight: "Bodyweight" },
                { exercise: "Single-Leg RDL", sets60: "3x10", sets30: "2x10", weight: "Bodyweight" }
            ]
        },
        upperCorePivot: {
            gym: [
                { exercise: "Dumbbell Bench Press", sets60: "5x8", sets30: "3x8", weight: "45 lbs" },
                { exercise: "Lat Pulldown", sets60: "3x10", sets30: "2x10", weight: "90 lbs" },
                { exercise: "Seated Cable Row", sets60: "3x10", sets30: "2x10", weight: "85 lbs" }
            ],
            home: [
                { exercise: "Push-ups (Perfect Form)", sets60: "5x12", sets30: "3x12", weight: "Bodyweight" },
                { exercise: "Pike Push-ups", sets60: "3x8", sets30: "2x8", weight: "Bodyweight" },
                { exercise: "Doorframe Row", sets60: "3x12", sets30: "2x12", weight: "Bodyweight" }
            ]
        }
    },
    athletic: {
        "Landing Quality": { exercise: "Box Jumps", goal: "Quiet Landings", cue: "Freeze for 1s. Zero sound upon landing." },
        "Right-Side Balance": { exercise: "Skater Jumps", goal: "Stick Landing", cue: "Keep head level. Freeze on right leg." },
        "Conditioning": { exercise: "Shadow Crease Work", goal: "Continuous Crease Shuffles", cue: "Simulate game-pace movements without stopping." }
    },
    core: {
        gym: [
            { exercise: "Russian Twist", reps60: "3x20", reps30: "2x20", weight: "25 lbs" },
            { exercise: "Side Plank", reps60: "2x30s", reps30: "1x30s", weight: "Bodyweight" }
        ],
        home: [
            { exercise: "Russian Twist", reps60: "3x20", reps30: "2x20", weight: "Bodyweight" },
            { exercise: "Side Plank", reps60: "2x30s", reps30: "1x30s", weight: "Bodyweight" }
        ]
    },
    conditioning: {
        gym: "Bike: 10 x | 20s hard | 40s easy",
        home: "Jump Rope: 10 x | 20s hard | 40s easy"
    }
};
