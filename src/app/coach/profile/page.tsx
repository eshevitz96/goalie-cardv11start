"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Loader2, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { supabase } from "@/utils/supabase/client";
import { updateCoachProfile } from "./actions";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export default function CoachProfile() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [fullName, setFullName] = useState("");
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [philosophy, setPhilosophy] = useState("");
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    setFullName(profile.full_name || "");
                    setTitle(profile.title || "");
                    setBio(profile.bio || "");
                    setPhilosophy(profile.philosophy || "");
                }
            }
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setMessage(null);
        startTransition(async () => {
            const result = await updateCoachProfile({
                full_name: fullName,
                title,
                bio,
                philosophy
            });

            if (result.success) {
                setMessage({ text: "Configurations Updated Successfully", type: 'success' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ text: result.error || "Tactical Error: Save Failed", type: 'error' });
            }
        });
    }

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white pb-20">
            {/* V11 Top Nav Bar (Technical) */}
            <nav className="fixed top-0 inset-x-0 h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 z-50 px-8 flex items-center justify-between">
                <Link href="/coach" className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">Abort Navigation</span>
                </Link>

                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black italic uppercase tracking-[0.2em] text-primary">Status: Professional</p>
                    <p className="text-sm font-black italic tracking-tighter opacity-40 uppercase">IDENTITY_CONFIG.V11</p>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto pt-32 px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left Intelligence Panel */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-card/30 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
                            
                            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-32 h-32 rounded-[2rem] bg-foreground text-background flex items-center justify-center text-5xl font-black shadow-2xl shadow-black/40 italic">
                                    {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">{fullName || "COACH_ID"}</h2>
                                    <p className="text-[10px] font-black italic uppercase tracking-[0.2em] text-primary/60">{title || "OPERATIVE"}</p>
                                </div>
                                <div className="pt-6 w-full grid grid-cols-2 gap-4 border-t border-white/5">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black italic uppercase tracking-widest text-muted-foreground/40">SESSIONS</p>
                                        <p className="text-xl font-black italic tracking-tighter">--</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black italic uppercase tracking-widest text-muted-foreground/40">RATING</p>
                                        <p className="text-xl font-black italic tracking-tighter">5.0</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Settings Mini-Panels */}
                        <div className="space-y-4">
                            <div className="bg-secondary/20 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Cloud size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black italic uppercase tracking-widest text-foreground">Cloud Sync</p>
                                        <p className="text-[9px] font-black italic text-muted-foreground uppercase tracking-widest">Auto-Calendar</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSyncEnabled(!syncEnabled)}
                                    className={clsx(
                                        "w-12 h-6 rounded-full relative transition-all",
                                        syncEnabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-zinc-800"
                                    )}
                                >
                                    <div className={clsx(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                        syncEnabled ? "right-1" : "left-1"
                                    )} />
                                </button>
                            </div>

                            <Link href="/update-password" data-complexity="7">
                                <div className="bg-secondary/20 rounded-3xl p-6 border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Shield size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black italic uppercase tracking-widest text-foreground">Security</p>
                                            <p className="text-[9px] font-black italic text-muted-foreground uppercase tracking-widest">Update Key</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Right Configuration Deck */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="space-y-1">
                            <h1 className="text-7xl font-black italic tracking-tighter leading-none uppercase">
                                PROFILE <span className="text-primary tracking-tighter">DATA</span>
                            </h1>
                            <p className="text-sm font-medium text-muted-foreground/60 tracking-tight">Configure external identity and coaching methodology.</p>
                        </div>

                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground">Operational Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold italic focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground">Tactical Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. HEAD GOALIE COACH"
                                        className="w-full bg-secondary/30 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold italic focus:outline-none focus:border-primary transition-all uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground">Strategic Bio</label>
                                <textarea
                                    rows={6}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Detail professional experience..."
                                    className="w-full bg-secondary/30 border border-white/5 rounded-3xl p-8 text-sm font-medium italic focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground">Coaching Philosophy</label>
                                <textarea
                                    rows={4}
                                    value={philosophy}
                                    onChange={(e) => setPhilosophy(e.target.value)}
                                    placeholder="Your technical approach to athlete development..."
                                    className="w-full bg-secondary/30 border border-white/5 rounded-3xl p-8 text-sm font-medium italic focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="flex-1 relative group/btn overflow-hidden rounded-[2rem] bg-foreground p-[2px] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-rose-600 to-primary animate-[shimmer_2s_linear_infinite] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    <div className="relative h-20 bg-foreground flex items-center justify-center gap-4 rounded-[1.95rem]">
                                        {isPending ? (
                                            <Loader2 className="animate-spin text-background" />
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <Save className="text-primary" strokeWidth={3} size={24} />
                                                <span className="text-lg font-black italic tracking-tighter text-background uppercase">Save Configurations</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => router.back()}
                                    className="px-10 h-20 bg-secondary/30 rounded-[2rem] border border-white/5 text-[10px] font-black italic uppercase tracking-[0.2em] text-muted-foreground hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>

                            {message && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={clsx(
                                        "p-6 rounded-[2rem] text-center text-xs font-black italic uppercase tracking-widest border",
                                        message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'
                                    )}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
