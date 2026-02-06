"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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

// New Refactored Components
import { ParentHeader } from "@/components/parent/ParentHeader";
import { GoalieCarousel } from "@/components/parent/GoalieCarousel";
import { CoachesCorner } from "@/components/parent/CoachesCorner";
import { HighlightsSection } from "@/components/parent/HighlightsSection";

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const auth = useAuth();
  const { goalies, isLoading, fetchMyGoalies } = useParentData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiveOverride, setIsLiveOverride] = useState<boolean | null>(null);
  const [showPostGame, setShowPostGame] = useState(false);
  const [showProgress, setShowProgress] = useState(true);

  const activeGoalie = goalies[currentIndex];
  const { isPro } = getUserType(activeGoalie);

  // Sync Toggle Default
  useEffect(() => {
    if (activeGoalie) {
      setShowProgress(!isPro);
    }
  }, [activeGoalie, isPro]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem('activated_id');
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

  // Notifications (simplified for now, logic kept inline or could move to hook/component)
  const [notification, setNotification] = useState<{ id: string, title: string, message: string, type?: string } | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        const urgent = data.find(n => n.type === 'alert');
        if (urgent) setNotification(urgent);
      }
    };
    fetchNotifications();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (goalies.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No Goalie Card Found</h2>
        <p className="text-zinc-400 mb-8">We couldn't find a roster spot linked to this account.</p>
        <Link href="/activate" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Activate My Card
        </Link>
      </div>
    );
  }

  if (!activeGoalie) return <div className="min-h-screen bg-black text-white p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

  // Live Mode Logic
  const isLiveCalc = activeGoalie.events?.some((e: any) => e.date === new Date().toLocaleDateString() && (e.name.includes('Game') || e.name.includes('LIVE')));
  const isLive = (isLiveCalc && isLiveOverride !== false) || isLiveOverride === true;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
      <div className="max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-8 lg:gap-12">

        {/* Notification Banner */}
        {notification && notification.type === 'alert' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 mb-6 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 backdrop-blur-sm"
          >
            <div className="p-2 bg-red-500/20 rounded-full text-red-500"><Bell size={16} /></div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNotification(null)} className="text-muted-foreground hover:text-foreground p-1">
              <span className="sr-only">Dismiss</span>&times;
            </Button>
          </motion.div>
        )}

        <ParentHeader
          activeGoalieName={activeGoalie.name}
          auth={auth}
          onLogout={handleLogout}
        />

        {/* Center Content: AI Coach / Post Game */}
        <div className="md:col-span-2 mb-8">
          {showPostGame ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-foreground">Post-Game Journal</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPostGame(false)} className="text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>
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
              goalieName={activeGoalie.name}
              isGameday={activeGoalie.events?.some((e: any) => {
                const eventDate = new Date(e.rawDate || e.date);
                const today = new Date();
                return eventDate.toDateString() === today.toDateString();
              })}
            />
          )}
        </div>

        {/* Left Column: Card & Status */}
        <section className="flex flex-col gap-6 mb-8 md:mb-0">

          {/* Progress Indicator (Inline for now as it's small logic tied to goalie prop) */}
          {activeGoalie.coachDetails?.pricing_config?.private && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Training Progress</div>
                  <div className="text-lg font-black text-foreground mt-1">
                    <span className="text-primary">{activeGoalie.session}</span> Session{activeGoalie.session !== 1 ? 's' : ''} • <span className="text-primary">{activeGoalie.lesson}</span> Lesson{activeGoalie.lesson !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {/* Bar Logic */}
              {activeGoalie.coachDetails.pricing_config.private.type === 'package' && (() => {
                const lessonsPerSession = activeGoalie.coachDetails.pricing_config.private.details.lessons_per_session || 1;
                const currentLessonInSession = activeGoalie.lesson % lessonsPerSession || lessonsPerSession;
                const progress = (currentLessonInSession / lessonsPerSession) * 100;
                const needsNewSession = currentLessonInSession === lessonsPerSession;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    {needsNewSession && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2">
                        <div className="text-amber-500 mt-0.5">⚠️</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-amber-500">Session Complete</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Time to purchase a new session package.</div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          <motion.div
            key={activeGoalie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GoalieCarousel
              goalies={goalies}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              activeGoalie={activeGoalie}
              isPro={isPro}
              showProgress={showProgress}
              setShowProgress={setShowProgress}
            />
          </motion.div>

          {/* Zero State Nudge */}
          {(!activeGoalie.session || activeGoalie.session <= 0) && (!activeGoalie.lesson || activeGoalie.lesson <= 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between gap-4 mb-6"
            >
              <div>
                <h4 className="text-sm font-bold text-foreground">Out of Sessions?</h4>
                <p className="text-xs text-muted-foreground">Purchase a package to add lessons.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('coach-corner-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary text-black"
              >
                Buy Now
              </Button>
            </motion.div>
          )}

          <motion.div
            key={`events-${activeGoalie.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {activeGoalie.events.length > 0 ? (
              <EventsList
                events={activeGoalie.events}
                onRegister={handleRegister}
                onEventAdded={() => fetchMyGoalies(false)}
                sport={activeGoalie.sport}
                maxItems={3}
              />
            ) : (
              <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">
                No upcoming events.
              </div>
            )}
          </motion.div>
        </section>

        {/* Right Column: Actions & History */}
        <section className="flex flex-col gap-6">

          {/* Pro Reflections */}
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

          {/* Coaches Corner */}
          <motion.div
            key={`coach-info-${activeGoalie.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <CoachesCorner activeGoalie={activeGoalie} userRole={auth.userRole || 'parent'} />
          </motion.div>

          {/* Payment History */}
          <motion.div
            key={`payments-${activeGoalie.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
          >
            <PaymentList rosterId={activeGoalie.id} />
          </motion.div>

          {/* Schedule Request (Non-Pro) */}
          {!isPro && (
            <motion.div
              key={`req-${activeGoalie.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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
          )}

          {/* Post Game History */}
          <motion.div
            key={`feed-${activeGoalie.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {activeGoalie.feedback.length > 0 ? (
              <PostGameReport report={activeGoalie.feedback} />
            ) : (
              !isPro ? <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">No session reports yet.</div> : null
            )}
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <HighlightsSection rosterId={activeGoalie.id} />
          </motion.div>

          {/* Non-Pro Reflections (Bottom) */}
          {!isPro && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="mb-6"
            >
              <Reflections rosterId={activeGoalie.id} currentUserRole="parent" />
            </motion.div>
          )}
        </section>

      </div>
      <BetaFeedback rosterId={activeGoalie.id} userId={undefined} userRole="parent" />
      <WhatsNewGuide />
    </main>
  );
}
