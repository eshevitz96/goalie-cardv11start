import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MonthlyData } from './types';

interface MonthlyTrendsTableProps {
    data: MonthlyData[];
}

export function MonthlyTrendsTable({ data }: MonthlyTrendsTableProps) {
    return (
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
                            {data.map((row) => (
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
    );
}
