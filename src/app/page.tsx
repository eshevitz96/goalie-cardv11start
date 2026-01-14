"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, User, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPortal() {
    return (
        <main className="min-h-screen bg-black flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-900 border-none md:overflow-hidden relative">

            {/* Decorative Blur */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                <div className="w-16 h-16 relative flex items-center justify-center">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Parent Portal Side */}
            <Link
                href="/parent"
                className="group relative flex-1 flex flex-col items-center justify-center p-12 hover:bg-zinc-900/40 transition-all duration-500"
            >
                <div className="bg-zinc-900 border border-zinc-800 rounded-full w-24 h-24 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-300 shadow-2xl">
                    <User size={32} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>

                <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 group-hover:tracking-normal transition-all">
                    PARENT <span className="text-blue-500">PORTAL</span>
                </h2>

                <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest text-center max-w-xs mb-8">
                    View Player Cards, Stats, Lessons, and Manage Payments.
                </p>

                <div className="flex items-center gap-2 text-blue-500 text-sm font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Enter Portal <ArrowRight size={16} />
                </div>
            </Link>

            {/* Coach Portal Side */}
            <Link
                href="/login"
                className="group relative flex-1 flex flex-col items-center justify-center p-12 hover:bg-zinc-900/40 transition-all duration-500"
            >
                <div className="bg-zinc-900 border border-zinc-800 rounded-full w-24 h-24 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-2xl">
                    <Shield size={32} className="text-zinc-400 group-hover:text-primary transition-colors" />
                </div>

                <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 group-hover:tracking-normal transition-all">
                    COACH <span className="text-primary">ACCESS</span>
                </h2>

                <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest text-center max-w-xs mb-8">
                    Manage Rosters, Log Sessions, Review Video, and Analytics.
                </p>

                <div className="flex items-center gap-2 text-primary text-sm font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Secure Login <ArrowRight size={16} />
                </div>
            </Link>

            {/* Admin Link */}
            <div className="absolute bottom-6 right-6 z-50">
                <Link href="/login" className="text-[10px] text-zinc-700 hover:text-zinc-500 font-mono flex items-center gap-1 transition-colors">
                    ADMIN ACCESS
                </Link>
            </div>

            <div className="absolute bottom-6 left-6 z-50 text-[10px] text-zinc-800 font-mono">
                v11.0.7
            </div>

        </main>
    );
}
