export interface DrillDetails {
    steps: string[];
    points: string[];
}

export const DRILL_LIBRARY: Record<string, DrillDetails> = {
    // --- Physical ---
    "Hand-Eye Activation": {
        steps: [
            "Stand in a ready stance.",
            "Throw a tennis ball against a wall.",
            "Track it all the way into your hand.",
            "Switch hands every 10 reps."
        ],
        points: ["Eyes lead the hands", "Quiet head", "Soft hands"]
    },
    "Wall Ball (Alt Hands)": {
        steps: [
            "Stand 5-10 feet from a wall.",
            "Throw ball with right hand, catch with left.",
            "Throw with left, catch with right.",
            "Increase speed as you get comfortable."
        ],
        points: ["Crossing midline", "Track the ball", "Stay low"]
    },
    "Juggling & Wall Ball tracking": {
        steps: [
            "Start with 2 balls, then 3 if capable.",
            "Juggle for 1 minute intervals.",
            "Switch to wall ball tracking immediately after."
        ],
        points: ["Peripheral vision", "Hand speed", "Focus"]
    },
    "Goal Area Movement": {
        steps: [
            "Start at the top of the goal area.",
            "Push laterally to the post.",
            "Shuffle back to top.",
            "Repeat for both sides."
        ],
        points: ["Sharp stops", "Head up", "Stick down"]
    },
    "Low Save Mechanics": { // Mapped from "Wall Ball - Low Hops"? No, need to match name exact or use fuzzy.
        // The expert engine uses "Wall Ball - Low Hops"
        steps: [], points: []
    },
    "Wall Ball - Low Hops": {
        steps: [
            "Throw tennis ball low against wall/floor junction.",
            "React to the unpredictable bounce.",
            "stay in a low stance."
        ],
        points: ["Visual attachment", "Reaction time", "Knee bend"]
    },
    "Butterfly Slides & Stick Seal": {
        steps: [
            "Start on posts.",
            "Push to top of goal area in drop stance/butterfly.",
            "Rotate and slide/move to opposite post.",
            "Ensure stick leads the movement."
        ],
        points: ["Seal the ground/ice", "Stick covers five-hole/gap", "Upright torso"]
    },
    "Rebound Placement (Box Control)": {
        steps: [
            "Visualise a shot coming from the point.",
            "Make the save and direct rebound to the corner.",
            "Reset and repeat."
        ],
        points: ["Soft pads", "Stick steering", "Control the outcome"]
    },
    "Up-Downs / Recoveries": {
        steps: [
            "Start in drop stance/butterfly.",
            "On whistle/command, get up to stance.",
            "Drop back down.",
            "Repeat for 30 seconds."
        ],
        points: ["Explosive power", "Full recovery", "Ready hands"]
    },
    "Post-to-Post Recoveries": {
        steps: [
            "Start on left post.",
            "Explode to right post.",
            "Set, then explode back.",
            "Focus on clean edges."
        ],
        points: ["Lead with eyes", "Hard push", "Square arrival"]
    },
    "Coach Assigned Specifics": {
        steps: ["Follow the instructions provided by your coach in the session notes."],
        points: ["Listen to feedback", "Execute with precision"]
    },

    // --- Mental ---
    "Box Breathing": {
        steps: [
            "Inhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Exhale for 4 seconds.",
            "Hold for 4 seconds."
        ],
        points: ["Regulate heart rate", "Clear mind", "Focus on breath"]
    },
    "Box Breathing & Basics": {
        steps: [
            "Perform box breathing for 2 minutes.",
            " visualize your basic stance and movements.",
            "Feel the ice/turf under your feet."
        ],
        points: ["Calmness", "Grounding", "Simplicity"]
    },
    "Disconnect & Walk": {
        steps: [
            "Leave the training environment.",
            "Walk outside for at least 30 minutes.",
            "No phones, no music.",
            "Observe your surroundings."
        ],
        points: ["Mental reset", "Perspective", "Fresh air"]
    },
    "Positive Visualization (Saves)": {
        steps: [
            "Close your eyes.",
            "Picture yourself making your best saves.",
            "Feel the puck/ball hitting you.",
            "Hear the crowd/teammates cheering."
        ],
        points: ["Confidence", "Memory recall", "Positive emotion"]
    },

    // --- Video ---
    "Video Review (Goals Against)": {
        steps: [
            "Watch each goal against 3 times.",
            "1. Watch the play develop.",
            "2. Watch your positioning.",
            "3. Watch your reaction/technique."
        ],
        points: ["Objective analysis", "Learn, don't judge", "Identify patterns"]
    }
};

export const getDrillDetails = (drillName: string): DrillDetails => {
    return DRILL_LIBRARY[drillName] || {
        steps: ["Follow standard execution for this drill.", "Focus on quality reps."],
        points: ["Focus", "Quality", "Effort"]
    };
};
