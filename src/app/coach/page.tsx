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
    ArrowRight,
    PlayCircle
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoachData } from "@/hooks/useCoachData";
import { Button } from "@/components/ui/Button";
import { CoachScheduler } from "@/components/CoachScheduler";

export default function CoachDashboard() {
    const { userId, userEmail, loading: authLoading } = useAuth();
    const { roster, highlights, isLoading, filter, setFilter, filteredRoster } = useCoachData();

    const [issuedIds, setIssuedIds] = useState<Record<number, string>>({});

    // Mock Data
    const INCOMING_REQUESTS: any[] = [];
    const PENDING_REVIEWS: any[] = [];
    const PENDING_ACTIVATIONS: any[] = [];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };



    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Command Center</h2>
                    <h1 className="text-3xl font-black italic tracking-tighter">
                        COACH<span className="text-primary">OS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group z-50">
                        <Button variant="ghost" className="h-10 w-10 rounded-full bg-card border border-border hover:bg-muted p-0">
                            <span className="font-bold">CM</span>
                        </Button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right backdrop-blur-md">
                            <Link href="/coach/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                <Users size={16} /> Coach Profile
                            </Link>
                            <Button variant="ghost" className="w-full justify-start px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted h-auto font-normal">
                                <Download size={16} /> Export CSV
                            </Button>
                            <div className="h-px bg-zinc-800 my-1" />
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full justify-start px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-colors h-auto font-normal"
                            >
                                <span className="flex items-center gap-2">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Inbox */}
                <div className="lg:col-span-2 space-y-8">

                    {/* HIGHLIGHTS SECTION */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-primary">★</span>
                                Recent Highlights
                                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">{highlights.length}</span>
                            </h3>
                        </div>
                        {highlights.length === 0 ? (
                            <div className="glass p-8 rounded-2xl text-center text-muted-foreground text-sm">
                                No highlights uploaded yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {highlights.map((h: any) => (
                                    <div key={h.id} className="glass p-4 rounded-xl group hover:border-primary/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-sm text-foreground">{h.roster_uploads?.goalie_name || "Unknown Goalie"}</div>
                                            <span className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-2">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <a href={h.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white font-bold text-xs transition-colors">
                                                    <PlayCircle size={14} /> Watch Clip
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">{h.description}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="text-accent" />
                                Active Roster
                            </h3>
                            <div className="flex bg-muted rounded-lg p-1 border border-border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilter('all')}
                                    className={clsx("px-3 py-1 rounded-md", filter === 'all' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilter('assigned')}
                                    className={clsx("px-3 py-1 rounded-md", filter === 'assigned' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                                >
                                    My Goalies
                                </Button>
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="glass rounded-3xl overflow-hidden hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Goalie</th>
                                        <th className="p-4">Progress</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredRoster.map((goalie) => (
                                        <tr key={goalie.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-foreground">{goalie.name}</div>
                                                <div className="text-xs text-muted-foreground">Last seen: {goalie.lastSeen}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-muted-foreground">S{goalie.session} L{goalie.lesson}</span>
                                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
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
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="relative group">
                                                    <Button variant="ghost" size="sm" className="p-2 hover:bg-muted rounded-lg">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-8 w-40 glass rounded-xl shadow-xl p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                                        <Button variant="ghost" size="sm" className="w-full justify-start">
                                                            <Mail size={14} /> Message Parent
                                                        </Button>
                                                        <Link href={`/coach/log-session/${goalie.id}`} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary transition-colors flex items-center gap-2">
                                                            <FileEdit size={14} /> Log Data
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredRoster.map((goalie) => (
                                <div key={goalie.id} className="glass p-5 rounded-2xl border border-border/50">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-bold text-lg text-foreground mb-1">{goalie.name}</div>
                                            <div className="text-xs text-muted-foreground">Last seen: {goalie.lastSeen}</div>
                                        </div>
                                        {goalie.status === 'renew_needed' ? (
                                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 uppercase tracking-wide">
                                                Renew
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 uppercase tracking-wide">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                            <span>Progress</span>
                                            <span className="text-foreground">S{goalie.session} / L{goalie.lesson}</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${(goalie.lesson / 4) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                                        <Button variant="outline" size="sm" className="w-full">
                                            Message
                                        </Button>
                                        <Link
                                            href={`/coach/log-session/${goalie.id}`}
                                            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <FileEdit size={14} /> Log Data
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div >

                {/* Right Column: Quick Actions */}
                < div className="space-y-6" >
                    {/* Schedule Manager */}
                    < CoachScheduler />

                    {/* Pending Reviews */}
                    {
                        PENDING_REVIEWS.length > 0 && (
                            <div className="glass rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                                    <FileEdit size={18} className="text-primary" />
                                    Pending Reviews
                                    <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">{PENDING_REVIEWS.length}</span>
                                </h3>

                                <div className="space-y-3 relative z-10">
                                    {PENDING_REVIEWS.map((goalie) => (
                                        <div key={goalie.id} className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between group hover:border-primary/50 transition-colors">
                                            <div>
                                                <div className="font-bold text-foreground text-sm">{goalie.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">S{goalie.session} L{goalie.lesson} • Complete</div>
                                            </div>
                                            <Link
                                                href={`/coach/log-session/${goalie.id}`}
                                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                            >
                                                Review <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    {/* Pending Activations */}
                    <div className="glass rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-primary" />
                            Pending Activations
                            <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full">{PENDING_ACTIVATIONS.length}</span>
                        </h3>
                        <div className="space-y-3">
                            {PENDING_ACTIVATIONS.map((req) => (
                                <div key={req.id} className="p-4 bg-muted/50 border border-border rounded-xl group hover:border-border transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{req.goalie}</div>
                                            <div className="text-xs text-muted-foreground">Parent: {req.parent}</div>
                                        </div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    </div>
                                    {issuedIds[req.id] ? (
                                        <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-500 text-center uppercase tracking-widest animate-in fade-in zoom-in">
                                            ID: {issuedIds[req.id]}
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIssuedIds({ ...issuedIds, [req.id]: "GC-1984" })}
                                            className="w-full bg-muted hover:bg-foreground hover:text-background"
                                        >
                                            <Plus size={14} /> Issue Activation ID
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-6 sticky top-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MessageSquare size={18} className="text-foreground" />
                            Quick Comms
                        </h3>

                        <div className="space-y-3">
                            <Button variant="ghost" size="sm" className="w-full justify-start p-4 bg-muted/50 border border-border hover:border-foreground/50 rounded-xl group">
                                <div className="text-left">
                                    <div className="font-bold text-sm text-foreground group-hover:text-primary">Blast: Session Openings</div>
                                    <div className="text-xs text-muted-foreground mt-1">Notify all Active parents of new slots</div>
                                </div>
                            </Button>

                            <Button variant="ghost" size="sm" className="w-full justify-start p-4 bg-muted/50 border border-border hover:border-primary/50 rounded-xl transition-all group h-auto">
                                <div className="text-left w-full">
                                    <div className="font-bold text-sm text-foreground group-hover:text-primary">Payment Reminders</div>
                                    <div className="text-xs text-muted-foreground mt-1">Auto-ping 2 parents (Renew Due)</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div >

            </div >
        </main >
    );
}
