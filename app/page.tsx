"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function EntryPortal() {
    const router = useRouter();
    const auth = useAuth();

    useEffect(() => {
        if (!auth.loading && auth.isAuthenticated) {
            if (auth.userRole === 'admin') router.replace('/admin');
            else router.replace('/dashboard');
        }
    }, [auth.loading, auth.isAuthenticated, auth.userRole, router]);

    if (auth.loading) return null;

    return (
        <main className="h-[100dvh] w-full bg-black text-white overflow-hidden fixed inset-0 z-[500] antialiased">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/hero-bg.jpg" 
                    alt="Goalie Card Hero" 
                    className="w-full h-full object-cover"
                />
            </div>
            
            {/* Top Right Logo Anchor */}
            <div className="absolute top-10 right-10 md:top-20 md:right-20 z-20">
                <img 
                    src="/flower-logo.png" 
                    alt="Goalie Card Logo" 
                    className="w-6 h-6 md:w-8 md:h-8 object-contain brightness-0 invert opacity-80"
                />
            </div>

            {/* Centered Slogan Overlay (Masking Baked-in Image Text) */}
            <div className="absolute top-[50.1%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
                {/* Mask Layer to blend with background text */}
                <div className="absolute inset-x-[-24px] inset-y-[-6px] bg-black/50 blur-md rounded-full pointer-events-none" />
                
                <h1 
                    className="relative text-[8px] md:text-[9px] font-[900] uppercase tracking-normal text-white antialiased whitespace-nowrap"
                    style={{ 
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                        WebkitTextStroke: '0.4px white'
                    }}
                >
                    Play with a smile.
                </h1>
            </div>

            {/* Bottom Action Container (Precisely positioned per reference) */}
            <div className="absolute bottom-12 md:bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-[340px] px-8 flex flex-row items-center justify-center gap-4">
                <button 
                    onClick={() => router.push('/activate')}
                    className="flex-1 py-5 bg-white text-black rounded-full font-[900] text-[11px] uppercase tracking-[0.1em] hover:bg-neutral-200 transition-all active:scale-95 shadow-2xl"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                >
                    Join Us
                </button>
                <button 
                    onClick={() => router.push('/login')}
                    className="flex-1 py-5 border border-white/10 bg-black/20 backdrop-blur-md rounded-full text-white text-[11px] font-[900] uppercase tracking-[0.1em] hover:bg-white/10 transition-all active:scale-95"
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                >
                    Sign In
                </button>
            </div>
        </main>
    );
}
