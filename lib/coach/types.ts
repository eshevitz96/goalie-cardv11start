export type CoachSlotStatus = 
    | 'AVAILABLE' 
    | 'BOOKED' 
    | 'COMPLETED' 
    | 'CANCELED' 
    | 'CANCELED_NO_CHARGE' 
    | 'CANCELED_LATE_CHARGE' 
    | 'NO_SHOW';

export type CancellationClassification = 'CANCELED_NO_CHARGE' | 'CANCELED_LATE_CHARGE';

export interface CoachScheduleBlock {
    id: string;
    coachId?: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm or e.g. '17:00' / '5:00 PM'
    endTime: string; // HH:mm or e.g. '18:00' / '6:00 PM'
    location: string;
    status: CoachSlotStatus;
    participantRole: 'COACH';
    clientId?: string; // Canonical Client UUID
    client?: string; // Named client string for display
    lessonCode?: string; // e.g. 'S21 L2', 'S13 L1', 'S25 L3'
    lessonId?: string; // Canonical Lesson UUID in sessions table
    scheduledStartAt?: string; // Canonical ISO timestamp (America/New_York)
    canceledAt?: string; // Canonical ISO timestamp of cancellation event
    cancellationNoticeMinutes?: number; // Derived minutes of advance notice
    cancellationClassification?: CancellationClassification;
    consumesLessonCredit?: boolean; // True if late cancellation or completed
    notes?: string;
    durationMins?: number;
    previousStatus?: CoachSlotStatus;
    createdAt?: string;
    updatedAt?: string;
}

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

/**
 * Format client/athlete name to First Initial + Last Name (e.g. "C. Gethers", "H. Cortjens", "B. Gebhardt")
 */
export function formatFirstInitialLastName(name?: string): string {
    if (!name || !name.trim()) return '';
    const trimmed = name.trim();

    // Known roster mappings for single names or canonical IDs
    const KNOWN_MAP: Record<string, string> = {
        'carter': 'C. Gethers',
        'carter gethers': 'C. Gethers',
        'gc-client-carter-gethers': 'C. Gethers',
        'hunter': 'H. Cortjens',
        'hunter cortjens': 'H. Cortjens',
        'gc-client-hunter-cortjens': 'H. Cortjens',
        'brock': 'B. Gebhardt',
        'brock gebhardt': 'B. Gebhardt',
        'gc-client-brock-gebhardt': 'B. Gebhardt',
        'jake': 'J. Franklin',
        'jake franklin': 'J. Franklin',
        'gc-client-jake-franklin': 'J. Franklin',
        'susie': 'S. McElheny',
        'susie mcelheny': 'S. McElheny',
        'gc-client-susie-mcelheny': 'S. McElheny',
        'judah': 'J. Barker',
        'judah barker': 'J. Barker',
        'sophia': 'S. Hall',
        'sophia hall': 'S. Hall',
        'sophie': 'S. Hall',
        'sophie hall': 'S. Hall',
        'gabe': 'G. Stone',
        'gabe stone': 'G. Stone',
        'gabriel': 'G. Stone',
        'gabriel stone': 'G. Stone',
        'birdie': 'B. Wilson',
        'birdie wilson': 'B. Wilson',
        'colton': 'C. Aven',
        'colton aven': 'C. Aven',
        'madelyn': 'M. Evans',
        'madelyn evans': 'M. Evans',
        'jay': 'J. Bhoopathy',
        'jay bhoopathy': 'J. Bhoopathy',
        'dominic': 'D. Doldo',
        'dominic doldo': 'D. Doldo',
        'landon': 'L. Holcombe',
        'landon holcombe': 'L. Holcombe',
        'grant': 'G. Freeman',
        'grant freeman': 'G. Freeman',
    };

    const lower = trimmed.toLowerCase();
    if (KNOWN_MAP[lower]) {
        return KNOWN_MAP[lower];
    }

    // Already formatted as "X. Lastname"
    if (/^[A-Za-z]\.\s+[A-Za-z'-]+$/.test(trimmed)) {
        return `${trimmed.charAt(0).toUpperCase()}.${trimmed.slice(2)}`;
    }

    // Format "First Last" -> "F. Last"
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        const firstInitial = parts[0].charAt(0).toUpperCase();
        const lastName = parts.slice(1).join(' ');
        return `${firstInitial}. ${lastName}`;
    }

    return trimmed;
}
