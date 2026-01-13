"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Cloud, Upload } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export default function CoachProfile() {
    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/coach"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        EDIT <span className="text-primary">PROFILE</span>
                    </h1>
                </div>

                {/* Profile Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8">

                    {/* Avatar & Basic Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                            <span className="text-3xl font-black text-zinc-600">CM</span>
                        </div>
                        <div className="space-y-4 w-full">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Coach Name</label>
                                <input
                                    type="text"
                                    defaultValue="Coach Mike"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    defaultValue="Head Goalie Coach"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resume / Bio */}
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Coaching Resume / Bio</label>
                        <textarea
                            rows={6}
                            defaultValue="Former NCAA D1 goaltender with 10+ years of coaching experience. Specializing in modern butterfly technique and puck handling mechanics."
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700 resize-none"
                        />
                    </div>

                    {/* Sync Settings */}
                    <div className="border-t border-zinc-800 pt-8">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Cloud className="text-blue-500" size={20} />
                            Sync Settings
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                            <div>
                                <div className="font-bold text-sm text-zinc-200">iCloud Calendar Sync</div>
                                <div className="text-xs text-zinc-500">Automatically add sessions to your calendar</div>
                            </div>
                            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-zinc-400 hover:text-white transition-all">
                            Cancel
                        </button>
                        <button className="flex-1 py-4 bg-gradient-to-r from-primary to-rose-600 rounded-xl font-bold text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>

                </div>
            </div>
        </main>
    );
}
