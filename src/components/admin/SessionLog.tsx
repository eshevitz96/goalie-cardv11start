import React, { useState } from 'react';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SessionLogProps {
    sessions: any[];
    onDelete: (id: string) => void;
}

export function SessionLog({ sessions, onDelete }: SessionLogProps) {
    return (
        <div className="glass rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileSpreadsheet className="text-primary" />
                    Coaching Events Master Log
                </h2>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{sessions.length} Records</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="p-4">Date</th>
                            <th className="p-4">Goalie / ID</th>
                            <th className="p-4">Session Details</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Notes</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-mono text-zinc-400">
                                    {new Date(session.date).toLocaleDateString()}
                                    <div className="text-xs text-zinc-600">{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{session.roster?.goalie_name || "Unknown"}</div>
                                    <div className="text-xs text-primary font-mono">{session.roster?.assigned_unique_id}</div>
                                    <div className="text-xs text-zinc-500">{session.roster?.team}</div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                        <span className="text-xs font-bold text-gray-400">S{session.session_number}</span>
                                        <span className="text-zinc-600">|</span>
                                        <span className="text-xs font-bold text-white">Lesson {session.lesson_number}</span>
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">{session.location}</td>
                                <td className="p-4 text-gray-500 max-w-md truncate">{session.notes}</td>
                                <td className="p-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this session?")) {
                                                onDelete(session.id);
                                            }
                                        }}
                                        className="hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors h-8 w-8"
                                        title="Delete Session"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sessions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        No sessions found. Upload a CSV or log sessions manually.
                    </div>
                )}
            </div>
        </div>
    );
}
