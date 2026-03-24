"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BrandLogo } from './ui/BrandLogo';
import { Button } from './ui/Button';

export function LandingHero() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#f5f5f7]/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#f5f5f7]/30 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Messaging */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start space-y-8"
        >
          <div className="space-y-4">
            <BrandLogo 
              size={48} 
              textClassName="text-3xl md:text-4xl font-semibold tracking-tighter" 
            />
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-black">
              PLAY WITH<br />
              <span className="text-neutral-400">A SMILE.</span>
            </h1>
          </div>
          
          <p className="max-w-md text-xl md:text-2xl text-neutral-600 font-medium leading-relaxed">
            The high-performance platform for elite goalies. 
            Precision charting, video analysis, and scouting in one editorial interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button 
              size="lg" 
              className="h-16 px-10 text-xl font-bold rounded-full bg-black text-white hover:scale-[1.02] transition-transform duration-300"
              onClick={() => router.push('/login')}
            >
              Enter the Zone
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="h-16 px-10 text-xl font-bold rounded-full border-2 border-black/10 hover:bg-neutral-50 hover:scale-[1.02] transition-transform duration-300"
              onClick={() => router.push('/signup')}
            >
              Join the Ranks
            </Button>
          </div>

          <div className="pt-8 border-t border-neutral-100 w-full">
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              Trusted by U+ Tier Goalies
            </p>
          </div>
        </motion.div>

        {/* Right Column: High-Fidelity Solid Black Goalie Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center p-4 lg:p-12 h-full min-h-[500px]"
        >
          <div className="relative w-full aspect-square flex items-center justify-center">
            {/* The finalized "Illustrator-style" solid black ink graphic */}
            <img 
              src="/goalie-asset.png" 
              alt="Goalie Performance Graphic"
              className="w-full h-auto object-contain z-10"
              draggable={false}
            />
            
            {/* Subtle pulse behind the asset */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-neutral-200 rounded-full blur-[100px] -z-10"
            />
          </div>
        </motion.div>
      </main>

      {/* Footer / Editorial Fragment */}
      <footer className="absolute bottom-8 left-10 md:left-20 z-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-neutral-300">
          GOALIE CARD V11 / REFINED PERFORMANCE / ©2026
        </p>
      </footer>
    </div>
  );
}
