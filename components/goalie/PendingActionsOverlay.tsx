'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { formatCalendarDate } from '@/lib/training/dateHelpers';

interface PendingActionsOverlayProps {
    goalieProfileId: string;
    publicUserId?: string;
    rosterId?: string;
    userRole: string;
    hasWeeklyIntention?: boolean;
    onClose: () => void;
    onRefreshDashboard: () => void;
}

/**
 * Non-blocking, dismissible inline dashboard card for confirming a single pending lesson.
 * Never blocks or takes over the screen, and shows at most one pending confirmation at a time.
 */
export function PendingActionsOverlay({
    onClose,
    onRefreshDashboard
}: PendingActionsOverlayProps) {
    const [pendingLesson, setPendingLesson] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [lessonTakeaway, setLessonTakeaway] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/lessons/pending');
                const data = await res.json();
                if (cancelled) return;

                if (data.success && Array.isArray(data.pending) && data.pending.length > 0) {
                    // Show at most one pending confirmation at a time (skip any dismissed in this session)
                    const firstUndismissed = data.pending.find((item: any) => {
                        try {
                            return sessionStorage.getItem(`dismissed_lesson_confirm_${item.id}`) !== 'true';
                        } catch {
                            return true;
                        }
                    });
                    if (firstUndismissed) {
                        setPendingLesson(firstUndismissed);
                    } else {
                        onClose();
                    }
                } else {
                    onClose();
                }
            } catch (err) {
                console.error('Error fetching pending lesson confirmation:', err);
                if (!cancelled) onClose();
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchPending();
        return () => {
            cancelled = true;
        };
    }, [onClose]);

    const handleDismiss = () => {
        if (pendingLesson?.id) {
            try {
                sessionStorage.setItem(`dismissed_lesson_confirm_${pendingLesson.id}`, 'true');
            } catch {
                // ignore storage errors
            }
        }
        setPendingLesson(null);
        onClose();
    };

    const handleConfirmLesson = async () => {
        if (!pendingLesson) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/lessons/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: pendingLesson.id,
                    takeaway: lessonTakeaway.trim()
                })
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to confirm lesson');
            }

            setConfirmed(true);
            onRefreshDashboard();
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !pendingLesson) {
        return null;
    }

    const lessonDateStr = formatCalendarDate(pendingLesson.lesson_date, {
        month: 'short',
        day: 'numeric'
    });

    if (confirmed) {
        return (
            <div className="bg-card border border-emerald-500/30 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="m-0 text-sm font-bold text-foreground">Lesson confirmed</p>
                        <p className="m-0 text-xs text-muted-foreground">Your takeaway has been saved to your log.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm relative">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-1">
                        Lesson {pendingLesson.lesson_number} • Session {pendingLesson.session_number}
                    </span>
                    <h3 className="m-0 text-lg md:text-xl font-bold tracking-tight text-foreground">
                        Confirm your lesson from {lessonDateStr}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                    title="Dismiss for now"
                    aria-label="Dismiss lesson confirmation"
                >
                    <X size={16} />
                </button>
            </div>

            {pendingLesson.coach_takeaway && (
                <div className="p-3.5 rounded-2xl border border-border mb-4 bg-muted/30">
                    <p className="m-0 text-[9px] font-black uppercase tracking-widest text-foreground/80 mb-1">
                        Coach focus: {pendingLesson.coach_focus_area || 'General Training'}
                    </p>
                    <p className="m-0 text-xs font-medium text-foreground/80 italic leading-relaxed">
                        &ldquo;{pendingLesson.coach_takeaway}&rdquo;
                    </p>
                </div>
            )}

            <div className="space-y-3">
                <textarea
                    value={lessonTakeaway}
                    onChange={(e) => {
                        if (e.target.value.length <= 250) setLessonTakeaway(e.target.value);
                    }}
                    placeholder="What clicked? Write a brief takeaway to confirm..."
                    rows={2}
                    className="w-full bg-input border border-border focus:border-foreground rounded-xl px-3.5 py-2.5 text-foreground text-sm font-medium focus:outline-none transition-colors placeholder:text-muted-foreground resize-none"
                />

                {error && (
                    <p className="m-0 text-red-500 bg-red-500/5 border border-red-500/10 text-xs p-2.5 rounded-xl font-semibold">
                        {error}
                    </p>
                )}

                <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {lessonTakeaway.length}/250
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            Later
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmLesson}
                            disabled={saving || !lessonTakeaway.trim()}
                            className="px-4 py-2 bg-foreground text-background font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                        >
                            {saving && <Loader2 size={14} className="animate-spin text-background" />}
                            <span>{saving ? 'Confirming...' : 'Confirm Lesson'}</span>
                            {!saving && <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
