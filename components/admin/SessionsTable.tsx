import { FileSpreadsheet, Trash2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface SessionsTableProps {
    sessions: any[];
    setSessions: (updater: (prev: any[]) => any[]) => void;
}

export function SessionsTable({ sessions, setSessions }: SessionsTableProps) {
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
                        {sessions.map((session, i) => {
                            const rawDate = session.start_time || session.date;
                            let dateDisplay = "Scheduled";
                            let timeDisplay = "TBD";

                            if (rawDate) {
                                const [datePart, timeWithOffset] = rawDate.split("T");
                                if (datePart) {
                                    const [y, m, d] = datePart.split("-").map(Number);
                                    dateDisplay = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                }
                                const notesTimeMatch = session.notes ? session.notes.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)(?:\s*–\s*\d{1,2}:\d{2}\s*(?:AM|PM))?)/i) : null;
                                if (notesTimeMatch && notesTimeMatch[1]) {
                                    timeDisplay = notesTimeMatch[1];
                                } else if (timeWithOffset) {
                                    const [hStr, mStr] = timeWithOffset.split(":");
                                    let h = parseInt(hStr, 10);
                                    const min = parseInt(mStr, 10);
                                    if (!isNaN(h) && !isNaN(min)) {
                                        const isPM = h >= 12;
                                        let displayHour = h % 12;
                                        if (displayHour === 0) displayHour = 12;
                                        const padM = String(min).padStart(2, "0");
                                        timeDisplay = `${displayHour}:${padM} ${isPM ? "PM" : "AM"}`;
                                    }
                                }
                            }

                            return (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4 font-mono text-zinc-400">
                                        {dateDisplay}
                                        <div className="text-xs text-zinc-600">{timeDisplay}</div>
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
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this session?")) return;
                                            const { error } = await supabase.from('sessions').delete().eq('id', session.id);
                                            if (error) alert("Error deleting session: " + error.message);
                                            else {
                                                // Optimistic update
                                                setSessions(prev => prev.filter(s => s.id !== session.id));
                                            }
                                        }}
                                        className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-colors"
                                        title="Delete Session"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
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
