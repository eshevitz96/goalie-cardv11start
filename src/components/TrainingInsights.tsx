"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ArrowLeft, Loader2, TrendingUp, Users, CheckCircle, Clock, BarChart } from 'lucide-react';
import { Button } from "@/components/ui/Button";

// Import Shared Types
import { Session, Reflection, GoalieStat, StatsState, MonthlyData, WeeklyData, RawSession, RawReflection, MonthStats, WeekStats } from './insights/types';
import { MAX_LESSONS_PER_PACKAGE } from "@/constants/app-constants";

// Import Subcomponents
import { MetricCard } from './insights/MetricCard';
import { MonthlyTrendsTable } from './insights/MonthlyTrendsTable';
import { WeeklyTrendsTable } from './insights/WeeklyTrendsTable';
import { GoaliePerformanceTable } from './insights/GoaliePerformanceTable';
import { TopGrinders } from './insights/TopGrinders';

export default function TrainingInsights() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<StatsState | null>(null);
    const [activeView, setActiveView] = useState<'overview' | 'volume' | 'goalies'>('overview');
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [goalieData, setGoalieData] = useState<GoalieStat[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch sessions (Coach Data)
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select(`
                id, date, session_number, lesson_number, roster_id,
                roster:roster_uploads!inner (goalie_name)
            `)
            .order('date', { ascending: true });

        if (sessionError) console.error("Error fetching sessions:", sessionError);

        // Fetch Reflections (User Data - Self-Directed)
        const { data: reflectionData, error: refError } = await supabase
            .from('reflections')
            .select('id, created_at, roster_id, mood, author_role')
            .eq('author_role', 'goalie')
            .order('created_at', { ascending: true });

        if (refError) console.error("Error fetching reflections:", refError);

        const formattedSessions: Session[] = (sessionData || []).map((s: RawSession) => ({
            ...s,
            roster: Array.isArray(s.roster) ? s.roster[0] : s.roster
        }));

        processStats(formattedSessions, (reflectionData as RawReflection[]) || []);
        setLoading(false);
    };

    const processStats = (sessions: Session[], reflections: Reflection[]) => {
        const totalCoachLessons = sessions.length;
        const totalReflections = reflections.length;
        const totalActivity = totalCoachLessons + totalReflections;
        const goalieIds = new Set([...sessions.map(s => s.roster_id), ...reflections.map(r => r.roster_id)]);
        const uniqueGoalies = goalieIds.size;

        const sessionPackages: Record<string, number[]> = {};
        const goalieStats: Record<string, GoalieStat> = {};

        const initGoalie = (name: string, id: string) => {
            if (!goalieStats[name]) {
                goalieStats[name] = {
                    name: name,
                    id: id,
                    lessons: 0,
                    reflections: 0,
                    totalActivity: 0,
                    sessionsStarted: new Set(),
                    completedSessions: 0,
                    firstActivity: new Date().toISOString(),
                    lastActivity: "2020-01-01"
                };
            }
        };

        sessions.forEach(row => {
            const packageKey = `${row.roster_id}-${row.session_number}`;
            if (!sessionPackages[packageKey]) sessionPackages[packageKey] = [];
            sessionPackages[packageKey].push(row.lesson_number);

            const gName = row.roster?.goalie_name || 'Unknown';
            initGoalie(gName, row.roster_id);

            const g = goalieStats[gName];
            g.lessons++;
            g.totalActivity++;
            (g.sessionsStarted as Set<number>).add(row.session_number);
            if (row.date < g.firstActivity) g.firstActivity = row.date;
            if (row.date > g.lastActivity) g.lastActivity = row.date;
        });

        reflections.forEach(row => {
            const matchingSession = sessions.find(s => s.roster_id === row.roster_id);
            const gName = matchingSession && matchingSession.roster ? matchingSession.roster.goalie_name : 'Unknown Goalie';

            initGoalie(gName, row.roster_id);
            const g = goalieStats[gName];
            g.reflections++;
            g.totalActivity++;

            if (row.created_at < g.firstActivity) g.firstActivity = row.created_at;
            if (row.created_at > g.lastActivity) g.lastActivity = row.created_at;
        });

        let completedSessions = 0;
        let partialSessions = 0;

        Object.entries(sessionPackages).forEach(([key, lessons]) => {
            const maxLesson = Math.max(...lessons);
            if (maxLesson >= MAX_LESSONS_PER_PACKAGE) completedSessions++;
            else partialSessions++;
        });

        const goalieTable: GoalieStat[] = Object.values(goalieStats).map((g) => {
            const myPackages = Object.entries(sessionPackages).filter(([k]) => k.startsWith(g.id + "-"));
            const gCompleted = myPackages.filter(([_, l]) => Math.max(...l) >= MAX_LESSONS_PER_PACKAGE).length;
            const gPartial = myPackages.length - gCompleted;

            return {
                ...g,
                sessionsStarted: (g.sessionsStarted as Set<number>).size,
                completed: gCompleted,
                partial: gPartial,
                completionRate: (g.sessionsStarted as Set<number>).size > 0
                    ? Math.round((gCompleted / (g.sessionsStarted as Set<number>).size) * 100)
                    : 0
            };
        }).sort((a, b) => b.totalActivity - a.totalActivity);

        const months: Record<string, MonthStats> = {};
        const processDate = (dateStr: string, type: 'lesson' | 'journal') => {
            if (!dateStr) return;
            const mKey = dateStr.substring(0, 7);
            if (!months[mKey]) months[mKey] = { lessons: 0, journals: 0, total: 0, goalies: new Set<string>() };
            if (type === 'lesson') months[mKey].lessons++;
            if (type === 'journal') months[mKey].journals++;
            months[mKey].total++;
        };

        sessions.forEach(d => {
            processDate(d.date, 'lesson');
            if (d.date && months[d.date.substring(0, 7)]) months[d.date.substring(0, 7)].goalies.add(d.roster_id);
        });

        reflections.forEach(d => {
            const dateStr = d.created_at;
            if (!dateStr) return;
            processDate(dateStr, 'journal');
            if (dateStr && months[dateStr.substring(0, 7)]) months[dateStr.substring(0, 7)].goalies.add(d.roster_id);
        });

        const monthlyTable = Object.entries(months).map(([m, stats]) => ({
            month: m,
            lessons: stats.lessons,
            journals: stats.journals,
            total: stats.total,
            unique_goalies: stats.goalies.size,
        })).sort((a, b) => a.month.localeCompare(b.month));

        const getWeekKey = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${monday.toISOString().split('T')[0]}/${sunday.toISOString().split('T')[0]}`;
        };

        const weeksData: Record<string, WeekStats> = {};
        const processWeek = (dateStr: string) => {
            if (!dateStr) return;
            const weekKey = getWeekKey(new Date(dateStr));
            if (!weeksData[weekKey]) weeksData[weekKey] = { total: 0, lessons: 0, journals: 0 };
            weeksData[weekKey].total++;
        };

        sessions.forEach(d => processWeek(d.date));
        reflections.forEach(d => processWeek(d.created_at));

        const weeklyTable = Object.entries(weeksData).map(([w, stats]) => ({
            week: w,
            lessons: stats.lessons,
            total: stats.total,
        })).sort((a, b) => a.week.localeCompare(b.week));

        const allDates = [...sessions.map(s => s.date), ...reflections.map(r => r.created_at)].sort();
        const dateSpanDays = allDates.length > 1 ? (new Date(allDates[allDates.length - 1]).getTime() - new Date(allDates[0]).getTime()) / (1000 * 3600 * 24) : 1;
        const weeks = dateSpanDays / 7 || 1;
        const avgActivityPerWeek = (totalActivity / weeks).toFixed(1);

        const weeklyActivityArr = Object.values(weeksData).map((w) => w.total).sort((a, b) => a - b);
        const maxActivityWeek = weeklyActivityArr.length > 0 ? Math.max(...weeklyActivityArr) : 0;

        const getPercentile = (arr: number[], p: number) => {
            if (arr.length === 0) return 0;
            const index = Math.ceil(p / 100 * arr.length) - 1;
            return arr[index];
        };
        const p75 = getPercentile(weeklyActivityArr, 75);
        const p90 = getPercentile(weeklyActivityArr, 90);

        const sortedGrinders = Object.values(goalieStats)
            .sort((a, b) => b.totalActivity - a.totalActivity)
            .slice(0, 5)
            .map((g) => ({
                id: g.id,
                name: g.name,
                count: g.totalActivity,
                breakdown: `${g.lessons} Lessons / ${g.reflections} Self`
            }));

        setStats({
            totalLessons: totalCoachLessons,
            totalActivity,
            uniqueGoalies,
            completedSessions,
            partialSessions,
            avgActivityPerWeek,
            maxActivityWeek,
            p75,
            p90,
            topGrinders: sortedGrinders
        });
        setMonthlyData(monthlyTable);
        setWeeklyData(weeklyTable);
        setGoalieData(goalieTable);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HEADER / NAVIGATION */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {activeView !== 'overview' && (
                        <Button
                            variant="ghost"
                            onClick={() => setActiveView('overview')}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg"
                        >
                            <ArrowLeft size={16} /> Back
                        </Button>
                    )}
                    {activeView === 'overview' && <h2 className="text-xl font-bold text-foreground">Training Analytics</h2>}
                    {activeView === 'volume' && <h2 className="text-xl font-bold text-foreground">Volume Analysis</h2>}
                    {activeView === 'goalies' && <h2 className="text-xl font-bold text-foreground">Goalie Performance & Analytics</h2>}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    title="Refresh Data"
                >
                    <Loader2 size={16} className={loading ? "animate-spin" : ""} />
                </Button>
            </div>

            {/* OVERVIEW: Interactive Metric Grid */}
            {activeView === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                    <MetricCard
                        title="Total Activity"
                        value={stats?.totalActivity}
                        sub={`${stats?.totalLessons ?? 0} Coach • ${(stats?.totalActivity ?? 0) - (stats?.totalLessons ?? 0)} Self`}
                        icon={<CheckCircle className="text-green-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Trends"
                    />
                    <MetricCard
                        title="Unique Goalies"
                        value={stats?.uniqueGoalies}
                        icon={<Users className="text-primary" />}
                        onClick={() => setActiveView('goalies')}
                        label="View Goalies"
                    />
                    <MetricCard
                        title="Avg Activity/Week"
                        value={stats?.avgActivityPerWeek}
                        icon={<TrendingUp className="text-purple-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Trends"
                    />
                    <MetricCard
                        title="Completion Rate"
                        value={`${Math.round(((stats?.completedSessions ?? 0) / ((stats?.completedSessions ?? 0) + (stats?.partialSessions ?? 0) || 1)) * 100) || 0}%`}
                        icon={<Clock className="text-orange-400" />}
                        sub={`${stats?.completedSessions ?? 0} Pkgs Completed`}
                        onClick={() => setActiveView('goalies')}
                        label="View Completion"
                    />

                    <MetricCard
                        title="Max Activity/Week"
                        value={stats?.maxActivityWeek}
                        icon={<TrendingUp className="text-rose-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Peak"
                    />
                    <MetricCard
                        title="75th Percentile"
                        value={stats?.p75}
                        sub="Events/Week"
                        icon={<BarChart className="text-yellow-400" />}
                        onClick={() => setActiveView('volume')}
                        label="Analyze"
                    />
                    <MetricCard
                        title="90th Percentile"
                        value={stats?.p90}
                        sub="Events/Week"
                        icon={<BarChart className="text-yellow-400" />}
                        onClick={() => setActiveView('volume')}
                        label="Analyze"
                    />
                </div>
            )}

            {/* VOLUME VIEW */}
            {activeView === 'volume' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <MonthlyTrendsTable data={monthlyData} />
                    <WeeklyTrendsTable data={weeklyData} />
                </div>
            )}

            {/* GOALIES VIEW */}
            {activeView === 'goalies' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <TopGrinders grinders={stats?.topGrinders || []} />
                    <GoaliePerformanceTable data={goalieData} />
                </div>
            )}
        </div>
    );
}
