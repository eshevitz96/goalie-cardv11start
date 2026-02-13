import { SupabaseClient } from '@supabase/supabase-js';

export interface SessionRecord {
    id: string;
    date: string;
    session_number: number;
    lesson_number: number;
    roster_id: string;
    roster?: {
        goalie_name: string;
    };
}

export interface ReflectionRecord {
    id: string;
    created_at: string;
    roster_id: string;
    mood: string;
    author_role: string;
}

export interface TopGrinder {
    id: string;
    name: string;
    count: number;
    breakdown: string;
}

export interface MonthlyStat {
    month: string;
    lessons: number;
    journals: number;
    total: number;
    unique_goalies: number;
    unique_sessions?: number;
}

export interface WeeklyStat {
    week: string;
    lessons: number;
    total: number;
    unique_goalies?: number;
}

export interface GoaliePerformanceStat {
    id: string;
    name: string;
    sessionsStarted: number;
    totalActivity: number;
    lessons: number;
    reflections: number;
    completed: number;
    partial: number;
    completionRate: number;
    firstActivity?: string;
    lastActivity?: string;
}

export interface AnalyticsStats {
    totalLessons: number;
    totalActivity: number;
    uniqueGoalies: number;
    completedSessions: number;
    partialSessions: number;
    avgActivityPerWeek: string;
    maxActivityWeek: number;
    p75: number;
    p90: number;
    topGrinders: TopGrinder[];
    monthlyData: MonthlyStat[];
    weeklyData: WeeklyStat[];
    goalieData: GoaliePerformanceStat[];
}

export const AnalyticsService = {
    async fetchRawData(supabase: SupabaseClient) {
        // Fetch sessions (Coach Data)
        const { data: sessions, error: sessionError } = await supabase
            .from('sessions')
            .select(`
                id, date, session_number, lesson_number, roster_id,
                roster:roster_uploads (goalie_name)
            `)
            .order('date', { ascending: true });

        if (sessionError) throw sessionError;

        // Fetch Reflections (User Data - Self-Directed)
        const { data: reflections, error: refError } = await supabase
            .from('reflections')
            .select('id, created_at, roster_id, mood, author_role')
            .eq('author_role', 'goalie')
            .order('created_at', { ascending: true });

        if (refError) throw refError;

        return {
            sessions: (sessions || []) as unknown as SessionRecord[],
            reflections: (reflections || []) as ReflectionRecord[]
        };
    },

    processStats(sessions: SessionRecord[], reflections: ReflectionRecord[]): AnalyticsStats {
        // 1. Core Metrics
        const totalCoachLessons = sessions.length;
        const totalReflections = reflections.length;
        const totalActivity = totalCoachLessons + totalReflections;

        // Unique Goalies
        const goalieIds = new Set([...sessions.map(s => s.roster_id), ...reflections.map(r => r.roster_id)]);
        const uniqueGoalies = goalieIds.size;

        // Group by Session Package
        const sessionPackages: Record<string, number[]> = {};
        // Temporary holding object for aggregation
        type TempGoalieStat = GoaliePerformanceStat & { sessionsStartedSet: Set<number> };
        const goalieStats: Record<string, TempGoalieStat> = {};

        const initGoalie = (name: string, id: string) => {
            if (!goalieStats[name]) {
                goalieStats[name] = {
                    name: name,
                    id: id,
                    lessons: 0,
                    reflections: 0,
                    totalActivity: 0,
                    sessionsStarted: 0, // Will update size at end
                    sessionsStartedSet: new Set<number>(),
                    completed: 0,
                    partial: 0,
                    completionRate: 0,
                    firstActivity: new Date().toISOString(),
                    lastActivity: "2020-01-01"
                };
            }
        };

        // Process Sessions
        sessions.forEach(row => {
            const packageKey = `${row.roster_id}-${row.session_number}`;
            if (!sessionPackages[packageKey]) sessionPackages[packageKey] = [];
            sessionPackages[packageKey].push(row.lesson_number);

            const gName = row.roster?.goalie_name || 'Unknown';
            initGoalie(gName, row.roster_id);

            const g = goalieStats[gName];
            g.lessons++;
            g.totalActivity++;
            g.sessionsStartedSet.add(row.session_number);
            if (row.date && g.firstActivity && row.date < g.firstActivity) g.firstActivity = row.date;
            if (row.date && g.lastActivity && row.date > g.lastActivity) g.lastActivity = row.date;
        });

        // Process Reflections
        reflections.forEach(row => {
            const matchingSession = sessions.find(s => s.roster_id === row.roster_id);
            const gName = matchingSession ? matchingSession.roster?.goalie_name || 'Unknown' : 'Unknown Goalie';

            initGoalie(gName, row.roster_id);
            const g = goalieStats[gName];
            g.reflections++;
            g.totalActivity++;
            if (row.created_at && g.firstActivity && row.created_at < g.firstActivity) g.firstActivity = row.created_at;
            if (row.created_at && g.lastActivity && row.created_at > g.lastActivity) g.lastActivity = row.created_at;
        });

        // Calculate Completion
        let completedSessions = 0;
        let partialSessions = 0;
        Object.entries(sessionPackages).forEach(([_, lessons]) => {
            if (Math.max(...lessons) >= 4) completedSessions++;
            else partialSessions++;
        });

        // Goalie Table Data
        const goalieData: GoaliePerformanceStat[] = Object.values(goalieStats).map((g) => {
            const myPackages = Object.entries(sessionPackages).filter(([k]) => k.startsWith(g.id + "-"));
            const gCompleted = myPackages.filter(([_, l]) => Math.max(...l) >= 4).length;
            const gPartial = myPackages.length - gCompleted;

            const startedCount = g.sessionsStartedSet.size;

            // Return clean object without the Set
            return {
                id: g.id,
                name: g.name,
                lessons: g.lessons,
                reflections: g.reflections,
                totalActivity: g.totalActivity,
                sessionsStarted: startedCount,
                completed: gCompleted,
                partial: gPartial,
                completionRate: startedCount > 0 ? Math.round((gCompleted / startedCount) * 100) : 0,
                firstActivity: g.firstActivity,
                lastActivity: g.lastActivity
            };
        }).sort((a, b) => b.totalActivity - a.totalActivity);

        // Monthly Breakdown
        const months: Record<string, any> = {};
        const processDate = (dateStr: string, type: 'lesson' | 'journal', goalieId: string) => {
            if (!dateStr) return;
            const mKey = dateStr.substring(0, 7);

            // Type safety for record values
            type MonthData = { lessons: number; journals: number; total: number; goalies: Set<string> };
            const mData = months[mKey] as MonthData | undefined;

            if (!mData) {
                months[mKey] = { lessons: 0, journals: 0, total: 0, goalies: new Set() };
            }

            const current = months[mKey];
            if (type === 'lesson') current.lessons++;
            if (type === 'journal') current.journals++;
            current.total++;
            current.goalies.add(goalieId);
        };

        sessions.forEach(d => processDate(d.date, 'lesson', d.roster_id));
        reflections.forEach(d => processDate(d.created_at, 'journal', d.roster_id));

        const monthlyData: MonthlyStat[] = Object.entries(months).map(([m, stats]) => ({
            month: m,
            lessons: stats.lessons,
            journals: stats.journals,
            total: stats.total,
            unique_goalies: stats.goalies.size
        })).sort((a, b) => a.month.localeCompare(b.month));

        // Weekly Breakdown
        const weeksData: Record<string, any> = {};
        const getWeekKey = (dateStr: string) => {
            const d = new Date(dateStr);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${monday.toISOString().split('T')[0]}/${sunday.toISOString().split('T')[0]}`;
        };

        const processWeek = (dateStr: string, type: 'lesson' | 'journal', goalieId: string) => {
            if (!dateStr) return;
            const wKey = getWeekKey(dateStr);
            if (!weeksData[wKey]) weeksData[wKey] = { lessons: 0, total: 0, goalies: new Set() };
            const current = weeksData[wKey];
            if (type === 'lesson') current.lessons++;
            current.total++;
            current.goalies.add(goalieId);
        };

        sessions.forEach(d => processWeek(d.date, 'lesson', d.roster_id));
        reflections.forEach(d => processWeek(d.created_at, 'journal', d.roster_id));

        const weeklyData: WeeklyStat[] = Object.entries(weeksData).map(([w, stats]) => ({
            week: w,
            lessons: stats.lessons,
            total: stats.total,
            unique_goalies: stats.goalies.size
        })).sort((a, b) => a.week.localeCompare(b.week));

        // Advanced Metrics
        const allDates = [...sessions.map(s => s.date), ...reflections.map(r => r.created_at)].sort();
        const dateSpanDays = allDates.length > 1 ? (new Date(allDates[allDates.length - 1]).getTime() - new Date(allDates[0]).getTime()) / (1000 * 3600 * 24) : 1;
        const weeksCount = dateSpanDays / 7 || 1;

        const weeklyActivityArr = Object.values(weeksData).map((w: any) => w.total).sort((a, b) => a - b);

        const getPercentile = (arr: number[], p: number) => {
            if (arr.length === 0) return 0;
            const index = Math.ceil(p / 100 * arr.length) - 1;
            return arr[index];
        };

        return {
            totalLessons: totalCoachLessons,
            totalActivity,
            uniqueGoalies,
            completedSessions,
            partialSessions,
            avgActivityPerWeek: (totalActivity / weeksCount).toFixed(1),
            maxActivityWeek: weeklyActivityArr.length > 0 ? Math.max(...weeklyActivityArr) : 0,
            p75: getPercentile(weeklyActivityArr, 75),
            p90: getPercentile(weeklyActivityArr, 90),
            topGrinders: goalieData.slice(0, 5).map(g => ({
                id: g.id,
                name: g.name,
                count: g.totalActivity,
                breakdown: `${g.lessons} Lessons / ${g.reflections} Self`
            })),
            monthlyData,
            weeklyData,
            goalieData
        };
    }
};
