"use client";

import { BetaSurveyForm } from "@/components/beta/BetaSurveyForm";
import Link from "next/link";

export default function BetaSurveyPage() {
    return (
        <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">&larr; Back to App</Link>
                        <h1 className="text-3xl font-black tracking-tighter italic">BETA<span className="text-primary">SURVEY</span></h1>
                        <p className="text-muted-foreground mt-2">Help us shape the future of GoalieCard.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</div>
                        <div className="text-green-500 font-mono font-bold">OPEN</div>
                    </div>
                </header>

                <BetaSurveyForm />
            </div>
        </main>
    );
}
