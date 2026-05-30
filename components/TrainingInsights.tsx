"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import {
    ArrowLeft, Loader2, TrendingUp, Users, Calendar,
    CheckCircle, Clock, BarChart
} from 'lucide-react';

// New Imports
import { AnalyticsService, AnalyticsStats, MonthlyStat, WeeklyStat, TopGrinder, GoaliePerformanceStat } from '@/services/analytics';
import { StatCard } from '@/components/insights/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function TrainingInsights() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [activeView, setActiveView] = useState<'overview' | 'volume' | 'goalies'>('overview');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const { sessions, reflections } = await AnalyticsService.fetchRawData(supabase);
                const processed = AnalyticsService.processStats(sessions, reflections);
                setStats(processed);
            } catch (err: any) {
                console.error("Analytics Error:", err);
                setError("Failed to load analytics data.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

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
                    <h2 className="text-xl font-bold text-foreground">
                        {activeView === 'overview' && "Training Analytics"}
                        {activeView === 'volume' && "Volume Analysis"}
                        {activeView === 'goalies' && "Goalie Performance"}
                    </h2>
                </div>
            </div>

            {/* OVERVIEW */}
            {activeView === 'overview' && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <StatCard
                        title="Total Activity"
                        value={stats.totalActivity}
                        sub={`${stats.totalLessons} Coach • ${stats.totalActivity - stats.totalLessons} Self`}
                        icon={<CheckCircle className="text-green-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Trends"
                    />
                    <StatCard
                        title="Unique Goalies"
                        value={stats.uniqueGoalies}
                        icon={<Users className="text-primary" />}
                        onClick={() => setActiveView('goalies')}
                        label="View Goalies"
                    />
                    <StatCard
                        title="Avg Activity/Week"
                        value={stats.avgActivityPerWeek}
                        icon={<TrendingUp className="text-purple-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Trends"
                    />
                    <StatCard
                        title="Completion Rate"
                        value={`${Math.round((stats.completedSessions / (stats.completedSessions + stats.partialSessions || 1)) * 100) || 0}%`}
                        icon={<Clock className="text-orange-400" />}
                        sub={`${stats.completedSessions} Pkgs Completed`}
                        onClick={() => setActiveView('goalies')}
                        label="View Completion"
                    />

                    {/* Row 2 */}
                    <StatCard
                        title="Max Activity/Week"
                        value={stats.maxActivityWeek}
                        icon={<TrendingUp className="text-rose-400" />}
                        onClick={() => setActiveView('volume')}
                        label="View Peak"
                    />
                    <StatCard
                        title="75th Percentile"
                        value={stats.p75}
                        sub="Events/Week"
                        icon={<BarChart className="text-yellow-400" />}
                        onClick={() => setActiveView('volume')}
                        label="Analyze"
                    />
                    <StatCard
                        title="90th Percentile"
                        value={stats.p90}
                        sub="Events/Week"
                        icon={<BarChart className="text-yellow-400" />}
                        onClick={() => setActiveView('volume')}
                        label="Analyze"
                    />
                </div>
            )}

            {/* VOLUME VIEW */}
            {activeView === 'volume' && stats && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Monthly Trend Table */}
                    <Card className="glass border-border/50">
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
                                            <th className="px-4 py-3">Journals</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Unique Goalies</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {stats.monthlyData.map((row: MonthlyStat) => (
                                            <tr key={row.month} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{row.month}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.lessons}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.journals}</td>
                                                <td className="px-4 py-3 font-bold text-foreground">{row.total}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.unique_goalies}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Trend Table */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar size={18} /> Weekly Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Week</th>
                                            <th className="px-4 py-3">Lessons</th>
                                            <th className="px-4 py-3">Total Activity</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Unique Goalies</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {stats.weeklyData.map((row: WeeklyStat) => (
                                            <tr key={row.week} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 font-medium text-foreground">{row.week}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.lessons}</td>
                                                <td className="px-4 py-3 font-bold text-foreground">{row.total}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.unique_goalies}</td>
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
            {activeView === 'goalies' && stats && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                    {/* Top Grinders Panel */}
                    <div className="glass p-6 rounded-2xl border border-border/50">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="text-primary">★</span> Top Grinders (All-Time Leaders)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.topGrinders.map((g: TopGrinder, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
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
                                        <div className="text-[10px] uppercase text-muted-foreground font-bold">Sessions</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Goalie Performance Table */}
                    <Card className="glass border-border/50">
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
                                    <tbody className="divide-y divide-border/20">
                                        {stats.goalieData.map((g: GoaliePerformanceStat) => (
                                            <tr key={g.name} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3 font-bold text-foreground">{g.name}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground">{g.sessionsStarted}</td>
                                                <td className="px-4 py-3 text-center font-black text-amber-500">{g.totalActivity}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground">{g.lessons}</td>
                                                <td className="px-4 py-3 text-center text-blue-400">{g.reflections}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${g.completionRate >= 80 ? 'bg-green-500/10 text-green-500' : g.completionRate >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
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
