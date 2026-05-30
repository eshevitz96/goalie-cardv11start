"use client";

import { useState } from "react";
import { Loader2, FileText, ArrowRight, Smile, Meh, Frown } from "lucide-react";

interface ActivateBaselineStepProps {
    answers: { id: number; question: string; answer: string; mood: string }[];
    setAnswers: (answers: any[]) => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export function ActivateBaselineStep({ answers, setAnswers, onSubmit, isLoading }: ActivateBaselineStepProps) {

    const handleAnswerChange = (id: number, field: string, value: string) => {
        const newAnswers = answers.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        );
        setAnswers(newAnswers);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <FileText size={32} className="text-blue-500" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter font-black">Baseline</h1>
            </div>

            <div className="space-y-4">
                {answers.map((item, index) => (
                    <div key={item.id} className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-sm">
                        <p className="font-bold text-sm text-foreground">{index + 1}. {item.question}</p>

                        <textarea
                            value={item.answer}
                            onChange={(e) => handleAnswerChange(item.id, 'answer', e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg p-3 text-sm focus:border-blue-500 outline-none h-20 resize-none"
                            placeholder="Type your answer here..."
                        />
                        <div className="flex justify-around mt-2 bg-background/50 p-2 rounded-lg border border-border/50">
                            <button
                                onClick={() => handleAnswerChange(item.id, 'mood', 'good')}
                                className={`p-2 rounded-full transition-all ${item.mood === 'good' ? 'bg-emerald-500/20 text-emerald-500 scale-110 shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                                title="Good"
                            >
                                <Smile size={24} />
                            </button>
                            <button
                                onClick={() => handleAnswerChange(item.id, 'mood', 'neutral')}
                                className={`p-2 rounded-full transition-all ${item.mood === 'neutral' ? 'bg-yellow-500/20 text-yellow-500 scale-110 shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                                title="Neutral"
                            >
                                <Meh size={24} />
                            </button>
                            <button
                                onClick={() => handleAnswerChange(item.id, 'mood', 'bad')}
                                className={`p-2 rounded-full transition-all ${item.mood === 'bad' ? 'bg-rose-500/20 text-rose-500 scale-110 shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                                title="Bad"
                            >
                                <Frown size={24} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Complete Profile <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}
