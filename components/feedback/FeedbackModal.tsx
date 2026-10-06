"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquarePlus, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { submitFeedback } from '@/app/actions/feedback';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const [body, setBody] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [showScreenshotInput, setShowScreenshotInput] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        if (!body.trim() && !screenshotUrl.trim()) {
            setErrorMessage("Please provide your feedback or attach a screenshot.");
            return;
        }

        setIsSubmitting(true);
        try {
            const currentPage = typeof window !== 'undefined' ? window.location.pathname : undefined;
            const res = await submitFeedback({
                kind: 'menu',
                body: body.trim(),
                page: currentPage,
                screenshotUrl: screenshotUrl.trim() || undefined
            });

            if (res.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    setBody('');
                    setScreenshotUrl('');
                    setShowScreenshotInput(false);
                    onClose();
                }, 1200);
            } else {
                setErrorMessage(res.error || "Failed to submit feedback.");
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to submit feedback.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <MessageSquarePlus size={16} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Feedback</h3>
                                <p className="text-[11px] text-muted-foreground">Private training beta feedback</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {isSuccess ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                            <CheckCircle2 size={40} className="text-emerald-500 animate-in zoom-in-50 duration-300" />
                            <h4 className="text-base font-bold text-foreground">Feedback Received</h4>
                            <p className="text-xs text-muted-foreground">Thank you for helping us improve Goalie Card.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {errorMessage && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium text-center">
                                    {errorMessage}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    How is your experience with Goalie Card?
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="What's working well, what's confusing, or what would you like to see?"
                                    rows={4}
                                    className="w-full bg-secondary/40 border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    autoFocus
                                />
                            </div>

                            {/* Screenshot Input (Optional) */}
                            {showScreenshotInput ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                        <span>Screenshot Link / Note (Optional)</span>
                                        <button
                                            type="button"
                                            onClick={() => { setShowScreenshotInput(false); setScreenshotUrl(''); }}
                                            className="text-[10px] text-muted-foreground hover:text-foreground underline"
                                        >
                                            Remove
                                        </button>
                                    </label>
                                    <input
                                        type="text"
                                        value={screenshotUrl}
                                        onChange={(e) => setScreenshotUrl(e.target.value)}
                                        placeholder="Paste screenshot URL or image description"
                                        className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowScreenshotInput(true)}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-medium py-1"
                                >
                                    <ImageIcon size={14} /> Add optional screenshot link
                                </button>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting || (!body.trim() && !screenshotUrl.trim())}
                                    className="bg-foreground text-background font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            <Send size={13} /> Send Feedback
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
