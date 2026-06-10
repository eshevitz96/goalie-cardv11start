export interface DrillDetails {
    steps: string[];
    points: string[];
    duration?: number;
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
        points: ["Eyes lead the hands", "Quiet head", "Soft hands"],
        duration: 5
    },
    "Wall Ball (Alt Hands)": {
        steps: [
            "Stand 5-10 feet from a wall.",
            "Throw ball with right hand, catch with left.",
            "Throw with left, catch with right.",
            "Increase speed as you get comfortable."
        ],
        points: ["Crossing midline", "Track the ball", "Stay low"],
        duration: 5
    },
    "Juggling & Wall Ball tracking": {
        steps: [
            "Start with 2 balls, then 3 if capable.",
            "Juggle for 1 minute intervals.",
            "Switch to wall ball tracking immediately after."
        ],
        points: ["Peripheral vision", "Hand speed", "Focus"],
        duration: 8
    },
    "Goal Area Movement": {
        steps: [
            "Start at the top of the goal area.",
            "Push laterally to the post.",
            "Shuffle back to top.",
            "Repeat for both sides."
        ],
        points: ["Sharp stops", "Head up", "Stick down"],
        duration: 10
    },
    "Low Save Mechanics": {
        steps: [], points: [],
        duration: 5
    },
    "Wall Ball - Low Hops": {
        steps: [
            "Throw tennis ball low against wall/floor junction.",
            "React to the unpredictable bounce.",
            "stay in a low stance."
        ],
        points: ["Visual attachment", "Reaction time", "Knee bend"],
        duration: 5
    },
    "Butterfly Slides & Stick Seal": {
        steps: [
            "Start on posts.",
            "Push to top of goal area in drop stance/butterfly.",
            "Rotate and slide/move to opposite post.",
            "Ensure stick leads the movement."
        ],
        points: ["Seal the ground/ice", "Stick covers five-hole/gap", "Upright torso"],
        duration: 8
    },
    "Rebound Placement (Box Control)": {
        steps: [
            "Visualise a shot coming from the point.",
            "Make the save and direct rebound to the corner.",
            "Reset and repeat."
        ],
        points: ["Soft pads", "Stick steering", "Control the outcome"],
        duration: 10
    },
    "Up-Downs / Recoveries": {
        steps: [
            "Start in drop stance/butterfly.",
            "On whistle/command, get up to stance.",
            "Drop back down.",
            "Repeat for 30 seconds."
        ],
        points: ["Explive power", "Full recovery", "Ready hands"],
        duration: 5
    },
    "Post-to-Post Recoveries": {
        steps: [
            "Start on left post.",
            "Explode to right post.",
            "Set, then explode back.",
            "Focus on clean edges."
        ],
        points: ["Lead with eyes", "Hard push", "Square arrival"],
        duration: 8
    },
    "Coach Assigned Specifics": {
        steps: ["Follow the instructions provided by your coach in the session notes."],
        points: ["Listen to feedback", "Execute with precision"],
        duration: 12
    },

    // --- Mental ---
    "Box Breathing": {
        steps: [
            "Inhale for 4 seconds.",
            "Hold for 4 seconds.",
            "Exhale for 4 seconds.",
            "Hold for 4 seconds."
        ],
        points: ["Regulate heart rate", "Clear mind", "Focus on breath"],
        duration: 4
    },
    "Box Breathing & Basics": {
        steps: [
            "Perform box breathing for 2 minutes.",
            " visualize your basic stance and movements.",
            "Feel the ice/turf under your feet."
        ],
        points: ["Calmness", "Grounding", "Simplicity"],
        duration: 5
    },
    "Disconnect & Walk": {
        steps: [
            "Leave the training environment.",
            "Walk outside for at least 30 minutes.",
            "No phones, no music.",
            "Observe your surroundings."
        ],
        points: ["Mental reset", "Perspective", "Fresh air"],
        duration: 30
    },
    "Positive Visualization (Saves)": {
        steps: [
            "Close your eyes.",
            "Picture yourself making your best saves.",
            "Feel the puck/ball hitting you.",
            "Hear the crowd/teammates cheering."
        ],
        points: ["Confidence", "Memory recall", "Positive emotion"],
        duration: 5
    },

    // --- Video ---
    "Video Review (Goals Against)": {
        steps: [
            "Watch each goal against 3 times.",
            "1. Watch the play develop.",
            "2. Watch your positioning.",
            "3. Watch your reaction/technique."
        ],
        points: ["Objective analysis", "Learn, don't judge", "Identify patterns"],
        duration: 15
    }
};

export const getDrillDetails = (drillName: string): DrillDetails => {
    return DRILL_LIBRARY[drillName] || {
        steps: ["Follow standard execution for this drill.", "Focus on quality reps."],
        points: ["Focus", "Quality", "Effort"]
    };
};
