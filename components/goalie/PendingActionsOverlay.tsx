'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import TextInput from '@/components/calendar/TextInput';
import { Loader2, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingActionsOverlayProps {
    goalieProfileId: string;
    publicUserId?: string;
    rosterId?: string;
    userRole: string;
    hasWeeklyIntention: boolean;
    onClose: () => void;
    onRefreshDashboard: () => void;
}

type Step = 'loading' | 'lesson_confirm' | 'weekly_intention' | 'success';

export function PendingActionsOverlay({
    goalieProfileId,
    publicUserId,
    rosterId,
    userRole,
    hasWeeklyIntention,
    onClose,
    onRefreshDashboard
}: PendingActionsOverlayProps) {
    const [step, setStep] = useState<Step>('loading');
    const [pendingLessons, setPendingLessons] = useState<any[]>([]);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

    // Form inputs
    const [lessonTakeaway, setLessonTakeaway] = useState('');
    const [focusText, setFocusText] = useState('');

    // Load/Saving state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const res = await fetch('/api/lessons/pending');
                const data = await res.json();
                if (data.success && data.pending && data.pending.length > 0) {
                    setPendingLessons(data.pending);
                    setStep('lesson_confirm');
                } else if (!hasWeeklyIntention && (userRole === 'goalie' || userRole === 'parent')) {
                    setStep('weekly_intention');
                } else {
                    onClose(); // Nothing pending, close overlay
                }
            } catch (err) {
                console.error('Error fetching pending overlay actions:', err);
                if (!hasWeeklyIntention && (userRole === 'goalie' || userRole === 'parent')) {
                    setStep('weekly_intention');
                } else {
                    onClose();
                }
            }
        };

        fetchPending();
    }, [hasWeeklyIntention, userRole, onClose]);

    // Handle confirming a lesson log
    const handleConfirmLesson = async () => {
        const activeLesson = pendingLessons[currentLessonIndex];
        if (!activeLesson) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/lessons/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: activeLesson.id,
                    takeaway: lessonTakeaway
                })
            });

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to confirm lesson');
            }

            setLessonTakeaway('');
            onRefreshDashboard(); // Update balance on dashboard instantly

            // Go to next lesson if multiple are pending
            if (currentLessonIndex < pendingLessons.length - 1) {
                setCurrentLessonIndex(currentLessonIndex + 1);
                setStep('lesson_confirm');
            } else if (!hasWeeklyIntention) {
                setStep('weekly_intention');
            } else {
                setStep('success');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Save weekly intention
    const handleSaveIntention = async () => {
        const targetUserId = publicUserId;
        if (!focusText.trim() || !targetUserId) {
            setError("No goalie profile ID linked. Please contact support.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Get Monday of current week
            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(today);
            monday.setDate(today.getDate() - daysSinceMon);
            monday.setHours(0, 0, 0, 0);
            const monStr = monday.toISOString().split('T')[0];

            // Check if intention exists for this week
            const { data: existing } = await supabase
                .from('weekly_intentions')
                .select('id')
                .eq('user_id', targetUserId)
                .eq('week_start_date', monStr)
                .maybeSingle();

            let upsertErr;
            if (existing) {
                // Update
                const { error } = await supabase
                    .from('weekly_intentions')
                    .update({
                        intention_text: focusText.trim()
                    })
                    .eq('id', existing.id);
                upsertErr = error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('weekly_intentions')
                    .insert({
                        user_id: targetUserId,
                        week_start_date: monStr,
                        intention_text: focusText.trim()
                    });
                upsertErr = error;
            }

            if (upsertErr) throw upsertErr;

            setStep('success');
            onRefreshDashboard();
        } catch (err: any) {
            console.error('Error saving intention:', err);
            setError(err.message || 'Failed to save weekly intention.');
        } finally {
            setSaving(false);
        }
    };

    if (step === 'loading') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center text-foreground">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-xs text-muted-foreground mt-3 font-bold uppercase tracking-wider">Loading pending actions...</span>
            </div>
        );
    }

    const currentLesson = pendingLessons[currentLessonIndex];
    const lessonDateStr = currentLesson ? new Date(currentLesson.lesson_date).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) : '';

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col px-6 pt-4 pb-8 overflow-y-auto w-full text-foreground">
            
            {/* Header: Skip button */}
            <div className="flex justify-end w-full max-w-lg mx-auto">
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border hover:bg-secondary/80 text-[10px] font-black uppercase tracking-wider text-foreground transition-all cursor-pointer rounded-full"
                >
                    Skip to Dashboard
                    <X size={12} />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-8">
                <AnimatePresence mode="wait">
                    
                    {step === 'lesson_confirm' && currentLesson && (
                        <motion.div
                            key="lesson_confirm"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="w-full flex flex-col justify-center"
                        >
                            <div className="mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                    Lesson {currentLesson.lesson_number} • Session {currentLesson.session_number}
                                </span>
                            </div>
                            
                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight mb-4 text-foreground">
                                Confirm your lesson from {lessonDateStr}
                            </h1>

                            {/* Coach's Takeaway context if present */}
                            {currentLesson.coach_takeaway && (
                                <div className="glass p-5 rounded-2xl border border-border mb-8 relative overflow-hidden bg-card shadow-sm">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                    <p className="m-0 text-[9px] font-black uppercase tracking-widest text-primary mb-1">
                                        Coach focus: {currentLesson.coach_focus_area || 'General Training'}
                                    </p>
                                    <p className="m-0 text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mb-2">Coach's takeaway:</p>
                                    <p className="m-0 text-sm font-semibold text-foreground/80 italic leading-relaxed">
                                        "{currentLesson.coach_takeaway}"
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground mb-6 font-medium">
                                What clicked? What was hard? Write a brief takeaway to complete confirmation.
                            </p>

                            <TextInput
                                value={lessonTakeaway}
                                onChange={setLessonTakeaway}
                                placeholder="Your lesson takeaway..."
                                maxLength={250}
                                multiline={true}
                                autoFocus={true}
                            />

                            {error && (
                                <p className="text-red-600 bg-red-500/5 border border-red-500/10 text-xs flex items-center gap-2 p-3 rounded-xl font-bold mt-4">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={handleConfirmLesson}
                                    disabled={saving || !lessonTakeaway.trim()}
                                    className="px-6 py-3.5 bg-primary text-white font-extrabold rounded-2xl text-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] transition-all shadow-md animate-in fade-in duration-200"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin text-white" />}
                                    {saving ? 'Confirming...' : 'Confirm Lesson'}
                                    {!saving && <ChevronRight size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'weekly_intention' && (
                        <motion.div
                            key="weekly_intention"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="w-full flex flex-col justify-center"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2 block">
                                Weekly Setup
                            </span>
                            
                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight mb-2 text-foreground">
                                What's your primary focus this week?
                            </h1>
                            <p className="text-sm text-muted-foreground mb-8 font-medium">
                                Set one specific, mechanical focus for your training and games.
                            </p>

                            <TextInput
                                value={focusText}
                                onChange={setFocusText}
                                placeholder="One specific thing..."
                                maxLength={100}
                                autoFocus={true}
                            />

                            {error && (
                                <p className="text-red-600 bg-red-500/5 border border-red-500/10 text-xs flex items-center gap-2 p-3 rounded-xl font-bold mt-4">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end mt-10">
                                <button
                                    onClick={handleSaveIntention}
                                    disabled={saving || !focusText.trim()}
                                    className="px-6 py-3.5 bg-primary text-white font-extrabold rounded-2xl text-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] transition-all shadow-md animate-in fade-in duration-200"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin text-white" />}
                                    {saving ? 'Saving...' : 'Set Focus'}
                                    {!saving && <ChevronRight size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/20">
                                <CheckCircle2 size={36} />
                            </div>
                            
                            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2">
                                You're all set!
                            </h1>
                            <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed font-medium">
                                Action item complete. Let's get back to the work.
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-primary text-white font-extrabold uppercase tracking-widest text-xs rounded-2xl active:scale-95 hover:scale-[1.02] transition-all cursor-pointer shadow-md"
                            >
                                Enter Dashboard
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
