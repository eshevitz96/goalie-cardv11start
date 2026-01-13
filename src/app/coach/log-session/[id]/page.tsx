"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Video, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function LogSession() {
    const params = useParams(); // In a real app we'd use this to fetch name
    const [rating, setRating] = useState(0);

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/coach"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Post-Game Report</div>
                        <h1 className="text-2xl font-black italic tracking-tighter">
                            LOG <span className="text-primary">SESSION</span>
                        </h1>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">

                    {/* Date & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session Type</label>
                            <select className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm appearance-none">
                                <option>Private Lesson</option>
                                <option>Group Clinic</option>
                                <option>Game Analysis</option>
                            </select>
                        </div>
                    </div>

                    {/* Performance Rating */}
                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-center">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Performance Rating</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-accent' : 'text-zinc-700'}`}
                                >
                                    <Star size={32} fill={rating >= star ? "currentColor" : "none"} strokeWidth={rating >= star ? 0 : 2} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Coach's Notes</label>
                        <textarea
                            rows={4}
                            placeholder="Key areas of focus, progress made, things to work on..."
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700 resize-none"
                        />
                    </div>

                    {/* Video Upload */}
                    <div className="border border-dashed border-zinc-700 rounded-xl p-8 hover:bg-zinc-800/20 transition-colors cursor-pointer group">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Video size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-zinc-300">Upload Session Highlights</div>
                                <div className="text-xs text-zinc-500 mt-1">MP4 or MOV up to 500MB</div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-gradient-to-r from-primary to-rose-600 rounded-xl font-bold text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Publish Report
                    </button>

                </div>
            </div>
        </main>
    );
}
