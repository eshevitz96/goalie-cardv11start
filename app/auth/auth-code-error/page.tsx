"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthCodeError() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-4">Authentication Error</h1>
                <p className="text-muted-foreground text-sm mb-8 italic">
                    The security code from your email link may have expired or was already used. Please try logging in again.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Back to Login
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} /> Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
