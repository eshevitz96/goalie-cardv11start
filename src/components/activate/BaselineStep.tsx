import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Smile, Frown, Meh } from 'lucide-react';

interface BaselineStepProps {
    onSubmit: (answers: any[]) => Promise<void>;
    isLoading: boolean;
}

export function BaselineStep({ onSubmit, isLoading }: BaselineStepProps) {
    const [answers, setAnswers] = useState([
        { id: 1, question: "How confident do you feel in your game right now?", answer: "", mood: "neutral" },
        { id: 2, question: "What is your biggest goal for this season?", answer: "", mood: "neutral" },
        { id: 3, question: "What is your biggest frustration currently?", answer: "", mood: "neutral" },
    ]);

    const handleAnswerChange = (id: number, val: string) => {
        setAnswers(prev => prev.map(a => a.id === id ? { ...a, answer: val } : a));
    };

    const handleMoodChange = (id: number, mood: string) => {
        setAnswers(prev => prev.map(a => a.id === id ? { ...a, mood } : a));
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black italic tracking-tighter text-foreground mb-2">BASELINE <span className="text-primary">CHECK-IN</span></h1>
                <p className="text-muted-foreground text-sm">Help us understand where you're starting from.</p>
            </div>

            <div className="space-y-6">
                {answers.map((item) => (
                    <div key={item.id} className="bg-secondary/30 p-4 rounded-xl border border-border">
                        <label className="text-sm font-bold text-foreground block mb-2">{item.question}</label>
                        <textarea
                            value={item.answer}
                            onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:border-primary outline-none min-h-[80px]"
                            placeholder="Type your answer here..."
                        />
                        <div className="flex gap-2 mt-2">
                            {['bad', 'neutral', 'good'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleMoodChange(item.id, m)}
                                    className={`p-2 rounded-lg transition-colors ${item.mood === m ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                >
                                    {m === 'bad' && <Frown size={16} />}
                                    {m === 'neutral' && <Meh size={16} />}
                                    {m === 'good' && <Smile size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Button
                onClick={() => onSubmit(answers)}
                variant="primary"
                size="lg"
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : "Save & Continue"}
            </Button>
        </div>
    );
}
