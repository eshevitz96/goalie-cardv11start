"use server";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Mail } from "lucide-react";

export default async function CoachActivatePage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-indigo-600/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-card/60 border border-white/10 rounded-[2.5rem] p-8 md:p-10 space-y-6 text-center backdrop-blur-xl shadow-2xl relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                    <ShieldAlert size={32} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black italic uppercase tracking-tight text-foreground">
                        Coach Access Restricted
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Public coach self-registration is disabled. Coach access requires an account invitation and manual authorization by Elliott Shevitz.
                    </p>
                </div>

                <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">How to get access:</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                        <li>Log in to your existing GoalieCard account.</li>
                        <li>Submit a "Request Coach Access" action.</li>
                        <li>Elliott will review and approve your coaching role.</li>
                    </ul>
                </div>

                <div className="pt-2 space-y-3">
                    <Link
                        href="/login"
                        className="w-full py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                    >
                        Go to Sign In
                    </Link>

                    <Link
                        href="/"
                        className="w-full py-3 bg-secondary/50 text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
