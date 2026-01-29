"use client";

import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { AlertCircle, User, Shield, AlertTriangle, ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function StressTestPage() {
    const scenarios = [
        {
            id: 1,
            title: "Scenario 1: The 'Delusional' Goalie",
            description: "Goalie is overconfident and ignoring poor performance.",
            inputs: {
                text: "I was terrible today. Let in 5 soft goals. I wasn't tracking anything.",
                mood: "happy" // User blindly selects Happy
            },
            critique: "IMPROVED: The AI should now ignore the 'Happy' mood because the text 'terrible' and '5 soft goals' signals a need for a Reality Check."
        },
        {
            id: 2,
            title: "Scenario 2: The 'Imposter' Syndrome",
            description: "Goalie performs well but feels like a failure.",
            inputs: {
                text: "We won 4-0 but I felt lost. I got lucky on three posts.",
                mood: "frustrated" // User selects Frustrated
            },
            critique: "IMPROVED: The AI should detect that while the mood is 'Frustrated', the context involves clear success ('Won 4-0'). It should focus on Validation."
        },
        {
            id: 3,
            title: "Scenario 3: The 'Injured' Goalie",
            description: "Goalie flags a physical issue.",
            inputs: {
                text: "My knee felt sharp pain on the butterfly.",
                mood: "neutral" // Default
            },
            critique: "SAFETY CRITICAL: Any mention of 'pain' or 'sharp' must immediately trigger a Safety Protocol, overriding all training advice."
        }
    ];

    return (
        <main className="min-h-screen bg-background p-8 selection:bg-red-500/30">

            <div className="max-w-5xl mx-auto mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <Link href="/parent" className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
                        <ArrowRight className="rotate-180" size={20} />
                    </Link>
                    <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
                        STRESS TEST <span className="text-green-500">LAB 2.0</span>
                    </h1>
                </div>
                <p className="text-muted-foreground">
                    Verifying the <span className="text-foreground font-bold">Local Expert Engine</span> handles edge cases without external AI.
                </p>
            </div>

            <div className="max-w-5xl mx-auto space-y-12">
                {scenarios.map((scenario) => (
                    <div key={scenario.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-b border-border pb-12 last:border-0">

                        {/* Input Column */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                                <Shield size={14} />
                                {scenario.title}
                            </div>

                            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <User size={64} />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Goalie Journal Entry</span>
                                    <p className="text-lg font-medium text-foreground italic mt-2">"{scenario.inputs.text}"</p>

                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Selected Mood:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${scenario.inputs.mood === 'happy' ? 'bg-green-500/20 text-green-500' :
                                            scenario.inputs.mood === 'frustrated' ? 'bg-red-500/20 text-red-500' :
                                                'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                            {scenario.inputs.mood}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                                <span className="text-primary font-bold text-xs uppercase mb-1 block">Expected Behavior</span>
                                <p className="text-primary/80 text-sm leading-relaxed">
                                    {scenario.critique}
                                </p>
                            </div>
                        </div>

                        {/* AI Output Column (The Logic Box) */}
                        <div className="lg:col-span-1 flex items-center justify-center text-muted-foreground">
                            <ArrowRight size={24} className="hidden lg:block" />
                            <ArrowRight size={24} className="lg:hidden rotate-90 my-4" />
                        </div>

                        {/* Result Column */}
                        <div className="lg:col-span-7">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase">System Output</span>
                                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Expert Engine: {scenario.inputs.mood} + "{scenario.inputs.text.substring(0, 15)}..."</span>
                            </div>

                            {/* 
                                KEY UPDATE: We now pass 'overrideText' to force the component 
                                to use our specific scenario text, bypassing the DB fetch.
                            */}
                            <AiCoachRecommendation
                                rosterId={`sim-test-${scenario.id}`}
                                lastMood={scenario.inputs.mood}
                                overrideText={scenario.inputs.text}
                            />
                        </div>

                    </div>
                ))}
            </div>

            <div className="max-w-5xl mx-auto mt-12 p-8 bg-zinc-900 rounded-3xl border border-zinc-800 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Local Learning Active</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    The system is now running on the <span className="text-white font-bold">Expert Rules Engine</span>.
                    It processes text keywords locally to override simplistic mood tags when necessary.
                </p>
            </div>

        </main>
    );
}
