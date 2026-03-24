"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "./ui/BrandLogo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
    return (
        <section className="relative min-h-screen bg-white flex flex-col items-center justify-center overflow-hidden">
            {/* Logo Lock in Top Left on Black Box */}
            <div className="absolute top-0 left-0 p-8 z-50">
                <div className="bg-black p-4 rounded-xl shadow-2xl transition-transform hover:scale-105 active:scale-95">
                    <BrandLogo 
                        withText={true} 
                        className="text-white" 
                        textClassName="text-xl font-black uppercase tracking-[0.2em] text-white"
                    />
                </div>
            </div>

            {/* The Cover Graphic */}
            <div className="relative w-full max-w-4xl aspect-[4/5] md:aspect-video flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full h-full"
                >
                    <img 
                        src="/landing-cover.png" 
                        alt="Goalie Card Ink Illustration" 
                        className="w-full h-full object-contain mix-blend-multiply"
                    />
                    {/* Artistic ink splatters or overlays could go here */}
                </motion.div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="space-y-6 pointer-events-auto"
                >
                    <h1 className="text-4xl md:text-7xl font-black text-black tracking-tighter leading-none max-w-3xl">
                        SLOW THE GAME DOWN.
                    </h1>
                    <p className="text-sm md:text-lg font-medium text-black/60 uppercase tracking-[0.3em] max-w-xl mx-auto">
                        Next-Gen Performance Tracking & Expert Analysis
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4 pt-8">
                        <Link href="/login">
                            <button className="bg-black text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3">
                                Enter Portal <ArrowRight size={16} />
                            </button>
                        </Link>
                        <Link href="/activate">
                            <button className="bg-white text-black border-2 border-black px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all">
                                Activate Card
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-black/20"
            >
                <div className="w-px h-12 bg-black/10 mx-auto" />
            </motion.div>
        </section>
    );
}
