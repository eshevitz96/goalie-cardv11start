"use client";

import React, { useState } from 'react';
import { Medal, Briefcase, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface CoachesCornerProps {
    activeGoalie: any;
    userRole?: string;
    isOwner?: boolean; // Can purchase packages
}

/**
 * Unified Coaches Corner component
 * Shows coach info, pricing, and purchase options based on role
 */
export function CoachesCorner({ activeGoalie, userRole = 'goalie', isOwner = false }: CoachesCornerProps) {
    const toast = useToast();
    const [isLoggingLesson, setIsLoggingLesson] = useState(false);

    const handleLogLesson = async () => {
        if (!activeGoalie.id) return;
        if (!confirm(`Log 1 lesson for ${activeGoalie.name}? This will deduct 1 credit.`)) return;
        setIsLoggingLesson(true);
        try {
            const { logLessonCredit } = await import('@/app/actions/credits');
            const result = await logLessonCredit({
                rosterId: activeGoalie.id,
                coachName: activeGoalie.coach,
            });
            if (!result.success) {
                toast.error(result.error || 'Failed to log lesson');
            } else {
                toast.success(`Lesson logged ✅  — ${result.newBalance} credits remaining`);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoggingLesson(false);
        }
    };

    // Purchase handler - only for account owners
    const handlePurchase = async () => {
        if (!activeGoalie.coachDetails?.pricing_config?.private) return;

        const config = activeGoalie.coachDetails.pricing_config.private;
        const typeLabel = config.type === 'package' ? 'Package' : 'Subscription';

        if (confirm(`Purchase ${typeLabel} from ${activeGoalie.coach}?`)) {
            try {
                const userEmail = localStorage.getItem('user_email') || '';

                const response = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: config.price * 100,
                        eventName: `${activeGoalie.coach} - ${config.type === 'package' ? config.sessions + ' Session Package' : 'Monthly Subscription'}`,
                        email: userEmail,
                        userId: activeGoalie.id,
                        returnUrl: window.location.origin + '/dashboard?payment=success',
                        mode: config.type === 'subscription' ? 'subscription' : 'payment'
                    })
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    toast.error('Payment initialization failed');
                }
            } catch (error) {
                console.error('Payment error:', error);
                toast.error('Payment failed. Please try again.');
            }
        }
    };

    // ... (previous code)

    // Request coach access - for goalies wanting their own Coach OS
    const handleRequestAccess = () => {
        if (confirm("Request Access to Coach OS Card? Administrators will review your request.")) {
            toast.success("Request Sent! Pending Admin Confirmation.");
        }
    };

    const handleAddVideo = () => {
        const url = prompt("Enter Video URL (YouTube/Insta):"); // Simple prompt for now
        if (url) {
            // Import supabase if not already imported or use from props if passed?
            // better to import it at top of file.
            // We need to ensure supabase is imported.
            import('@/utils/supabase/client').then(({ supabase }) => {
                supabase.from('highlights').insert({
                    roster_id: activeGoalie.id,
                    url: url,
                    description: "Video Upload"
                }).then(({ error }) => {
                    if (error) toast.error("Error: " + error.message);
                    else toast.success("Highlight Added!");
                });
            });
        }
    };

    return (
        <div id="coach-corner-section" className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Medal size={64} className="text-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2 mb-4 relative z-10">
                <span className="text-foreground">★</span> Coaches Corner
            </h3>

            {activeGoalie.coachDetails ? (
                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Coach</div>
                            <div className="font-bold text-foreground text-lg truncate max-w-[200px]">{activeGoalie.coach}</div>
                        </div>
                        {/* Reduced clutter by hiding philosophy unless expanded or just shorter */}
                    </div>

                    {/* Pricing - Simplified */}
                    {activeGoalie.coachDetails.pricing_config?.private && (
                        <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Engagement</div>
                                <div className="text-xs font-bold text-primary">
                                    {activeGoalie.coachDetails.pricing_config.private.type === 'package' ? 'Package' : 'Subscription'}
                                </div>
                            </div>

                            {activeGoalie.coachDetails.pricing_config.private.type === 'package' ? (
                                <div className="text-sm font-medium">
                                    {activeGoalie.coachDetails.pricing_config.private.details.lessons_per_session} Lessons = 1 Session
                                </div>
                            ) : (
                                <div className="text-sm font-medium">
                                    {activeGoalie.coachDetails.pricing_config.private.details.sessions_per_month} Sessions/mo
                                </div>
                            )}

                            {/* Purchase button - only for account owners */}
                            {isOwner && (
                                <Button
                                    onClick={handlePurchase}
                                    className="mt-2 w-full bg-foreground text-background py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity h-auto"
                                >
                                    Purchase
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground mb-4">
                    No coach assigned.
                </div>
            )}

            {/* Highlights Section - Integrated */}
            <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Highlights</div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddVideo}
                        className="text-xs text-primary font-bold hover:text-primary/80 h-auto p-0"
                    >
                        + Add Video
                    </Button>
                </div>
                {/* 
                  Ideally we list highlights here, but for now just the functional button as per user request.
                  We could show a count or latest 1.
                */}
                <div className="text-xs text-muted-foreground italic">
                    Share game clips for review.
                </div>
            </div>

            {/* Log Lesson — Coach/Admin only */}
            {(userRole === 'coach' || userRole === 'admin') && (
                <div className="mt-4 pt-4 border-t border-border/50 relative z-10 space-y-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Lesson Tracking</div>
                    <Button
                        onClick={handleLogLesson}
                        disabled={isLoggingLesson}
                        className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl py-2 text-xs font-black uppercase tracking-wide transition-all"
                    >
                        {isLoggingLesson ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                        Log Lesson (−1 credit)
                    </Button>
                    <Link href="/coach" className="flex items-center justify-between text-xs font-bold text-foreground hover:text-primary transition-colors mt-2">
                        <span>Open Coach OS</span>
                        <Briefcase size={12} />
                    </Link>
                </div>
            )}
        </div>
    );
}
