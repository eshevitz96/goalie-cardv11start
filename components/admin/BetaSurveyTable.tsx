"use client";

import { useState } from 'react';
import { Calendar, User, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export function BetaSurveyTable({ feedback, isLoading }: { feedback: any[], isLoading: boolean }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading survey results...</div>;
    }

    const surveys = feedback.filter(f => f.title === 'BETA_SURVEY_RESPONSE');

    if (!surveys || surveys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <CheckCircle2 className="text-primary" size={32} />
                </div>
                <h3 className="text-lg font-bold">No Survey Responses Yet</h3>
                <p className="text-muted-foreground">Beta feedback submitted via the survey page will appear here.</p>
            </div>
        );
    }

    const parseContent = (content: string) => {
        try {
            return JSON.parse(content);
        } catch (e) {
            return {};
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-primary" />
                    Beta Survey Responses ({surveys.length})
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Key Feedback</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {surveys.map((item) => {
                            const data = parseContent(item.content);
                            const isExpanded = expandedId === item.id;

                            return (
                                <>
                                    <tr key={item.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">
                                                {item.roster?.goalie_name || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.roster?.email || 'No email'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-secondary text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {data.tester_role || item.author_role || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {data.first_impression && (
                                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                    <span className="font-bold">First Impression:</span> {data.first_impression}
                                                </div>
                                            )}
                                            {data.accountability && (
                                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                    <span className="font-bold">Values:</span> {data.accountability}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-muted-foreground hover:text-foreground">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-muted/30">
                                            <td colSpan={5} className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {Object.entries(data).map(([key, value]: [string, any]) => {
                                                        if (key === 'tester_role') return null;
                                                        return (
                                                            <div key={key} className="space-y-1">
                                                                <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{key.replace(/_/g, ' ')}</div>
                                                                <div className="text-sm font-medium text-foreground bg-background border border-border p-3 rounded-lg">
                                                                    {value?.toString()}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
