import React from 'react';
import { Medal, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

interface CoachesCornerProps {
    activeGoalie: any;
    userRole: string; // for showing Coach OS link
}

export function CoachesCorner({ activeGoalie, userRole }: CoachesCornerProps) {
    const toast = useToast();

    // Helper for payment
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
                        amount: config.price * 100, // Convert dollars to cents
                        eventName: `${activeGoalie.coach} - ${config.type === 'package' ? config.sessions + ' Session Package' : 'Monthly Subscription'}`,
                        email: userEmail,
                        userId: activeGoalie.id,
                        returnUrl: window.location.origin + '/parent?payment=success',
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

                            {/* PURCHASE ACTION */}
                            <Button
                                onClick={handlePurchase}
                                className="mt-3 w-full bg-foreground text-background py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity h-auto"
                            >
                                Purchase {activeGoalie.coachDetails.pricing_config.private.type === 'package' ? 'Package' : 'Subscription'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    No coach details available. <br />
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:underline mt-1" onClick={() => toast.info("Search for coaches feature coming soon.")}>
                        Find a Coach
                    </Button>
                </div>
            )}

            {/* Coach OS Access - Only for Coaches/Admins */}
            {(userRole === 'coach' || userRole === 'admin') && (
                <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
                    <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div>
                            <div className="font-bold text-sm text-foreground">Are you coaching?</div>
                            <div className="text-xs text-muted-foreground">Build your roster on Coach OS</div>
                        </div>
                        <Link href="/coach" className="bg-foreground text-background text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1">
                            Open Coach OS <Briefcase size={12} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
