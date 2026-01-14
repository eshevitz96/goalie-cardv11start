"use client";

import { motion } from "framer-motion";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    Search,
    Users,
    Shield,
    Download,
    Trash2,
    RefreshCw,
    Loader2,
    AlertCircle,
    DollarSign
} from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { supabase } from "@/utils/supabase/client";

// Type for the DB data
type RosterItem = {
    id: number;
    goalie_name: string;
    email: string; // parent email
    grad_year: number;
    team: string;
    parent_name: string;
    parent_phone: string;
    assigned_unique_id: string;
    is_claimed: boolean;
    created_at: string;
    // New Payment Fields (might be null if old record)
    payment_status?: string;
    amount_paid?: number;
};

export default function AdminDashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [dbData, setDbData] = useState<RosterItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch Real Data on Mount
    useEffect(() => {
        fetchRoster();
    }, []);

    const fetchRoster = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('roster_uploads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDbData(data || []);
        } catch (e: any) {
            console.error("Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearDatabase = async () => {
        if (!confirm("ARE YOU SURE? This will delete ALL goalie records (`roster_uploads`). This action cannot be undone.")) return;

        try {
            setIsLoading(true);
            const { error } = await supabase.from('roster_uploads').delete().neq('id', 0); // Delete all
            if (error) throw error;
            await fetchRoster();
            alert("Database Cleared.");
        } catch (e: any) {
            console.error(e);
            alert("Failed to delete. Check RLS policies (SQL). " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRow = async (id: number) => {
        if (!confirm("Delete this record?")) return;
        try {
            const { error } = await supabase.from('roster_uploads').delete().eq('id', id);
            if (error) throw error;
            await fetchRoster();
        } catch (e: any) {
            alert("Delete failed: " + e.message);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            const text = await file.text();
            await parseAndUpload(text);
        }
    };

    // --- SMART PARSER ---
    const parseAndUpload = async (text: string) => {
        setUploadStatus("uploading");
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        if (lines.length < 1) {
            alert("Empty File");
            setUploadStatus("error");
            return;
        }

        // 1. Identify Header Row (Look for "Email" and "Name/First" with limit)
        let headerRowIndex = 0;
        let foundHeader = false;

        // Scan first 25 lines to find the header
        for (let i = 0; i < Math.min(lines.length, 25); i++) {
            const rowLower = lines[i].toLowerCase();
            // A valid header row usually has "Email" AND some form of Name
            // Expanded criteria to be more robust
            if (rowLower.includes('email') && (rowLower.includes('name') || rowLower.includes('first') || rowLower.includes('goalie'))) {
                headerRowIndex = i;
                foundHeader = true;
                break;
            }
        }

        if (!foundHeader) {
            console.warn("Could not auto-detect header row. Defaulting to row 0. Result may be garbage.");
        }

        const potentialHeaders = lines[headerRowIndex].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.toLowerCase().replace(/['"]+/g, '').trim());

        // Map Columns dyanmically
        const map = {
            email: potentialHeaders.findIndex(h => h.includes('email')),
            firstName: potentialHeaders.findIndex(h => h.includes('first') && h.includes('name')),
            lastName: potentialHeaders.findIndex(h => h.includes('last') && h.includes('name')),
            fullName: potentialHeaders.findIndex(h => h === 'name' || h === 'goalie name' || h === 'player name'),
            gradYear: potentialHeaders.findIndex(h => h.includes('grad') || h.includes('year') || h.includes('class')),
            team: potentialHeaders.findIndex(h => h.includes('team') || h.includes('club')),
            parentName: potentialHeaders.findIndex(h => (h.includes('parent') || h.includes('guardian')) && h.includes('name')),
            phone: potentialHeaders.findIndex(h => h.includes('phone') || h.includes('cell'))
        };

        console.log("Detected Columns:", map, "at Row:", headerRowIndex);

        const payload = lines.slice(headerRowIndex + 1).map((line, idx) => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());

            // Helpers
            const getVal = (idx: number) => (idx > -1 && values[idx]) ? values[idx] : "";

            // Logic
            let goalieName = "Unknown";
            if (map.firstName > -1 && map.lastName > -1) {
                goalieName = `${getVal(map.firstName)} ${getVal(map.lastName)}`;
            } else if (map.fullName > -1) {
                goalieName = getVal(map.fullName);
            } else {
                // Fallback: Try index 0 and 1 if standard
                goalieName = (values[0] && values[1]) ? `${values[0]} ${values[1]}` : (values[0] || "Unknown");
            }

            // Email Logic: Try mapped, then try scanning for "@"
            let email = getVal(map.email);
            if (!email || !email.includes('@')) {
                email = values.find(v => v.includes('@') && v.includes('.')) || "";
            }
            if (!email) email = `missing-email-${idx}-${Date.now()}@example.com`;

            // Grad Year
            let gradYear = getVal(map.gradYear);
            if (!gradYear) gradYear = values.find(v => v.match(/^20[2-3][0-9]$/)) || "2030";

            // Team
            let team = getVal(map.team) || "Unassigned";

            // ID Generation
            const uniqueId = `GC-${8000 + dbData.length + idx + Math.floor(Math.random() * 99)}`;

            return {
                email: email,
                goalie_name: goalieName,
                parent_name: getVal(map.parentName) || "Unknown Parent",
                parent_phone: getVal(map.phone),
                grad_year: parseInt(gradYear) || 2030,
                team: team,
                assigned_unique_id: uniqueId,
                is_claimed: false,
                payment_status: 'pending',
                amount_paid: 0
            };
        });

        // 2. Perform Supabase Insert
        const { error } = await supabase.from('roster_uploads').insert(payload);

        if (error) {
            console.error(error);
            setUploadStatus("error");
            alert("Upload failed: " + error.message + "\n\nTip: You need to add 'payment_status' column to DB.");
        } else {
            setUploadStatus("success");
            await fetchRoster();
        }
    };

    // Filter Logic
    const filteredData = dbData.filter(item =>
        item.goalie_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assigned_unique_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingCount = dbData.filter(i => !i.is_claimed).length;

    // Revenue Calc
    const totalRevenue = dbData.reduce((acc, item) => acc + (Number(item.amount_paid) || 0), 0);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">System Administration</h2>
                    <h1 className="text-3xl font-black italic tracking-tighter">
                        ADMIN<span className="text-primary">CONSOLE</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Revenue</span>
                        <span className="text-lg font-mono font-bold text-emerald-500">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
                    <button
                        onClick={fetchRoster}
                        className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={16} className={clsx(isLoading && "animate-spin")} />
                    </button>
                    <button className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 transition-colors">
                        <span className="font-bold text-xs">AD</span>
                    </button>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Migration Tools */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Migration Zone */}
                    <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        <FileSpreadsheet className="text-emerald-500" />
                                        Smart Import
                                    </h2>
                                    <p className="text-zinc-400 text-sm max-w-md">
                                        Drop any CSV. We'll auto-detect Email, Name, Year, and Team.
                                    </p>
                                </div>
                            </div>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={clsx(
                                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 group cursor-pointer",
                                    isDragging
                                        ? "border-primary bg-primary/10 scale-[1.01]"
                                        : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 bg-zinc-900"
                                )}
                            >
                                {uploadStatus === "success" ? (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-emerald-500"
                                    >
                                        <CheckCircle2 size={48} className="mb-2 mx-auto" />
                                        <div className="font-bold text-lg text-white">Import Successful</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setUploadStatus("idle"); }}
                                            className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold text-white hover:bg-zinc-700"
                                        >
                                            Process Another File
                                        </button>
                                    </motion.div>
                                ) : uploadStatus === "uploading" ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <Loader2 size={48} className="text-primary mb-2 animate-spin" />
                                        <div className="font-bold text-zinc-300">Parsing & Uploading...</div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                            <Upload size={24} className="text-zinc-400 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-white">Drag & Drop CSV</div>
                                            <div className="text-sm text-zinc-500 mt-1">Auto-mapping enabled</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Master Database View */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="text-zinc-400" />
                                Database Records
                                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700">{dbData.length}</span>
                            </h3>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleClearDatabase}
                                    className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Reset Roster
                                </button>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary w-48"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold tracking-wider border-b border-zinc-800">
                                    <tr>
                                        <th className="p-4 pl-6">Goalie</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Payment</th>{/* New Column */}
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin mx-auto mb-2" /> Loading Records...</td></tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No records found. Upload a CSV to get started.</td></tr>
                                    ) : (
                                        filteredData.map((entry) => (
                                            <tr key={entry.id} className="group hover:bg-zinc-800/20 transition-colors">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-white text-sm">{entry.goalie_name}</div>
                                                    <div className="text-xs text-zinc-500">{entry.grad_year} • {entry.team?.slice(0, 15)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-xs text-zinc-300">
                                                        {entry.email}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-xs font-bold text-accent tracking-wider">
                                                        {entry.assigned_unique_id}
                                                    </div>
                                                </td>

                                                {/* Payment Column */}
                                                <td className="p-4">
                                                    {entry.payment_status === 'paid' ? (
                                                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                                            <DollarSign size={12} /> {entry.amount_paid}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="p-4">
                                                    {entry.is_claimed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wide">
                                                            Joined
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase tracking-wide">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteRow(entry.id)}
                                                        className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded text-zinc-600 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column: System Status */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-primary" />
                            System Health
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                <span className="text-xs text-zinc-400">Total Goalies</span>
                                <span className="text-lg font-bold text-white">{dbData.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                <span className="text-xs text-zinc-400">Pending Activation</span>
                                <span className="text-lg font-bold text-amber-500">{pendingCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                <span className="text-xs text-zinc-400">Total Revenue</span>
                                <span className="text-lg font-bold text-emerald-500">${totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary/20 to-zinc-900 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users size={100} />
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-primary">Pre-Validation Flow</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                            When you migrate a roster, the system generates unique IDs. Parents claim these IDs via the Activation Portal.
                        </p>
                    </div>
                </div>

            </div>
        </main>
    );
}
