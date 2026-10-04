"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TourStep {
    id: string;
    targetId: string;
    title: string;
    text: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'calendar',
        targetId: 'tour-calendar-tile',
        title: 'Calendar',
        text: 'Your lessons with Elliott show up here. Add your own training around them.'
    },
    {
        id: 'lessons',
        targetId: 'tour-lessons-widget',
        title: 'Lessons',
        text: 'See how many lessons you have left.'
    },
    {
        id: 'training',
        targetId: 'tour-training-tile',
        title: 'Training log',
        text: 'Log your work when you want. Optional.'
    },
    {
        id: 'film',
        targetId: 'tour-film-tile',
        title: 'Film',
        text: 'Your film is private. Tap Share with Coach when you want feedback.'
    },
    {
        id: 'billing',
        targetId: 'tour-billing-target',
        title: 'Billing',
        text: 'Your payment history and card, anytime.'
    }
];

interface FirstLoginTourProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FirstLoginTour({ isOpen, onClose }: FirstLoginTourProps) {
    const { userId } = useAuth();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = TOUR_STEPS[currentStepIndex];

    const updateTargetRect = useCallback(() => {
        if (!isOpen || !step) return;
        const el = document.getElementById(step.targetId);
        if (el) {
            const rect = el.getBoundingClientRect();
            // Scroll element into view if not visible
            if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    const updated = el.getBoundingClientRect();
                    setTargetRect(updated);
                }, 350);
                return;
            }
            setTargetRect(rect);
        } else {
            setTargetRect(null);
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (isOpen) {
            updateTargetRect();
            window.addEventListener('resize', updateTargetRect);
            window.addEventListener('scroll', updateTargetRect, { passive: true });
        }
        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect);
        };
    }, [isOpen, updateTargetRect]);

    const markCompleted = async () => {
        try {
            localStorage.setItem('tour_completed', 'true');
            if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
                await supabase
                    .from('profiles')
                    .update({ tour_completed_at: new Date().toISOString() })
                    .eq('id', userId);
            }
        } catch (err) {
            console.warn('[FirstLoginTour] Failed to persist tour_completed_at:', err);
        }
    };

    const handleSkip = async () => {
        await markCompleted();
        onClose();
    };

    const handleNext = async () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            await markCompleted();
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    if (!isOpen) return null;

    // Calculate popover positioning
    const padding = 8;
    const spotlightBox = targetRect ? {
        top: Math.max(0, targetRect.top - padding),
        left: Math.max(0, targetRect.left - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        borderRadius: 16
    } : null;

    // Determine tooltip placement: top or bottom
    const isBottomSpaceConstrained = targetRect && targetRect.bottom > window.innerHeight - 200;
    const tooltipTop = targetRect
        ? (isBottomSpaceConstrained
            ? Math.max(20, targetRect.top - 180)
            : Math.min(window.innerHeight - 220, targetRect.bottom + 16))
        : window.innerHeight / 2 - 90;

    const tooltipLeft = targetRect
        ? Math.min(Math.max(16, targetRect.left + (targetRect.width / 2) - 160), window.innerWidth - 336)
        : window.innerWidth / 2 - 160;

    return (
        <div className="fixed inset-0 z-[120] pointer-events-auto select-none">
            {/* SVG Mask Dimming with Cutout Spotlight */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {spotlightBox && (
                            <rect
                                x={spotlightBox.left}
                                y={spotlightBox.top}
                                width={spotlightBox.width}
                                height={spotlightBox.height}
                                rx={spotlightBox.borderRadius}
                                ry={spotlightBox.borderRadius}
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.72)"
                    mask="url(#tour-spotlight-mask)"
                />
            </svg>

            {/* Spotlight Outline Border */}
            {spotlightBox && (
                <div
                    className="absolute border-2 border-white/60 pointer-events-none transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.0)]"
                    style={{
                        top: `${spotlightBox.top}px`,
                        left: `${spotlightBox.left}px`,
                        width: `${spotlightBox.width}px`,
                        height: `${spotlightBox.height}px`,
                        borderRadius: `${spotlightBox.borderRadius}px`
                    }}
                />
            )}

            {/* Floating Minimal Tooltip Card */}
            <div
                className="absolute z-10 w-[320px] bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
                style={{
                    top: `${tooltipTop}px`,
                    left: `${tooltipLeft}px`
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                        Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                    </span>
                    <button
                        onClick={handleSkip}
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Skip tour"
                        aria-label="Skip tour"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-1 mb-4">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                        {step.title}
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                        {step.text}
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <button
                        onClick={handleSkip}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Skip
                    </button>

                    <div className="flex items-center gap-1.5">
                        {currentStepIndex > 0 && (
                            <button
                                onClick={handlePrev}
                                className="p-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                                aria-label="Previous step"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all"
                        >
                            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
