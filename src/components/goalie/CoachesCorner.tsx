import React from 'react';
import { Medal } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface CoachesCornerProps {
    activeGoalie: any;
}

export function CoachesCorner({ activeGoalie }: CoachesCornerProps) {
    const toast = useToast();

    const handleRequestAccess = () => {
        if (confirm("Request Access to Coach OS Card? Administrators will review your request.")) {
            toast.success("Request Sent! Pending Admin Confirmation.");
            // Future: triggers DB insert to requests table
        }
    };

    return (
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Medal size={64} className="text-foreground" />
            </div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2 mb-4 relative z-10">
                <span className="text-foreground">★</span> Coaches Corner
            </h3>

            {activeGoalie.coachDetails ? (
                <div className="space-y-4 relative z-10">
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Assigned Coach</div>
                        <div className="font-bold text-foreground text-lg">{activeGoalie.coach}</div>
                    </div>

                    {activeGoalie.coachDetails.philosophy && (
                        <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Philosophy</div>
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                "{activeGoalie.coachDetails.philosophy}"
                            </p>
                        </div>
                    )}

                    {/* Pricing Info shown to goalies just for awareness, or maybe hidden? Keeping for now logic match. */}
                    {activeGoalie.coachDetails.pricing_config?.private && (
                        <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Private Engagement</div>
                            {activeGoalie.coachDetails.pricing_config.private.type === 'package' ? (
                                <div className="text-sm font-medium">
                                    <span className="text-foreground">{activeGoalie.coachDetails.pricing_config.private.details.lessons_per_session} Lessons</span> = 1 Session <span className="text-muted-foreground">(${activeGoalie.coachDetails.pricing_config.private.details.cost})</span>
                                </div>
                            ) : (
                                <div className="text-sm font-medium">
                                    Subscription: <span className="text-foreground">{activeGoalie.coachDetails.pricing_config.private.details.sessions_per_month} Sessions/mo</span> <span className="text-muted-foreground">(${activeGoalie.coachDetails.pricing_config.private.details.cost}/mo)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">No coach details available.</div>
            )}

            <div className="mt-4 pt-4 border-t border-border/50 border-r-0 border-l-0 border-b-0">
                <button
                    onClick={handleRequestAccess}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white py-3 rounded-xl transition-all border-none"
                >
                    <Medal size={14} /> Add Coach OS Card
                </button>
            </div>
        </div>
    );
}
