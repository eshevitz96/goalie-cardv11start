"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Save, Shield } from "lucide-react";
import Link from "next/link";

export default function ParentProfile() {
    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        GOALIE <span className="text-primary">PROFILE</span>
                    </h1>
                </div>

                {/* Goalie Info Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">

                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                            {/* Placeholder for uploaded image */}
                            <Shield size={40} className="text-zinc-600" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold uppercase text-white">Edit Photo</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Goalie Name</label>
                            <input
                                type="text"
                                defaultValue="Leo Vance"
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Birth Year</label>
                                <input
                                    type="text"
                                    defaultValue="2008"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Team</label>
                                <input
                                    type="text"
                                    defaultValue="U16 AAA Jr. Kings"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Height</label>
                                <input
                                    type="text"
                                    defaultValue={'6\'1"'}
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Weight</label>
                                <input
                                    type="text"
                                    defaultValue="175lbs"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Catch</label>
                                <select className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors hover:border-zinc-700 appearance-none">
                                    <option>Left</option>
                                    <option>Right</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-4 py-4 bg-white text-black rounded-xl font-bold shadow-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} />
                        Save Changes
                    </button>

                </div>
            </div>
        </main>
    );
}
