import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { WeeklyData } from './types';

interface WeeklyTrendsTableProps {
    data: WeeklyData[];
}

export function WeeklyTrendsTable({ data }: WeeklyTrendsTableProps) {
    return (
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
                            {data.map((row) => (
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
    );
}
