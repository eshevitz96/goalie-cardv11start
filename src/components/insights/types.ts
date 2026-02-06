export interface Session {
    id: string;
    roster_id: string;
    date: string;
    session_number: number;
    lesson_number: number;
    roster: {
        goalie_name: string;
    } | null;
}

export interface RawSession {
    id: string;
    date: string;
    session_number: number;
    lesson_number: number;
    roster_id: string;
    roster: {
        goalie_name: string;
    } | { goalie_name: string }[] | null;
}

export interface RawReflection {
    id: string;
    created_at: string;
    roster_id: string;
    mood: string;
    author_role: string;
}

export interface Reflection {
    id: string;
    created_at: string;
    roster_id: string;
    mood: string;
    author_role: string;
}

export interface GoalieStat {
    name: string;
    id: string;
    lessons: number;
    reflections: number;
    totalActivity: number;
    sessionsStarted: number | Set<number>; // Modified to accept number after processing
    completedSessions?: number;
    firstActivity: string;
    lastActivity: string;
    completed?: number;
    partial?: number;
    completionRate?: number;
}

export interface StatsState {
    totalLessons: number;
    totalActivity: number;
    uniqueGoalies: number;
    completedSessions: number;
    partialSessions: number;
    avgActivityPerWeek: string;
    maxActivityWeek: number;
    p75: number;
    p90: number;
    topGrinders: { id: string; name: string; count: number; breakdown: string }[];
}

export interface MonthlyData {
    month: string;
    lessons: number;
    journals: number;
    total: number;
    unique_goalies: number;
    unique_sessions?: number;
}

export interface WeeklyData {
    week: string;
    lessons: number;
    total: number;
    unique_goalies?: number;
}

export interface MonthStats {
    lessons: number;
    journals: number;
    total: number;
    goalies: Set<string>;
}

export interface WeekStats {
    total: number;
    lessons: number;
    journals: number;
}
