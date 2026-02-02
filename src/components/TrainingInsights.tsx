"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { ArrowLeft, Loader2, TrendingUp, Users, Calendar, CheckCircle, Clock, BarChart } from 'lucide-react';

// Local UI Components (since @/components/ui/card doesn't exist)
function Card({ className, children }: any) {
    return <div className={`rounded-xl border shadow-sm ${className}`}>{children}</div>;
}
function CardHeader({ className, children }: any) {
    return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}
function CardTitle({ className, children }: any) {
    return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}
function CardContent({ className, children }: any) {
    return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

interface SessionRecord {
    id: string;
    roster_id: string;
    date: string;
    session_number: number;
    lesson_number: number;
    roster: {
        goalie_name: string;
    };
}

export default function TrainingInsights() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [activeView, setActiveView] = useState<'overview' | 'volume' | 'goalies'>('overview');
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [goalieData, setGoalieData] = useState<any[]>([]);

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
                roster:roster_uploads (goalie_name)
            `)
            .order('date', { ascending: true });

        if (sessionError) console.error("Error fetching sessions:", sessionError);

        // Fetch Reflections (User Data - Self-Directed)
        const { data: reflectionData, error: refError } = await supabase
            .from('reflections')
            .select('id, created_at, roster_id, mood, author_role')
            .eq('author_role', 'goalie') // Only count self-logged
            .order('created_at', { ascending: true });

        if (refError) console.error("Error fetching reflections:", refError);

        processStats(sessionData || [], reflectionData || []);
        setLoading(false);
    };

    const processStats = (sessions: any[], reflections: any[]) => {
        // MERGE DATA STREAMS
        // We want to count "Total Activity" = Coach Sessions + User Journals

        // 1. Core Metrics
        const totalCoachLessons = sessions.length;
        const totalReflections = reflections.length;
        const totalActivity = totalCoachLessons + totalReflections;

        // Get Unique Goalies from both sets
        const goalieIds = new Set([...sessions.map(s => s.roster_id), ...reflections.map(r => r.roster_id)]);
        const uniqueGoalies = goalieIds.size;

        // Group by Session Package (GoalieID + Session#) - KEEPING SESSION LOGIC SAME FOR COMPLETION RATES
        const sessionPackages: Record<string, number[]> = {};
        const goalieStats: Record<string, any> = {};

        // Helper to init goalie stats
        const initGoalie = (name: string, id: string) => {
            if (!goalieStats[name]) {
                goalieStats[name] = {
                    name: name,
                    id: id,
                    lessons: 0,
                    reflections: 0,
                    totalActivity: 0, // NEW METRIC
                    sessionsStarted: new Set(),
                    completedSessions: 0,
                    firstActivity: new Date().toISOString(),
                    lastActivity: "2020-01-01" // dummy old date
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
            g.sessionsStarted.add(row.session_number);
            if (row.date < g.firstActivity) g.firstActivity = row.date;
            if (row.date > g.lastActivity) g.lastActivity = row.date;
        });

        // Process Reflections
        reflections.forEach(row => {
            // We need to find the name... inefficient if we don't have a map. 
            // Attempt to find name from sessions sharing roster_id
            const matchingSession = sessions.find(s => s.roster_id === row.roster_id);
            const gName = matchingSession ? matchingSession.roster?.goalie_name : 'Unknown Goalie'; // Fallback if no coach sessions ever

            initGoalie(gName, row.roster_id);
            const g = goalieStats[gName];
            g.reflections++;
            g.totalActivity++;

            // Reflections don't start "Sessions" packages, but they count for activity/recency
            if (row.created_at < g.firstActivity) g.firstActivity = row.created_at;
            if (row.created_at > g.lastActivity) g.lastActivity = row.created_at;
        });

        // Calculate Session Completion (>= 4 lessons)
        let completedSessions = 0;
        let partialSessions = 0;
        // const uniqueSessionsCount = Object.keys(sessionPackages).length; // Only Coach Sessions

        Object.entries(sessionPackages).forEach(([key, lessons]) => {
            const maxLesson = Math.max(...lessons);
            if (maxLesson >= 4) completedSessions++;
            else partialSessions++;
        });

        // Finalize Goalie Table Data
        const goalieTable = Object.values(goalieStats).map((g: any) => {
            // Recalc completion based on THEIR specific packages
            const myPackages = Object.entries(sessionPackages).filter(([k]) => k.startsWith(g.id + "-"));
            const gCompleted = myPackages.filter(([_, l]) => Math.max(...l) >= 4).length;
            const gPartial = myPackages.length - gCompleted;

            return {
                ...g,
                sessionsStarted: g.sessionsStarted.size,
                completed: gCompleted,
                partial: gPartial,
                completionRate: g.sessionsStarted.size > 0 ? Math.round((gCompleted / g.sessionsStarted.size) * 100) : 0
            };
        }).sort((a, b) => b.totalActivity - a.totalActivity); // SORT BY TOTAL ACTIVITY

        // Monthly Breakdown
        const months: Record<string, any> = {};

        const processDate = (dateStr: string, type: 'lesson' | 'journal') => {
            if (!dateStr) return;
            const mKey = dateStr.substring(0, 7); // YYYY-MM
            if (!months[mKey]) months[mKey] = { lessons: 0, journals: 0, total: 0, goalies: new Set() };
            if (type === 'lesson') months[mKey].lessons++;
            if (type === 'journal') months[mKey].journals++;
            months[mKey].total++;
        };

        sessions.forEach(d => {
            processDate(d.date, 'lesson');
            if (d.date && months[d.date.substring(0, 7)]) months[d.date.substring(0, 7)].goalies.add(d.roster_id);
        });

        reflections.forEach(d => {
            const dateStr = d.created_at; // Adjust if timestamp
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

        // Weekly Breakdown (Keeping it simple - Total Activity for now)
        const getWeekKey = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${monday.toISOString().split('T')[0]}/${sunday.toISOString().split('T')[0]}`;
        };

        const weeksData: Record<string, any> = {};

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
            lessons: stats.lessons, // NOTE: this was 0 in loop, need to fix loop or just use total
            total: stats.total,
        })).sort((a, b) => a.week.localeCompare(b.week));

        // Weekly Params (roughly) based on activity range
        const allDates = [...sessions.map(s => s.date), ...reflections.map(r => r.created_at)].sort();
        const dateSpanDays = allDates.length > 1 ? (new Date(allDates[allDates.length - 1]).getTime() - new Date(allDates[0]).getTime()) / (1000 * 3600 * 24) : 1;
        const weeks = dateSpanDays / 7 || 1;
        const avgActivityPerWeek = (totalActivity / weeks).toFixed(1);

        // Advanced Metrics
        const weeklyActivityArr = Object.values(weeksData).map((w: any) => w.total).sort((a, b) => a - b);
        const maxActivityWeek = weeklyActivityArr.length > 0 ? Math.max(...weeklyActivityArr) : 0;

        const getPercentile = (arr: number[], p: number) => {
            if (arr.length === 0) return 0;
            const index = Math.ceil(p / 100 * arr.length) - 1;
            return arr[index];
        };
        const p75 = getPercentile(weeklyActivityArr, 75);
        const p90 = getPercentile(weeklyActivityArr, 90);

        // Aggregate Top Grinders (Volume Leaderboard)
        const sortedGrinders = Object.values(goalieStats)
            .sort((a: any, b: any) => b.totalActivity - a.totalActivity)
            .slice(0, 5)
            .map((g: any) => ({
                id: g.id,
                name: g.name,
                count: g.totalActivity, // Combined
                breakdown: `${g.lessons} Lessons / ${g.reflections} Self`
            }));

        setStats({
            totalLessons: totalCoachLessons,
            totalActivity,
            uniqueGoalies,
            completedSessions,
            partialSessions,
            avgActivityPerWeek, // Renamed
            maxActivityWeek,    // Renamed
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
                        <button
                            onClick={() => setActiveView('overview')}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    {activeView === 'overview' && <h2 className="text-xl font-bold text-foreground">Training Analytics</h2>}
                    {activeView === 'volume' && <h2 className="text-xl font-bold text-foreground">Volume Analysis</h2>}
                    {activeView === 'goalies' && <h2 className="text-xl font-bold text-foreground">Goalie Performance & Analytics</h2>}
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    title="Refresh Data"
                >
                    <Loader2 size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* OVERVIEW: Interactive Metric Grid */}
            {activeView === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Activity"
                        value={stats?.totalActivity}
                        sub={`${stats?.totalLessons} Coach • ${stats?.totalActivity - stats?.totalLessons} Self`}
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
                        value={`${Math.round((stats?.completedSessions / (stats?.completedSessions + stats?.partialSessions || 1)) * 100) || 0}%`}
                        icon={<Clock className="text-orange-400" />}
                        sub={`${stats?.completedSessions} Pkgs Completed`}
                        onClick={() => setActiveView('goalies')}
                        label="View Completion"
                    />

                    {/* Row 2: Weekly Vitals -> Links to Volume */}
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
                    {/* Monthly Trend Table */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar size={18} /> Monthly Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Month</th>
                                            <th className="px-4 py-3">Lessons</th>
                                            <th className="px-4 py-3">Unique Goalies</th>
                                            <th className="px-4 py-3 rounded-tr-lg">New Sessions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {monthlyData.map((row) => (
                                            <tr key={row.month} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{row.month}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.lessons}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.unique_goalies}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.unique_sessions}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Trend Table */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar size={18} /> Weekly Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Week</th>
                                            <th className="px-4 py-3">Lessons</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Unique Goalies</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {weeklyData.map((row) => (
                                            <tr key={row.week} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">{row.week}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.lessons}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.unique_goalies}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* GOALIES VIEW */}
            {activeView === 'goalies' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Top Grinders Panel */}
                    <div className="glass p-6 rounded-2xl backdrop-blur-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="text-primary">★</span> Top Grinders (All-Time Leaders)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats?.topGrinders?.map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-foreground">{g.name}</div>
                                            <div className="text-xs text-muted-foreground">Rank #{i + 1}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-amber-500">{g.count}</div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold">Sessions</div>
                                    </div>
                                </div>
                            )) || <p className="text-gray-500 text-sm">No data yet.</p>}
                        </div>
                    </div>

                    {/* Goalie Performance Table */}
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users size={18} /> Goalie Performance Matrix
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-4 py-3">Goalie</th>
                                            <th className="px-4 py-3 text-center">Sessions Started</th>
                                            <th className="px-4 py-3 text-center">Total Activity</th>
                                            <th className="px-4 py-3 text-center">Coach Lessons</th>
                                            <th className="px-4 py-3 text-center">Self-Directed</th>
                                            <th className="px-4 py-3 text-right">Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {goalieData.map((g) => (
                                            <tr key={g.name} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-white">{g.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-300">{g.sessionsStarted}</td>
                                                <td className="px-4 py-3 text-center font-black text-amber-500">{g.totalActivity}</td>
                                                <td className="px-4 py-3 text-center text-white">{g.lessons}</td>
                                                <td className="px-4 py-3 text-center text-blue-300">{g.reflections}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${g.completionRate >= 80 ? 'bg-green-500/20 text-green-400' : g.completionRate >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {g.completionRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}

function MetricCard({ title, value, icon, sub, onClick, label }: any) {
    return (
        <div onClick={onClick} className={`cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
            <Card className="glass h-full border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
                            <h3 className="text-2xl font-bold text-foreground mt-2 mb-1">{value}</h3>
                            {sub && <p className="text-xs text-gray-500">{sub}</p>}
                            {label && (
                                <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    {label} <ArrowLeft className="rotate-180" size={10} />
                                </p>
                            )}
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors shadow-inner">{icon}</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
