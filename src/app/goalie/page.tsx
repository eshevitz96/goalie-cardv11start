"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Bell } from "lucide-react";

import { useGoalieData } from "@/hooks/useGoalieData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/utils/supabase/client";
import { isPastSeniorSeason } from "@/utils/role-logic";

import { ScheduleRequest } from "@/components/ScheduleRequest";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import TrainingInsights from "@/components/TrainingInsights";
import { GoalsWidget } from "@/components/GoalsWidget";
import { Button } from "@/components/ui/Button";

// New Components
import { GoalieHeader } from "@/components/goalie/GoalieHeader";
import { CoachesCorner } from "@/components/shared/CoachesCorner";
// HighlightsSection removed (integrated into CoachesCorner)
import { SessionCarousel } from "@/components/goalie/SessionCarousel";
import { ReflectionSection } from "@/components/goalie/ReflectionSection";
import { GoalieDashboard } from "@/components/goalie/GoalieDashboard";
import { transformGoalieData } from "@/lib/transformers/goalie-transformers";

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const { userId, userRole, loading: authLoading } = useAuth();
  const { goalies: rawGoalies, isLoading, fetchMyGoalies } = useGoalieData();

  // Apply Transformation Layer
  const goalies = rawGoalies.map(transformGoalieData).filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedBlock, setExpandedBlock] = useState<'journal' | 'notes' | null>(null);
  const [journalPrefill, setJournalPrefill] = useState<string | null>(null);

  // Notification Handling
  const [notification, setNotification] = useState<{ id: string, title: string, message: string, type?: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setNotifications(data);
        const urgent = data.find(n => n.type === 'alert');
        if (urgent) setNotification(urgent);
      }
    };
    fetchNotifications();
  }, []);

  const activeGoalie = goalies[currentIndex];

  // Pro Logic for Default Toggle
  const isPro = activeGoalie && activeGoalie.gradYear && (isPastSeniorSeason(activeGoalie.gradYear) || activeGoalie.team?.toLowerCase().includes('blue') || activeGoalie.team?.toLowerCase().includes('pro'));

  const handleLogAction = (actionName: string) => {
    setExpandedBlock('journal');
    setJournalPrefill(actionName);
    setTimeout(() => setJournalPrefill(null), 1000);
  };





  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem('activated_id');
    router.push('/login');
  };

  const handleRegister = async (eventId: string) => {
    const activeRosterId = activeGoalie?.id;
    if (!activeRosterId) {
      toast.error("No active card selected.");
      return;
    }

    if (!confirm("Confirm registration?")) return;

    try {
      const { registerForEvent } = await import("@/app/actions");
      const result = await registerForEvent(activeRosterId, eventId);

      if (!result.success) {
        toast.error("Registration Failed: " + result.error);
      } else {
        toast.success("Successfully registered!");
        fetchMyGoalies(false);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  if (isLoading || authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (goalies.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No Goalie Card Found</h2>
        <p className="text-muted-foreground mb-8">We couldn't find a roster spot linked to this account.</p>
        <Link href="/activate" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Activate My Card
        </Link>
      </div>
    );
  }

  if (!activeGoalie) return <div className="min-h-screen bg-background text-foreground p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

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

        <GoalieHeader
          activeGoalieName={activeGoalie.name}
          onLogout={handleLogout}
          notifications={notifications}
        />

        {/* Performance Directive */}
        <div className="md:col-span-2 mb-6">
          <AiCoachRecommendation
            lastMood={activeGoalie.latestMood}
            rosterId={activeGoalie.id}
            sport={activeGoalie.sport}
            onLogAction={handleLogAction}
            goalieName={activeGoalie.name}
            isGameday={activeGoalie.events?.some((e: any) => {
              const eventDate = new Date(e.rawDate || e.date);
              const today = new Date();
              return eventDate.toDateString() === today.toDateString();
            })}
            nextEvent={activeGoalie.events && activeGoalie.events.length > 0 ? activeGoalie.events[0] : null}
          />
        </div>

        {/* Pro Insights (Admin/Coach Only) */}
        {(userRole === 'admin' || userRole === 'coach') && (
          <div className="md:col-span-2 mb-8">
            <TrainingInsights />
          </div>
        )}

        {/* Expandable Journal & Notes */}
        <section className="md:col-span-2 mb-8">
          <ReflectionSection
            rosterId={activeGoalie.id}
            feedback={activeGoalie.feedback}
            journalPrefill={journalPrefill}
            expandedBlock={expandedBlock}
            onExpandedBlockChange={setExpandedBlock}
          />
        </section>

        {/* Left Column: Card & Status */}
        <section className="flex flex-col gap-6 mb-8 md:mb-0">
          <SessionCarousel
            goalies={goalies}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            isPro={!!isPro}
          />

          {/* Events */}
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
                hidePayments={true}
                goalieId={activeGoalie.id}
              />
            ) : (
              <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">
                No upcoming events.
              </div>
            )}
          </motion.div>
        </section>

        {/* Right Column */}
        <section className="flex flex-col gap-6">
          <GoalsWidget rosterId={activeGoalie.id} goalieId={userId || undefined} />

          {/* Logic Reorder based on Pro status */}
          {isPro ? (
            <>
              {/* Highlights integrated into CoachesCorner */}
              <div className="opacity-80 scale-95 origin-top">
                <CoachesCorner
                  activeGoalie={activeGoalie}
                  userRole={userRole || 'goalie'}
                  isOwner={!!userId}
                />
                <ScheduleRequest
                  rosterId={activeGoalie.id}
                  goalieName={activeGoalie.name}
                  coachName={activeGoalie.coach}
                  coachIds={activeGoalie.coachIds}
                  sport={activeGoalie.sport}
                  onCoachUpdate={() => fetchMyGoalies(false)}
                />
              </div>
            </>
          ) : (
            <>
              <CoachesCorner
                activeGoalie={activeGoalie}
                userRole={userRole || 'goalie'}
                isOwner={!!userId}
              />
              <ScheduleRequest
                rosterId={activeGoalie.id}
                goalieName={activeGoalie.name}
                coachName={activeGoalie.coach}
                coachIds={activeGoalie.coachIds}
                sport={activeGoalie.sport}
                onCoachUpdate={() => fetchMyGoalies(false)}
              />
            </>
          )}
        </section>

      </div>
      <BetaFeedback rosterId={activeGoalie.id} userId={userId || undefined} userRole="goalie" />
      <WhatsNewGuide />
    </main>
  );
}
