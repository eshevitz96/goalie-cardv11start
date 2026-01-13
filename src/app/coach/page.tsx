"use client";

import { motion } from "framer-motion";
import {
    Users,
    Calendar,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Search,
    MoreVertical,
    BarChart3,
    Download,
    Mail,
    FileEdit,
    Shield,
    Plus,
    Ticket,
    MapPin,
    ChevronRight,
    Upload,
    ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

import { useState } from "react";

const INCOMING_REQUESTS = [
    { id: 1, parent: "Sarah Vance", goalie: "Leo Vance", requestedDate: "Nov 3, 4:00 PM", status: "pending", note: "Focus on glove hand" },
    { id: 2, parent: "Mike Ross", goalie: "Jamie Ross", requestedDate: "Nov 4, 5:30 PM", status: "pending", note: "Butterfly slides" },
];

const PENDING_ACTIVATIONS = [
    { id: 1, parent: "John Smith", goalie: "Tyler Smith 2010", status: "waiting_id" }
];

const GOALIE_ROSTER = [
    { id: 1, name: "Leo Vance", session: 1, lesson: 3, status: "active", lastSeen: "2 days ago" },
    { id: 2, name: "Jamie Ross", session: 2, lesson: 1, status: "active", lastSeen: "5 days ago" },
    { id: 3, name: "Max Power", session: 1, lesson: 4, status: "renew_needed", lastSeen: "1 week ago" },
    { id: 4, name: "Sarah Connor", session: 3, lesson: 2, status: "active", lastSeen: "Yesterday" },
];

export default function CoachDashboard() {
    const [issuedIds, setIssuedIds] = useState<Record<number, string>>({});
    const PENDING_REVIEWS = GOALIE_ROSTER.filter(g => g.lesson >= 4);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Command Center</h2>
                    <h1 className="text-3xl font-black italic tracking-tighter">
                        COACH<span className="text-primary">OS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group z-50">
                        <button className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 transition-colors">
                            <span className="font-bold">CM</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                            <Link href="/coach/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                <Users size={16} /> Coach Profile
                            </Link>
                            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                <Download size={16} /> Export CSV
                            </button>
                            <div className="h-px bg-zinc-800 my-1" />
                            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Inbox */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="text-primary" />
                                Schedule Requests
                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{INCOMING_REQUESTS.length}</span>
                            </h3>
                        </div>

                        <div className="grid gap-4">
                            {INCOMING_REQUESTS.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-zinc-700 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                            {req.goalie[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{req.goalie}</h4>
                                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                                <span className="text-zinc-500">Parent:</span> {req.parent}
                                            </div>
                                            <div className="mt-2 text-sm bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50 text-zinc-300 italic">
                                                "{req.note}"
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                        <div className="font-mono font-bold text-primary">{req.requestedDate}</div>
                                        <div className="flex gap-2 w-full">
                                            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-colors border border-zinc-700 hover:border-zinc-600">
                                                Decline
                                            </button>
                                            <button className="flex-1 bg-primary hover:bg-rose-600 py-2 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-1">
                                                <CheckCircle2 size={14} /> Accept
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Ticket className="text-pink-500" />
                                Group Sessions
                            </h3>
                            <button className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-lg border border-zinc-800 transition-colors flex items-center gap-2">
                                <Plus size={14} /> Create Event
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Create New Card (Mock helper) */}
                            <div className="bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={24} className="text-zinc-600 group-hover:text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-400 group-hover:text-white">New Session</div>
                                    <div className="text-xs text-zinc-600">Issue Event Passes</div>
                                </div>
                            </div>

                            {/* Active Session Card */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-colors">
                                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-white">GS Baltimore Camp</h4>
                                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                <Calendar size={12} /> Dec 12-14
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <MapPin size={12} /> Reistertown
                                            </div>
                                        </div>
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-emerald-500/20">
                                            12/15 Filled
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 text-[8px] flex items-center justify-center text-white font-bold">
                                                    {['L', 'J', 'M'][i - 1]}
                                                </div>
                                            ))}
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 text-[8px] flex items-center justify-center text-zinc-500 font-bold">
                                                +9
                                            </div>
                                        </div>
                                        <div className="flex-1" />
                                        <button className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                                            Manage <ChevronRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="text-accent" />
                                Active Roster
                            </h3>
                            <div className="flex items-center gap-2">
                                <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg border border-zinc-800 transition-colors flex items-center gap-2">
                                    <Upload size={14} /> <span className="hidden md:inline">Import CSV</span>
                                </button>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Find goalie..."
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-600 w-32 md:w-48"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase text-zinc-500 font-semibold tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Goalie</th>
                                        <th className="p-4">Progress</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {GOALIE_ROSTER.map((goalie) => (
                                        <tr key={goalie.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-white">{goalie.name}</div>
                                                <div className="text-xs text-zinc-500">Last seen: {goalie.lastSeen}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-zinc-300">S{goalie.session} L{goalie.lesson}</span>
                                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${(goalie.lesson / 4) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {goalie.status === 'renew_needed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                                                        Renew Due
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="relative group">
                                                    <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {/* Hover Dropdown */}
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-8 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                        <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                                            <Mail size={14} /> Message Parent
                                                        </button>
                                                        {goalie.lesson >= 4 && (
                                                            <Link href={`/coach/log-session/${goalie.id}`} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:text-white hover:bg-primary/10 transition-colors flex items-center gap-2">
                                                                <FileEdit size={14} /> Log Session & Review
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Right Column: Quick Actions */}
                <div className="space-y-6">
                    {/* Pending Reviews */}
                    {PENDING_REVIEWS.length > 0 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                <FileEdit size={18} className="text-primary" />
                                Pending Reviews
                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{PENDING_REVIEWS.length}</span>
                            </h3>

                            <div className="space-y-3 relative z-10">
                                {PENDING_REVIEWS.map((goalie) => (
                                    <div key={goalie.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors">
                                        <div>
                                            <div className="font-bold text-white text-sm">{goalie.name}</div>
                                            <div className="text-xs text-zinc-500">Session {goalie.session} Complete</div>
                                        </div>
                                        <Link
                                            href={`/coach/log-session/${goalie.id}`}
                                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                        >
                                            Review <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Pending Activations */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-primary" />
                            Pending Activations
                            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{PENDING_ACTIVATIONS.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {PENDING_ACTIVATIONS.map((req) => (
                                <div key={req.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-white text-sm">{req.goalie}</div>
                                            <div className="text-xs text-zinc-500">Parent: {req.parent}</div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    </div>
                                    {issuedIds[req.id] ? (
                                        <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-500 text-center uppercase tracking-widest animate-in fade-in zoom-in">
                                            ID: {issuedIds[req.id]}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIssuedIds({ ...issuedIds, [req.id]: "GC-1984" })}
                                            className="w-full py-2 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-xs font-bold text-zinc-400 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Issue Activation ID
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manage Availability */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-500" />
                            Manage Availability
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                                <select className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
                                    <option>4:00 PM</option>
                                    <option>5:30 PM</option>
                                </select>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 flex items-center justify-center">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { id: 1, date: "Wed, Dec 14", time: "4:00 PM" },
                                    { id: 2, date: "Wed, Dec 14", time: "5:30 PM" },
                                    { id: 3, date: "Fri, Dec 16", time: "6:00 AM" },
                                ].map(slot => (
                                    <div key={slot.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2 rounded-lg group hover:border-zinc-700">
                                        <div className="text-xs font-medium text-zinc-300">
                                            {slot.date} <span className="text-zinc-600">•</span> {slot.time}
                                        </div>
                                        <button className="text-zinc-600 hover:text-red-500 transition-colors">
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 rounded-3xl p-6 sticky top-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-green-500" />
                            Quick Comms
                        </h3>

                        <div className="space-y-3">
                            <button className="w-full text-left p-4 bg-zinc-950 border border-zinc-800 hover:border-green-500/50 rounded-xl transition-all group">
                                <div className="font-bold text-sm text-zinc-200 group-hover:text-green-400">Blast: Session Openings</div>
                                <div className="text-xs text-zinc-500 mt-1">Notify all Active parents of new slots</div>
                            </button>

                            <button className="w-full text-left p-4 bg-zinc-950 border border-zinc-800 hover:border-primary/50 rounded-xl transition-all group">
                                <div className="font-bold text-sm text-zinc-200 group-hover:text-primary">Payment Reminders</div>
                                <div className="text-xs text-zinc-500 mt-1">Auto-ping 2 parents (Renew Due)</div>
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-zinc-800">
                            <div className="text-center">
                                <div className="text-4xl font-black text-white mb-1">
                                    $1,250
                                </div>
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    Est. Wk Revenue
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
