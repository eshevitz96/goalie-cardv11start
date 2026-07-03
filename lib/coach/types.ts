export interface AthleteProfile {
    user_id: string; // UUID mapping (replaces athlete_id)
    baselines: {
        balance: number;
        landing: number;
        conditioning: number;
    };
    constraints_notes?: string;
    recentFatigueLevel: "low" | "moderate" | "high";
    previousMissionCompleted: boolean;
    totalCompletedMissions: number;
    learnedInsights: string[];
}

export interface ReadinessContext {
    energy: number;
    soreness: {
        legs: boolean;
        core: boolean;
        upper: boolean;
    };
    location: "home" | "gym";
    time_minutes: number; // 30 or 60
    activeBottleneck: string; // e.g. 'landing_quality', 'right_side_balance', 'conditioning'
}

export interface Task {
    name: string;
    sets?: string;
    reps?: string;
    weight?: string;
    done: boolean;
}

export interface MissionBlock {
    id: string;
    title: string;
    subtitle?: string;
    tasks: Task[];
}

export interface Mission {
    id: string; // UUID (replaces mission_id)
    user_id: string;
    contract_id: string;
    mission_date: string; // ISO date string (YYYY-MM-DD)
    day_number: number;
    title: string;
    directive: string;
    bottleneck: string; // e.g. 'landing_quality', 'right_side_balance', 'conditioning'
    readiness: {
        energy: number;
        soreness: {
            legs: boolean;
            core: boolean;
            upper: boolean;
        };
        location: "home" | "gym";
        time_minutes: number;
    };
    blocks: MissionBlock[];
    coach_focus: string;
    success_criteria: string;
    recovery_notes?: string;
    explanation: string[]; // Explainability trace
    status: 'assigned' | 'completed' | 'skipped';
    completed_at?: string;
    created_at?: string;
}

export interface Session {
    session_id: string;
    mission_id: string | null;
    athlete_id: string;
    completed_at: string;
    actual_time: number;
    completed_blocks: MissionBlock[];
    status: "started" | "completed" | "partial" | "skipped";
    source: "mission" | "manual" | "imported" | "coach_adjusted";
}

export interface Reflection {
    reflection_id: string;
    mission_id: string;
    athlete_id: string;
    energy: number;
    balanceRating: number;
    landingRating: number;
    conditioningRating: number;
    winToday: string;
    bottleneck: string;
    tomorrowFocus: string;
}

export interface LearningResult {
    learning_update_id: string;
    athlete_id: string;
    previousProfile: AthleteProfile;
    updatedProfile: AthleteProfile;
    insights: string[];
    deltas: {
        balanceDelta: number;
        landingDelta: number;
        conditioningDelta: number;
    };
}
