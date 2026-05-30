import { DrillDef } from "../expert-engine";

export const WARMUPS: Record<string, DrillDef> = {
    hockey: {
        name: "Hand-Eye & Movement Prep",
        duration: "10 mins",
        type: "physical",
        steps: [
            "2-ball juggling for 3 minutes to lock in focus.",
            "Dynamic stretching (lunges, leg swings).",
            "Crease movement: 5 sets of post-to-post slides.",
            "Visual tracking: Follow the puck/ball to your hand."
        ]
    },
    lacrosse: {
        name: "Wall Ball Activation",
        duration: "10 mins",
        type: "physical",
        steps: [
            "50 right hand, 50 left hand.",
            "Quick stick exchanges.",
            "Focus on soft hands and tracking the ball to the plastic."
        ]
    },
    soccer: {
        name: "Keeper Footwork & Handling",
        duration: "10 mins",
        type: "physical",
        steps: [
            "Ladders or cones: Quick feet set for 2 minutes.",
            "Handling: 20 volleys to hands, focus on 'W' catch.",
            "Diving: 10 low collapsed saves to each side.",
            "Distribution: 5 throws to targets."
        ]
    },
    default: {
        name: "General Athlete Activation",
        duration: "10 mins",
        type: "physical",
        steps: [
            "Dynamic warm-up: 5 minutes of movement.",
            "Core activation: Planck and side-bridge.",
            "Hand-eye: 2-ball juggling for 3 minutes.",
            "Focus on rhythmic breathing."
        ]
    }
};

export const MENTAL_RESETS: Record<string, DrillDef> = {
    frustrated: {
        name: "Box Breathing (Reset)",
        duration: "3 mins",
        type: "mental",
        steps: [
            "Find a quiet spot or close your eyes at the bench.",
            "Inhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Exhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Repeat. Let go of the session's outcome."
        ]
    },
    anxious: {
        name: "Box Breathing (Reset)",
        duration: "3 mins",
        type: "mental",
        steps: [
            "Find a quiet spot or close your eyes at the bench.",
            "Inhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Exhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Repeat. Let go of the session's outcome."
        ]
    },
    happy: {
        name: "Success Visualization",
        duration: "3 mins",
        type: "mental",
        steps: [
            "Close your eyes and replay your best save from today.",
            "Notice your positioning and how effortless it felt.",
            "Lock in that feeling of confidence.",
            "Recognize the work you put in today."
        ]
    },
    neutral: {
        name: "End of Session Review",
        duration: "3 mins",
        type: "mental",
        steps: [
            "Take 3 deep breaths.",
            "Review one thing you did really well today.",
            "Review one micro-adjustment you want to bring into tomorrow.",
            "Leave the work at the rink and step away clean."
        ]
    }
};

export const DEFAULT_DRILL: DrillDef = {
    name: "Goal Area Movement",
    duration: "15 mins",
    type: "physical",
    steps: [
        "10 Lateral pushes left to right.",
        "10 Drop slides left to right.",
        "10 Shuffles forward and backward.",
        "Focus on quiet upper body."
    ]
};
