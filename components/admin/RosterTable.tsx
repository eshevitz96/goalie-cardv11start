'use client';

import { useState } from 'react';
import { Database, Search, Trash2, Pencil, CheckCircle, RefreshCw } from 'lucide-react';
import { RosterItem } from '@/types';
import { supabase } from '@/utils/supabase/client';

interface RosterTableProps {
    dbData: RosterItem[];
    onRefresh: () => Promise<void>;
    onRecalculate: () => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onEdit: (item: RosterItem) => void;
    onAdd: () => void;
}

export function RosterTable({ dbData, onRefresh, onRecalculate, onDelete, onEdit, onAdd }: RosterTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const handleResetDatabase = async () => {
        if (!confirm('EXTREME DANGER: This will delete ALL roster and session data. Are you sure?')) return;
        setIsResetting(true);
        try {
            await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error } = await supabase.from('roster_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            alert("Database Wiped Clean.");
            await onRefresh();
        } catch (e: any) {
            alert("Delete failed: " + e.message);
        } finally {
            setIsResetting(false);
        }
    };

    const filteredData = dbData.filter(i =>
        i.goalie_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="glass rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="text-primary" />
                    Roster Database
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetDatabase}
                        disabled={isResetting}
                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                    >
                        {isResetting ? "Resetting..." : "Reset Database"}
                    </button>
                    <button
                        onClick={onRecalculate}
                        className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg text-sm font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                        title="Sync counts with actual session records"
                    >
                        <RefreshCw size={14} />
                        Recalc
                    </button>
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:scale-105 transition-transform"
                    >
                        + Add
                    </button>
                </div>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    placeholder="Search..."
                    className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="p-4">ID</th>
                            <th className="p-4">Goalie</th>
                            <th className="p-4">Parent Info</th>
                            <th className="p-4">Team</th>
                            <th className="p-4">Data</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((entry, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-mono text-zinc-500">{entry.assigned_unique_id}</td>
                                <td className="p-4">
                                    <div className="font-bold">{entry.goalie_name}</div>
                                    {entry.raw_data?.goalie_email && (
                                        <div className="text-xs text-primary mt-0.5">
                                            Goalie: {entry.raw_data.goalie_email}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium text-foreground">{entry.email}</div>
                                    <div className="text-xs text-muted-foreground">{entry.parent_name}</div>
                                    {entry.parent_phone && <div className="text-xs text-muted-foreground">{entry.parent_phone}</div>}
                                </td>
                                <td className="p-4 text-gray-400">{entry.team} ({entry.grad_year})</td>
                                <td className="p-4">
                                    {Object.keys(entry.raw_data || {}).length > 0 ? (
                                        <div className="group relative cursor-help">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black/90 border border-white/10 rounded text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-pre-wrap">
                                                {JSON.stringify(entry.raw_data, null, 2)}
                                            </div>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${entry.is_claimed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {entry.is_claimed ? 'Active' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                    <button onClick={() => onDelete(entry.id)} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors">
                                        <Trash2 size={16} className="text-gray-400 group-hover:text-red-500" />
                                    </button>
                                    <button onClick={() => onEdit(entry)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <Pencil size={16} className="text-gray-400 hover:text-white" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
