"use client";

import UnifiedEntry from "@/components/auth/UnifiedEntry";

export default function EntryPortal() {
    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects matching screenshot style - Dark/void */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style={{ stopColor: 'rgb(50,50,50)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'rgb(0,0,0)', stopOpacity: 1 }} />
                </radialGradient>
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[128px]" />
            </div>

            <UnifiedEntry />

            <div className="absolute bottom-6 left-0 w-full text-center text-[10px] text-zinc-800 font-mono uppercase tracking-widest">
                Secure Authentication v2.0
            </div>
        </main>
    );
}
