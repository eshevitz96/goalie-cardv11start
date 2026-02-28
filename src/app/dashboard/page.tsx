"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Bell } from "lucide-react";

import { useParentData } from "@/hooks/useParentData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/utils/supabase/client";
import { getUserType } from "@/utils/user-type";

import { PaymentList } from "@/components/PaymentList";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { Reflections } from "@/components/Reflections";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import { Button } from "@/components/ui/Button";
import { GoalieCard } from "@/components/GoalieCard";
import TrainingInsights from "@/components/TrainingInsights";
import { GoalsWidget } from "@/components/GoalsWidget";

// Shared Components
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { CoachesCorner } from "@/components/shared/CoachesCorner";

// GoalieCarousel for multi-goalie families
import { GoalieCarousel } from "@/components/parent/GoalieCarousel";

/**
 * Unified Dashboard - replaces both /parent and /goalie portals
 * Role-based features determined by isOwner and isPro flags
 */
export default function Dashboard() {
    const router = useRouter();
    const toast = useToast();
    const auth = useAuth();
    const { goalies, isLoading, error, fetchMyGoalies } = useParentData();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLiveOverride, setIsLiveOverride] = useState<boolean | null>(null);
    const [showProgress, setShowProgress] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [alertNotification, setAlertNotification] = useState<{ id: string, title: string, message: string, type?: string } | null>(null);
    const [logPrefill, setLogPrefill] = useState<string | null>(null);

    const activeGoalie = goalies[currentIndex];
    const { isPro } = getUserType(activeGoalie);

    // Determine if user is account owner (can make purchases)
    // For now: if they're logged in and have goalies, they're the owner
    const isOwner = auth.userId ? true : false;

    // Fetch notifications on mount
    useEffect(() => {
        // Redirect admins to the admin portal if they land here
        if (auth.userRole === 'admin') {
            router.replace('/admin');
            return;
        }

        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) {
                setNotifications(data);
                const urgent = data.find(n => n.type === 'alert');
                if (urgent) setAlertNotification(urgent);
            }
        };
        fetchNotifications();
    }, []);

    // Sync progress toggle default based on paid training status
    useEffect(() => {
        if (activeGoalie) {
            // Visible if goalie has paid lessons or credits
            const hasPaidTraining = (activeGoalie.lesson && activeGoalie.lesson > 0) || (activeGoalie.credits && activeGoalie.credits > 0);
            setShowProgress(!!hasPaidTraining);
        }
    }, [activeGoalie?.id]);

    const handleLogout = async () => {
        if (!confirm("Are you sure you want to sign out?")) return;

        try {
            // 1. Supabase SignOut
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Supabase SignOut Error:", e);
        }

        // 2. Clear Local Storage (All Auth/Session Keys)
        if (typeof window !== 'undefined') {
            const keysToRemove = [
                'activated_id',
                'session_token',
                'user_email',
                'user_role',
                'setup_roster_id',
                'demo_mode'
            ];
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // 3. Clear Middleware Cookie
            document.cookie = 'gc_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        router.push('/login');
    };

    const handleRegister = async (eventId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please sign in to register.");
            return;
        }

        if (!confirm("Confirm registration?")) return;

        const { error } = await supabase.from('registrations').insert({
            goalie_id: user.id,
            event_id: eventId,
            status: 'registered'
        });

        if (error) {
            toast.error("Registration failed: " + error.message);
        } else {
            toast.success("Successfully registered!");
            fetchMyGoalies(false);
        }
    };

    const handleClearNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            toast.error("Failed to clear notifications");
        } else {
            setNotifications([]);
            setAlertNotification(null);
        }
    };

    const handleLogActivity = (activityName: string) => {
        setLogPrefill(activityName);
        // Scroll to journal
        setTimeout(() => {
            const el = document.getElementById('training-journal');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    // Data loading or no goalies found - show loading state to avoid "No Card Found" anxiety
    if (goalies.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                    Synchronizing Goalie Card...
                </p>
            </div>
        );
    }

    if (!activeGoalie) {
        return (
            <div className="min-h-screen bg-background text-foreground p-8 transition-colors duration-300">
                No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link>
            </div>
        );
    }

    // Live Mode Logic
    const isLiveCalc = activeGoalie.events?.some((e: any) =>
        e.date === new Date().toLocaleDateString() && (e.name.includes('Game') || e.name.includes('LIVE'))
    );
    const isLive = (isLiveCalc && isLiveOverride !== false) || isLiveOverride === true;

    return (
        <main className="min-h-screen bg-background p-4 md:p-6 lg:p-8 overflow-x-hidden selection:bg-primary selection:text-white pb-24">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Unified Header */}
                <DashboardHeader
                    activeGoalieName={activeGoalie.name}
                    userRole={auth.userRole || 'goalie'}
                    onLogout={handleLogout}
                    onClearNotifications={handleClearNotifications}
                    notifications={notifications}
                />

                {/* Alert Banner */}
                <AnimatePresence>
                    {alertNotification && alertNotification.type === 'alert' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md"
                        >
                            <div className="p-2 bg-red-500/20 rounded-full text-red-500"><Bell size={16} /></div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground">{alertNotification.title}</h4>
                                <p className="text-xs text-muted-foreground">{alertNotification.message}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setAlertNotification(null)} className="text-muted-foreground hover:text-foreground p-1 h-auto">
                                <span className="sr-only">Dismiss</span>&times;
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* BENTO GRID START */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* HERO SECTION: AI Coach (Left 8) + Profile (Right 4) */}

                    {/* Primary Focus: AI Coach / Post Game */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        <div className="h-full">
                            <AiCoachRecommendation
                                lastMood={activeGoalie.latestMood}
                                rosterId={activeGoalie.id}
                                sport={activeGoalie.sport}
                                isLive={isLive}
                                onExit={() => setIsLiveOverride(false)}
                                onComplete={(focus) => {
                                    setIsLiveOverride(false);
                                    handleLogActivity(focus || "Daily Protocol");
                                }}
                                onLogAction={handleLogActivity}
                                goalieName={activeGoalie.name}
                                isGameday={activeGoalie.events?.some((e: any) => {
                                    const eventDate = new Date(e.rawDate || e.date);
                                    const today = new Date();
                                    return eventDate.toDateString() === today.toDateString();
                                })}
                                nextEvent={activeGoalie.events?.[0] || null}
                            />
                        </div>
                    </div>

                    {/* Sidebar: Profile, Stats, Quick Actions */}
                    <div className="md:col-span-4 flex flex-col gap-6 h-full">

                        {/* Goalie Card Identity */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1 h-full"
                        >
                            {goalies.length > 1 ? (
                                <GoalieCarousel
                                    goalies={goalies}
                                    currentIndex={currentIndex}
                                    setCurrentIndex={setCurrentIndex}
                                    activeGoalie={activeGoalie}
                                    isPro={isPro}
                                    showProgress={showProgress}
                                    setShowProgress={setShowProgress}
                                    sport={activeGoalie.sport}
                                    className="h-full"
                                />
                            ) : (
                                <div className="flex flex-col h-full gap-4">
                                    <GoalieCard
                                        name={activeGoalie.name}
                                        session={activeGoalie.session}
                                        lesson={activeGoalie.lesson}
                                        team={activeGoalie.team}
                                        gradYear={activeGoalie.gradYear}
                                        id={activeGoalie.id}
                                        isPro={isPro}
                                        showProgress={showProgress}
                                        pendingPayment={activeGoalie.pendingPayment}
                                        sport={activeGoalie.sport}
                                        className="flex-1"
                                    />
                                    {/* Display Controls for single goalie */}
                                    <div className="flex justify-center">
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
                                </div>
                            )}
                        </motion.div>

                        {/* Training Progress (If applicable) */}
                        {activeGoalie.coachDetails?.pricing_config?.private && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-card glass rounded-3xl p-6"
                            >
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Training Progress</div>
                                <div className="text-2xl font-black text-foreground mb-4">
                                    <span className="text-primary">{activeGoalie.session}</span> Session{activeGoalie.session !== 1 ? 's' : ''} • <span className="text-primary">{activeGoalie.lesson}</span> Lesson{activeGoalie.lesson !== 1 ? 's' : ''}
                                </div>

                                {activeGoalie.coachDetails.pricing_config.private.type === 'package' && (() => {
                                    const lessonsPerSession = activeGoalie.coachDetails.pricing_config.private.details.lessons_per_session || 1;
                                    const currentLessonInSession = activeGoalie.lesson % lessonsPerSession || lessonsPerSession;
                                    const progress = (currentLessonInSession / lessonsPerSession) * 100;
                                    const needsNewSession = currentLessonInSession === lessonsPerSession;
                                    return (
                                        <div className="space-y-3">
                                            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                                            </div>
                                            {needsNewSession && (
                                                <div className="text-xs text-amber-500 font-bold flex items-center gap-2">
                                                    <span>⚠️</span> Session Complete. Time to renew.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}


                    </div>

                    {/* ROW 2: Three Columns (Events, Journal, Coach) */}

                    {/* Upcoming Events */}
                    <motion.div
                        className="md:col-span-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="bg-card glass rounded-3xl p-1 h-full min-h-[300px] flex flex-col">
                            <div className="flex-1 p-5 pt-2 custom-scrollbar overflow-y-auto">
                                <EventsList
                                    events={activeGoalie.events || []}
                                    onRegister={handleRegister}
                                    onEventAdded={() => fetchMyGoalies(false)}
                                    sport={activeGoalie.sport}
                                    maxItems={3}
                                    goalieId={activeGoalie.id}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Training Journal / Reflections */}
                    <motion.div
                        className="md:col-span-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        id="training-journal"
                    >
                        <div className="bg-card glass rounded-3xl p-1 h-full min-h-[300px] flex flex-col">
                            <div className="flex-1 p-0">
                                <Reflections
                                    rosterId={activeGoalie.id}
                                    currentUserRole={isPro ? 'goalie' : 'parent'}
                                    prefill={logPrefill}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Coach & Actions Stack */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        {/* Targets Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <GoalsWidget rosterId={activeGoalie.id} goalieId={auth.userId || undefined} />
                        </motion.div>

                        {/* Coaches Corner */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            id="coach-corner-section"
                        >
                            <CoachesCorner
                                activeGoalie={activeGoalie}
                                userRole={auth.userRole || 'goalie'}
                                isOwner={isOwner}
                            />
                        </motion.div>

                        {/* Schedule Request */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-card glass rounded-3xl p-6"
                        >
                            <ScheduleRequest
                                rosterId={activeGoalie.id}
                                goalieName={activeGoalie.name}
                                coachName={activeGoalie.coach}
                                coachIds={activeGoalie.coachIds}
                                sport={activeGoalie.sport}
                                onCoachUpdate={() => fetchMyGoalies(false)}
                            />
                        </motion.div>

                    </div>

                </div>
                {/* END BENTO GRID */}

                {/* Full Width Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        {activeGoalie.feedback.length > 0 ? (
                            <PostGameReport report={activeGoalie.feedback} />
                        ) : null}
                    </motion.div>

                </div>

            </div>

            <BetaFeedback rosterId={activeGoalie.id} userId={auth.userId || undefined} userRole={isPro ? 'goalie' : 'parent'} />
            <WhatsNewGuide />
        </main>
    );
}
