import { motion } from "framer-motion";
import { Medal } from "lucide-react";
import Link from "next/link";

interface CoachesCornerProps {
    activeGoalie: any;
    userRole: string | null;
}

export function CoachesCorner({ activeGoalie, userRole }: CoachesCornerProps) {
    if (!activeGoalie) return null;

    return (
        <motion.div
            key={`coach-info-${activeGoalie.id}`}
            id="coach-corner-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="glass rounded-3xl p-6 relative overflow-hidden"
        >
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
                            <button
                                onClick={() => {
                                    if (confirm(`Purchase ${activeGoalie.coachDetails.pricing_config.private.type === 'package' ? 'Package' : 'Subscription'} from ${activeGoalie.coach}?`)) {
                                        alert("Redirecting to Payment Gateway... (Simulation: Success!)");
                                        // Here we would actually call an API to create a payment session
                                    }
                                }}
                                className="mt-3 w-full bg-foreground text-background py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Purchase {activeGoalie.coachDetails.pricing_config.private.type === 'package' ? 'Package' : 'Subscription'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    No coach details available. <br />
                    <button className="text-primary font-bold hover:underline mt-1" onClick={() => alert("Search for coaches feature coming soon.")}>Find a Coach</button>
                </div>
            )}

            {/* Coach OS Access - Only for Coaches/Admins */}
            {(userRole === 'coach' || userRole === 'admin') && (
                <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
                    <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
                        <div>
                            <div className="font-bold text-sm text-foreground">Are you coaching?</div>
                            <div className="text-xs text-muted-foreground">Build your roster on Coach OS</div>
                        </div>
                        <Link href="/coach" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90">
                            Coach Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
