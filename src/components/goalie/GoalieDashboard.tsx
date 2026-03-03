"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Components
import { GoalieCard } from "@/components/GoalieCard";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { Reflections } from "@/components/Reflections";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import TrainingInsights from "@/components/TrainingInsights";
import { GoalsWidget } from "@/components/GoalsWidget";
import { Button } from "@/components/ui/Button";

// New Components
import { GoalieHeader } from "@/components/goalie/GoalieHeader";
import { CoachesCorner } from "@/components/goalie/CoachesCorner";
import { HighlightsSection } from "@/components/goalie/HighlightsSection";
import { NotificationBanner } from "@/components/ui/NotificationBanner";
import { MonthlyCreditsWidget } from "@/components/goalie/MonthlyCreditsWidget";

// Utils
import { isPastSeniorSeason } from "@/utils/role-logic";

interface GoalieDashboardProps {
    goalies: any[];
    userRole: string | null;
    userId: string | null;
    notification: any;
    notifications: any[];
    onDismissNotification: () => void;
    onLogout: () => void;
    onRegister: (eventId: string, goalieId: string) => void;
    onLogAction: (actionName: string) => void;
    journalPrefill: string | null;
    onCoachUpdate: () => void;
}

export function GoalieDashboard({
    goalies,
    userRole,
    userId,
    notification,
    notifications,
    onDismissNotification,
    onLogout,
    onRegister,
    onLogAction,
    journalPrefill,
    onCoachUpdate
}: GoalieDashboardProps) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const [expandedBlock, setExpandedBlock] = useState<'journal' | 'notes' | null>(null);
    const [showProgress, setShowProgress] = useState(true);
    const [showPlan, setShowPlan] = useState(false);

    const activeGoalie = goalies[currentIndex];

    // Pro Logic for Default Toggle
    const isPro = activeGoalie && activeGoalie.gradYear && (isPastSeniorSeason(activeGoalie.gradYear) || activeGoalie.team?.toLowerCase().includes('blue') || activeGoalie.team?.toLowerCase().includes('pro'));

    useEffect(() => {
        if (activeGoalie) {
            setShowProgress(!isPro);
            setShowPlan(false); // collapse plan when switching cards
        }
    }, [activeGoalie?.id, isPro]);

    // Handle internal logic for expanding journal when log action is triggered
    useEffect(() => {
        if (journalPrefill) {
            setExpandedBlock('journal');
        }
    }, [journalPrefill]);

    if (!activeGoalie) return <div className="min-h-screen bg-background text-foreground p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

    return (
        <main className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-8 lg:gap-12">

                {/* Notification Banner */}
                <NotificationBanner
                    notification={notification}
                    onDismiss={onDismissNotification}
                />

                <GoalieHeader
                    activeGoalieName={activeGoalie.name}
                    onLogout={onLogout}
                    notifications={notifications}
                />

                {/* Performance Directive */}
                <div className="md:col-span-2 mb-6">
                    <button
                        onClick={() => setShowPlan(p => !p)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 border border-border hover:bg-muted transition-colors text-sm font-bold text-foreground"
                    >
                        <span>🤖 Today's Training Plan</span>
                        <span className="text-xs text-muted-foreground font-semibold">{showPlan ? 'Hide Plan ▲' : 'Show Plan ▼'}</span>
                    </button>

                    {showPlan && (
                        <div className="mt-3">
                            <AiCoachRecommendation
                                lastMood={activeGoalie.latestMood}
                                rosterId={activeGoalie.id}
                                sport={activeGoalie.sport}
                                onLogAction={onLogAction}
                                goalieName={activeGoalie.name}
                                isGameday={activeGoalie.events?.some((e: any) => {
                                    const eventDate = new Date(e.rawDate || e.date);
                                    const today = new Date();
                                    return eventDate.toDateString() === today.toDateString();
                                })}
                            />
                        </div>
                    )}
                </div>

                {/* Pro Insights (Admin/Coach Only) */}
                {(userRole === 'admin' || userRole === 'coach') && (
                    <div className="md:col-span-2 mb-8">
                        <TrainingInsights />
                    </div>
                )}

                {/* Expandable Journal & Notes */}
                <section className="md:col-span-2 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {expandedBlock !== 'notes' && (
                                <motion.div
                                    layout
                                    className={`${expandedBlock === 'journal' ? 'md:col-span-2' : 'md:col-span-1'} transition-all duration-500 ease-spring`}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                >
                                    <Reflections
                                        rosterId={activeGoalie.id}
                                        isExpanded={expandedBlock === 'journal'}
                                        onToggleExpand={() => setExpandedBlock(prev => prev === 'journal' ? null : 'journal')}
                                        prefill={journalPrefill}
                                    />
                                </motion.div>
                            )}

                            {expandedBlock !== 'journal' && (
                                <motion.div
                                    layout
                                    className={`${expandedBlock === 'notes' ? 'md:col-span-2' : 'md:col-span-1'} transition-all duration-500 ease-spring`}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                >
                                    <PostGameReport
                                        report={activeGoalie.feedback}
                                        isExpanded={expandedBlock === 'notes'}
                                        onToggleExpand={() => setExpandedBlock(prev => prev === 'notes' ? null : 'notes')}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Left Column: Card & Status */}
                <section className="flex flex-col gap-6 mb-8 md:mb-0">
                    <motion.div
                        key={activeGoalie.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="relative group">
                            <GoalieCard
                                name={activeGoalie.name}
                                session={activeGoalie.session}
                                lesson={activeGoalie.lesson}
                                team={activeGoalie.team}
                                gradYear={activeGoalie.gradYear}
                                height={activeGoalie.height}
                                weight={activeGoalie.weight}
                                catchHand={activeGoalie.catchHand}
                                showProgress={showProgress}
                                credits={activeGoalie.credits}
                                className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
                            />

                            {/* Display Controls */}
                            <div className="flex justify-center mt-4 mb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowProgress(!showProgress)}
                                    className="gap-2 bg-secondary/30 rounded-full"
                                >
                                    {showProgress ? <span className="text-primary">●</span> : <span className="text-muted-foreground">○</span>}
                                    {showProgress ? "Hide Activity Counts" : "Show Activity Counts"}
                                </Button>
                            </div>

                            {/* Switcher */}
                            {goalies.length > 1 && (
                                <>
                                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentIndex(prev => prev === 0 ? goalies.length - 1 : prev - 1)}
                                            className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                    </div>
                                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentIndex(prev => prev === goalies.length - 1 ? 0 : prev + 1)}
                                            className="p-1.5 bg-card/80 rounded-full backdrop-blur-sm border border-border shadow-xl hover:bg-card transform hover:scale-110 transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>

                                    <div className="flex justify-center gap-2 mt-4">
                                        {goalies.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground"}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Monthly Credits Widget */}
                    {activeGoalie.credits > 0 && (
                        <MonthlyCreditsWidget
                            credits={activeGoalie.credits}
                            coachName={activeGoalie.coach !== 'Assigned Coach' ? activeGoalie.coach : undefined}
                        />
                    )}

                    {/* Events */}
                    <motion.div
                        key={`events-${activeGoalie.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <EventsList
                            events={activeGoalie.events || []}
                            onRegister={(eventId) => onRegister(eventId, activeGoalie.id)}
                            hidePayments={true}
                            maxItems={3}
                            goalieId={activeGoalie.id}
                        />
                    </motion.div>
                </section>

                {/* Right Column */}
                <section className="flex flex-col gap-6">
                    <GoalsWidget rosterId={activeGoalie.id} goalieId={userId || undefined} />

                    {/* Logic Reorder based on Pro status */}
                    {isPro ? (
                        <>
                            <HighlightsSection rosterId={activeGoalie.id} />
                            <div className="opacity-80 scale-95 origin-top">
                                <CoachesCorner activeGoalie={activeGoalie} />
                                <ScheduleRequest
                                    rosterId={activeGoalie.id}
                                    goalieName={activeGoalie.name}
                                    coachName={activeGoalie.coach}
                                    coachIds={activeGoalie.coachIds}
                                    sport={activeGoalie.sport}
                                    onCoachUpdate={onCoachUpdate}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <CoachesCorner activeGoalie={activeGoalie} />
                            <ScheduleRequest
                                rosterId={activeGoalie.id}
                                goalieName={activeGoalie.name}
                                coachName={activeGoalie.coach}
                                coachIds={activeGoalie.coachIds}
                                sport={activeGoalie.sport}
                                onCoachUpdate={onCoachUpdate}
                            />
                            <HighlightsSection rosterId={activeGoalie.id} />
                        </>
                    )}
                </section>

            </div>
            <BetaFeedback rosterId={activeGoalie.id} userId={userId || undefined} userRole="goalie" />
            <WhatsNewGuide />
        </main>
    );
}
