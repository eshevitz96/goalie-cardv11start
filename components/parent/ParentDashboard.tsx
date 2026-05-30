"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Components
import { ParentHeader } from "@/components/parent/ParentHeader";
import { GoalieCardSection } from "@/components/parent/GoalieCardSection";
import { CoachesCorner } from "@/components/parent/CoachesCorner";
import { EventsSection } from "@/components/parent/EventsSection";
import { PaymentSection } from "@/components/parent/PaymentSection";
import { Reflections } from "@/components/Reflections";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { NotificationBanner } from "@/components/ui/NotificationBanner";

interface ParentDashboardProps {
    goalies: any[];
    userRole: string | null;
    isLoading: boolean;
    notification: any;
    onDismissNotification: () => void;
    onLogout: () => void;
    onRefreshData: () => void;
}

export function ParentDashboard({
    goalies,
    userRole,
    isLoading,
    notification,
    onDismissNotification,
    onLogout,
    onRefreshData
}: ParentDashboardProps) {

    // Local UI State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLiveOverride, setIsLiveOverride] = useState<boolean | null>(null);
    const [showPostGame, setShowPostGame] = useState(false);

    const activeGoalie = goalies[currentIndex];

    // Derived State
    const currentYear = new Date().getFullYear();
    const isAdult = activeGoalie ? (activeGoalie.gradYear && (activeGoalie.gradYear < currentYear)) : false;
    const isPro = isAdult;

    // Live Mode Calculation
    const isLiveCalc = activeGoalie?.events?.some((e: any) => e.date === new Date().toLocaleDateString() && (e.name.includes('Game') || e.name.includes('LIVE')));
    const isLive = (isLiveCalc && isLiveOverride !== false) || isLiveOverride === true;

    if (!activeGoalie) return <div className="min-h-screen bg-black text-white p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-8 lg:gap-12">

                {/* Notification Banner */}
                <NotificationBanner
                    notification={notification}
                    onDismiss={onDismissNotification}
                />

                <ParentHeader activeGoalie={activeGoalie} userRole={userRole} handleLogout={onLogout} />

                {/* Center Content / AI Insights */}
                <div className="md:col-span-2 mb-8">
                    {showPostGame ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-3xl p-6 relative"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-foreground">Post-Game Journal</h3>
                                <button onClick={() => setShowPostGame(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                            </div>
                            <Reflections rosterId={activeGoalie.id} currentUserRole="parent" />
                        </motion.div>
                    ) : (
                        <AiCoachRecommendation
                            lastMood={activeGoalie.latestMood}
                            rosterId={activeGoalie.id}
                            sport={activeGoalie.sport}
                            isLive={isLive}
                            onExit={() => setIsLiveOverride(false)}
                            onComplete={() => { setIsLiveOverride(false); setShowPostGame(true); }}
                        />
                    )}
                </div>

                {/* Left Column: Card & Status */}
                <section className="flex flex-col gap-6 mb-8 md:mb-0">
                    <GoalieCardSection
                        goalies={goalies}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                    />

                    <PaymentSection activeGoalie={activeGoalie} />

                    <EventsSection
                        activeGoalie={activeGoalie}
                        onEventAdded={onRefreshData}
                    />
                </section>

                {/* Right Column: Actions & History */}
                <section className="flex flex-col gap-6">

                    {/* For Pros: Show Reflections/Journal History FIRST */}
                    {isPro && (
                        <motion.div
                            key={`ref-history-${activeGoalie.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Reflections rosterId={activeGoalie.id} currentUserRole="parent" />
                        </motion.div>
                    )}

                    <CoachesCorner activeGoalie={activeGoalie} userRole={userRole} />

                </section>
            </div>
        </main>
    );
}
