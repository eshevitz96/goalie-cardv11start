"use client";

import { motion } from "framer-motion";
import { Shield, CheckCircle, Circle, QrCode } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

interface GoalieCardProps {
    name: string;
    session: number;
    lesson: number;
    className?: string;
}

export function GoalieCard({ name, session, lesson, className }: GoalieCardProps) {
    const maxLessons = 4;
    const progress = (lesson / maxLessons) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={twMerge(
                "relative overflow-hidden rounded-3xl bg-card border border-border p-6 shadow-2xl transition-colors",
                className
            )}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                Goalie Profile
                                <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] text-muted-foreground font-bold border border-border">2008 YOB</span>
                            </h2>
                            <h1 className="text-3xl font-bold text-card-foreground tracking-tight">
                                {name}
                            </h1>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-medium whitespace-nowrap">
                                <span className="text-foreground">U16 AAA Jr. Kings</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>Catch: <span className="text-foreground">Left</span></span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>6'1" / 175lbs</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground group relative border border-transparent hover:border-border" title="View Wallet ID">
                            <QrCode size={18} />
                        </button>
                        <Link href="/parent/profile" className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground group relative border border-transparent hover:border-border">
                            <span className="sr-only">Edit Profile</span>
                            {/* Edit Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Camp Status</div>
                            <div className="text-xl font-mono font-bold text-accent">
                                Session {session} • Lesson {lesson}
                            </div>
                        </div>
                        <span className="text-sm font-bold text-primary">{lesson} / {maxLessons}</span>
                    </div>

                    <div className="h-4 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary to-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)]"
                        />
                    </div>

                    {lesson >= maxLessons ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Link
                                href="/parent/renew"
                                className="w-full mt-4 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-black text-white shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 uppercase tracking-wide text-sm relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative z-10 flex items-center gap-2">
                                    Renew for Session {session + 1}
                                    <CheckCircle size={18} className="text-white/80" />
                                </span>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="flex justify-between text-xs text-muted-foreground font-medium pt-2 px-1">
                            <span>Keep grinding!</span>
                            <span>{maxLessons - lesson} lessons to go</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
