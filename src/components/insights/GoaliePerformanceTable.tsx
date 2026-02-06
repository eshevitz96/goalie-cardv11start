import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GoalieStat } from './types';

interface GoaliePerformanceTableProps {
    data: GoalieStat[];
}

export function GoaliePerformanceTable({ data }: GoaliePerformanceTableProps) {
    return (
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
                            {data.map((g) => (
                                <tr key={g.name} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-bold text-white">{g.name}</td>
                                    <td className="px-4 py-3 text-center text-gray-300">
                                        {typeof g.sessionsStarted === 'number' ? g.sessionsStarted : (g.sessionsStarted as Set<number>).size}
                                    </td>
                                    <td className="px-4 py-3 text-center font-black text-amber-500">{g.totalActivity}</td>
                                    <td className="px-4 py-3 text-center text-white">{g.lessons}</td>
                                    <td className="px-4 py-3 text-center text-blue-300">{g.reflections}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(g.completionRate ?? 0) >= 80 ? 'bg-green-500/20 text-green-400' : (g.completionRate ?? 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {g.completionRate ?? 0}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
