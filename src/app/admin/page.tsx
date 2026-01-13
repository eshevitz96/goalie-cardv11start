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
    AlertCircle,
    ArrowRight
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";

// Mock Data for "Master Book of Goalies"
const MASTER_ROSTER = [
    { id: "GC-8821", name: "Leo Vance", email: "leovance@gmail.com", yob: 2008, status: "active", team: "U16 AAA Jr. Kings" },
    { id: "GC-9932", name: "Jamie Ross", email: "mike.ross@email.com", yob: 2010, status: "pending", team: "U14 AA Ducks" },
    { id: "GC-1102", name: "Tyler Smith", email: "sarah.smith@email.com", yob: 2012, status: "pending", team: "U12 A Kings" },
    { id: "GC-4421", name: "Jordan Lee", email: "jlee@email.com", yob: 2009, status: "active", team: "U15 AAA Elite" },
];

export default function AdminDashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success">("idle");

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setUploadStatus("uploading");
        // Simulate upload
        setTimeout(() => setUploadStatus("success"), 1500);
    };

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
                    <span className="text-xs text-zinc-500 font-mono">v11.0.4-beta</span>
                    <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
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
                                        Roster Migration
                                    </h2>
                                    <p className="text-zinc-400 text-sm max-w-md">
                                        Upload your "Master Book" CSV to automatically generate Activation IDs.
                                        Parents will claim these profiles using their matching email address.
                                    </p>
                                </div>
                                <button className="text-xs font-bold text-zinc-500 flex items-center gap-1 hover:text-white transition-colors">
                                    <Download size={14} /> Download Template
                                </button>
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
                                        <div className="font-bold text-lg text-white">Migration Complete</div>
                                        <div className="text-sm text-zinc-400">24 new profiles generated and ready for activation.</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setUploadStatus("idle"); }}
                                            className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold text-white hover:bg-zinc-700"
                                        >
                                            Upload Another
                                        </button>
                                    </motion.div>
                                ) : uploadStatus === "uploading" ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <Upload size={48} className="text-primary mb-2 opacity-50" />
                                        <div className="font-bold text-zinc-300">Processing Roster...</div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                            <Upload size={24} className="text-zinc-400 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-white">Drag & Drop Master CSV</div>
                                            <div className="text-sm text-zinc-500 mt-1">or click to browse local files</div>
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
                                Master Database
                                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full border border-zinc-700">All Goalies</span>
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search by email, ID, or name..."
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary w-64"
                                />
                            </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 font-semibold tracking-wider border-b border-zinc-800">
                                    <tr>
                                        <th className="p-4 pl-6">Goalie Profile</th>
                                        <th className="p-4">Parent Email (Key)</th>
                                        <th className="p-4">Unique ID</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {MASTER_ROSTER.map((entry) => (
                                        <tr key={entry.id} className="group hover:bg-zinc-800/20 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-white text-sm">{entry.name}</div>
                                                <div className="text-xs text-zinc-500">{entry.yob} • {entry.team}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-xs text-zinc-300 bg-zinc-950/50 px-2 py-1 rounded w-fit border border-zinc-800/50 group-hover:border-zinc-700">
                                                    {entry.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-xs font-bold text-accent tracking-wider">
                                                    {entry.id}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {entry.status === 'active' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wide">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase tracking-wide animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Waiting for Parent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right text-zinc-500 hover:text-white cursor-pointer">
                                                ...
                                            </td>
                                        </tr>
                                    ))}
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
                                <span className="text-lg font-bold text-white">1,248</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                <span className="text-xs text-zinc-400">Pending Activation</span>
                                <span className="text-lg font-bold text-amber-500">42</span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <div className="text-xs font-bold text-zinc-500 mb-2 uppercase">Recent Activity</div>
                                <div className="space-y-3">
                                    <div className="flex gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                        <div className="text-zinc-400">
                                            <span className="text-white font-bold">New Roster Import</span> via Manager
                                            <div className="text-zinc-600 mt-0.5">2 mins ago</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        <div className="text-zinc-400">
                                            <span className="text-white font-bold">Leo Vance</span> activated profile
                                            <div className="text-zinc-600 mt-0.5">1 hour ago</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How it works info */}
                    <div className="bg-gradient-to-br from-primary/20 to-zinc-900 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users size={100} />
                        </div>

                        <h3 className="text-lg font-bold mb-2 text-primary">Pre-Validation Flow</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                            When you migrate a roster, the system generates unique IDs. These IDs are "sleeping" until a parent attempts to sign up with a matching email from the CSV.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-xs p-2 bg-black/40 rounded-lg">
                                <span className="font-bold text-zinc-500">1</span>
                                <span className="text-zinc-300">Admin uploads "Book of Goalies"</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs p-2 bg-black/40 rounded-lg">
                                <span className="font-bold text-zinc-500">2</span>
                                <span className="text-zinc-300">System creates Pending IDs</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs p-2 bg-black/40 rounded-lg border border-primary/30">
                                <span className="font-bold text-white">3</span>
                                <span className="text-white font-bold">Parent enters Email -> Auto-Match!</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
