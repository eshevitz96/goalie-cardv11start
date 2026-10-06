"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitFeedback } from '@/app/actions/feedback';

interface SessionFeedbackPromptProps {
    totalSessions?: number;
    isOpen?: boolean;
    onClose?: () => void;
}

export function SessionFeedbackPrompt({ totalSessions, isOpen: forcedOpen, onClose }: SessionFeedbackPromptProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (forcedOpen !== undefined) {
            setIsOpen(forcedOpen);
            return;
        }

        // Handle global event listener for milestone triggers
        const handlePromptEvent = (e: CustomEvent<{ totalSessions?: number }>) => {
            const count = e.detail?.totalSessions;
            if (count && count > 0 && count % 3 === 0) {
                const dismissedKey = `feedback_prompt_dismissed_${count}`;
                if (!localStorage.getItem(dismissedKey)) {
                    setIsOpen(true);
                }
            } else {
                setIsOpen(true);
            }
        };

        window.addEventListener('open-session-feedback-prompt' as any, handlePromptEvent);
        return () => window.removeEventListener('open-session-feedback-prompt' as any, handlePromptEvent);
    }, [forcedOpen]);

    const handleDismiss = () => {
        if (totalSessions) {
            localStorage.setItem(`feedback_prompt_dismissed_${totalSessions}`, 'true');
        }
        setIsOpen(false);
        if (onClose) onClose();
    };

    const handleSubmit = async () => {
        if (rating === null && !note.trim()) {
            handleDismiss();
            return;
        }

        setIsSubmitting(true);
        try {
            const currentPage = typeof window !== 'undefined' ? window.location.pathname : undefined;
            const res = await submitFeedback({
                kind: 'prompt',
                rating: rating,
                body: note.trim() || undefined,
                page: currentPage
            });

            if (res.success) {
                setIsSubmitted(true);
                if (totalSessions) {
                    localStorage.setItem(`feedback_prompt_dismissed_${totalSessions}`, 'true');
                }
                setTimeout(() => {
                    setIsOpen(false);
                    setIsSubmitted(false);
                    if (onClose) onClose();
                }, 1000);
            } else {
                handleDismiss();
            }
        } catch (err: any) {
            handleDismiss();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed bottom-6 right-6 z-[1150] max-w-sm w-full p-2">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="bg-card border border-border rounded-2xl p-5 shadow-2xl space-y-3 relative"
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>

                    {isSubmitted ? (
                        <div className="py-4 flex flex-col items-center justify-center text-center space-y-1">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                            <p className="text-xs font-bold text-foreground">Thanks for the feedback!</p>
                        </div>
                    ) : (
                        <>
                            <div className="pr-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                    Quick Check-in
                                </h4>
                                <p className="text-sm font-semibold text-foreground leading-snug">
                                    How&apos;s Goalie Card working for you?
                                </p>
                            </div>

                            {/* 1-5 Score selector */}
                            <div className="flex items-center justify-between gap-1 py-1">
                                {[1, 2, 3, 4, 5].map((score) => {
                                    const isSelected = rating === score;
                                    return (
                                        <button
                                            key={score}
                                            type="button"
                                            onClick={() => setRating(score)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                isSelected
                                                    ? 'bg-foreground text-background border-foreground shadow-sm scale-105'
                                                    : 'bg-secondary/40 text-foreground border-border hover:border-foreground/40'
                                            }`}
                                        >
                                            {score}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Optional note */}
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optional note or comment..."
                                className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Dismiss
                                </button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (rating === null && !note.trim())}
                                    className="bg-foreground text-background font-bold text-xs px-3.5 py-1.5 rounded-xl hover:opacity-90 flex items-center gap-1.5 h-auto"
                                >
                                    {isSubmitting ? "Sending..." : "Submit"}
                                </Button>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
