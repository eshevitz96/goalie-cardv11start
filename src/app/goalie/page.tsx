"use client";

import { GoalieCard } from "@/components/GoalieCard";

import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { AiCoachRecommendation } from "@/components/AiCoachRecommendation";
import { Reflections } from "@/components/Reflections";
import { BetaFeedback } from "@/components/BetaFeedback";
import { WhatsNewGuide } from "@/components/WhatsNewGuide";
import { EventsList } from "@/components/EventsList";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronLeft, ChevronRight, User, Settings, CreditCard, LogOut, Plus, Loader2, Medal, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { GoalsWidget } from "@/components/GoalsWidget";
import { isPastSeniorSeason } from "@/utils/role-logic";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [goalies, setGoalies] = useState<any[]>([]);
  // Debug State
  const [debugInfo, setDebugInfo] = useState<{ email: string | null, localId: string | null }>({ email: null, localId: null });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedBlock, setExpandedBlock] = useState<'journal' | 'notes' | null>(null);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initial Load Logic
  const fetchMyGoalies = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    // 1. Auth & Local ID Check
    const { data: { user } } = await supabase.auth.getUser();
    let emailToSearch = user?.email;
    const localId = typeof window !== 'undefined' ? localStorage.getItem('activated_id') : null;

    setDebugInfo({ email: emailToSearch || null, localId: localId });

    if (user) {
      setUserId(user.id);
      // Fetch Profile Role (just to be safe/consistent)
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (p) setUserRole(p.role);
    }

    if (!emailToSearch && !localId) {
      // If no user and no local ID, can't find anything
      setGoalies([]);
      setIsLoading(false);
      return;
    }

    // 2. Query Roster (Find the Goalie's Card)
    let query = supabase.from('roster_uploads').select('*');
    if (emailToSearch && localId) {
      query = query.or(`email.ilike.${emailToSearch},assigned_unique_id.eq.${localId}`);
    } else if (emailToSearch) {
      query = query.ilike('email', emailToSearch);
    } else if (localId) {
      query = query.eq('assigned_unique_id', localId);
    }

    let { data: rosterData, error: rosterError } = await query;
    if (rosterError) console.error("Roster Fetch Error:", rosterError);

    // DEMO INJECTION & BRIDGE PERMISSION
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';

    // Bridge for Luke Grasso (Live Activation Test)
    if ((!rosterData || rosterData.length === 0) && (localId === 'GC-8588' || user?.email === 'thegoaliebrand@gmail.com')) {
      rosterData = [{
        id: 'e5b8471e-72eb-4b2b-8680-ee922a43e850',
        goalie_name: 'Luke Grasso',
        team: 'Yale Bulldogs',
        grad_year: 2029,
        height: '6-0',
        weight: '190',
        catch_hand: 'Left',
        sport: 'Lacrosse',
        assigned_unique_id: 'GC-8588',
        email: 'lukegrasso09@gmail.com',
        parent_name: 'Parent Grasso',
        session_count: 20,
        lesson_count: 1,
        games_count: 5,
        practice_count: 10,
        assigned_coach_id: 'demo-coach',
        assigned_coach_ids: ['demo-coach']
      }];
    }
    // Legacy Demo Mode
    else if (isDemoMode) {
      console.log("DEMO MODE: Injecting Fake Data");
      const demoName = localStorage.getItem('user_name');
      const demoTeam = localStorage.getItem('user_team');

      rosterData = [{
        id: 99999,
        goalie_name: demoName || "Elliott Shevitz",
        grad_year: 2018,
        team: demoTeam || "Arizona Coyotes",
        height: "6'2",
        weight: "205",
        catch_hand: "Left",
        assigned_unique_id: "GC-8001",
        email: "thegoaliebrand@gmail.com",
        sport: "Hockey",
        // Ensure recent mood is available for AI
        latestMood: "Dialed In"
      } as any];
    }


    // 3. Fetch Events (All Future Events)
    const { data: allEvents } = await supabase.from('events').select('*').gte('date', new Date().toISOString()).order('date', { ascending: true });

    // 4. Fetch User Registrations
    let registeredIds = new Set();
    if (user) {
      const { data: regs } = await supabase.from('registrations').select('event_id').eq('goalie_id', user.id);
      registeredIds = new Set(regs?.map(r => r.event_id) || []);
    }

    // 5. Fetch Session History
    let sessionsMap = new Map<string, any[]>();
    if (rosterData && rosterData.length > 0) {
      const rosterIds = rosterData.map(r => r.id);
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .in('roster_id', rosterIds)
        .order('date', { ascending: false });

      if (sessionsData) {
        sessionsData.forEach(s => {
          const list = sessionsMap.get(s.roster_id) || [];
          list.push(s);
          sessionsMap.set(s.roster_id, list);
        });
      }
    }

    // 6. Fetch Coaches
    const { data: coachesData } = await supabase.from('profiles').select('id, goalie_name, training_types, pricing_config, development_philosophy').eq('role', 'coach');
    const coachMap = new Map(coachesData?.map(c => [c.id, c]) || []);

    // 7.1 Fetch Latest Reflections
    let reflectionsMap = new Map<string, string>();
    if (rosterData && rosterData.length > 0) {
      const rosterIds = rosterData.map(r => r.id);
      const { data: refData } = await supabase
        .from('reflections')
        .select('roster_id, mood, created_at, author_role')
        .in('roster_id', rosterIds)
        .order('created_at', { ascending: false });

      // Since it's ordered by desc, the first entry for each roster_id we encounter is the latest
      if (refData) {
        refData.forEach(r => {
          // Input Purity: Only use the GOALIE'S internal state.
          const isAthleteVoice = r.author_role === 'goalie' || r.author_role === null || r.author_role === undefined;

          if (isAthleteVoice && !reflectionsMap.has(r.roster_id)) {
            reflectionsMap.set(r.roster_id, r.mood);
          }
        });
      }
    }

    // 7. Process & Map Data
    if (rosterData && rosterData.length > 0) {
      const realGoalies = rosterData.map(g => {
        // Filter Events for this Goalie's Sport
        const goalieSports = g.sport ? g.sport.split(',').map((s: string) => s.trim()) : [];
        const goalieEvents = allEvents
          ?.filter(e => {
            if (!e.sport) return true; // Event open to all
            if (goalieSports.length === 0) return true; // Goalie has no sport defined (show all?) or default to showing? default showing.
            return goalieSports.includes(e.sport);
          })
          .map(e => ({
            id: e.id,
            name: e.name,
            date: new Date(e.date).toLocaleDateString(),
            location: e.location || 'TBA',
            status: registeredIds.has(e.id) ? "upcoming" : "open",
            image: e.image || "from-gray-500 to-gray-600",
            price: e.price,
            sport: e.sport
          })) || [];

        // Resolve Coach
        let assignedCoachName = "Assigned Coach";
        let assignedCoachIds: string[] = [];
        let primaryCoachDetails = null;

        if (g.assigned_coach_ids && g.assigned_coach_ids.length > 0) {
          assignedCoachIds = g.assigned_coach_ids;
          const coaches = assignedCoachIds.map(id => coachMap.get(id));
          const names = coaches.map(c => c?.goalie_name || "Unknown");
          if (names.length === 1) assignedCoachName = names[0];
          else assignedCoachName = `${names.length} Coaches`;
          primaryCoachDetails = coaches[0] || null;
        } else if (g.assigned_coach_id) {
          // Fallback for legacy
          const coach = coachMap.get(g.assigned_coach_id);
          assignedCoachName = coach?.goalie_name || "Unknown Coach";
          primaryCoachDetails = coach || null;
        }

        // Map Sessions for Feedback
        const gSessions = sessionsMap.get(g.id) || [];
        const feedbackItems = gSessions.map(s => ({
          id: s.id,
          date: new Date(s.date).toLocaleDateString(),
          coach: assignedCoachName, // Simplified
          title: `Session ${s.session_number} • Lesson ${s.lesson_number}`,
          content: s.notes || "No notes for this session.",
          rating: 5,
          hasVideo: false
        }));

        return {
          id: g.id,
          name: g.goalie_name,
          team: g.team,
          gradYear: g.grad_year,
          height: g.height,
          weight: g.weight,
          catchHand: g.catch_hand,
          sport: g.sport || 'Hockey',
          coach: assignedCoachName,
          coachIds: assignedCoachIds,
          coachDetails: primaryCoachDetails,
          coachId: g.assigned_coach_id,
          session: g.session_count || 0,
          lesson: g.lesson_count || 0,
          stats: {
            gaa: "0.00",
            sv: ".000",
            memberSince: gSessions.length > 0 ? new Date(gSessions[gSessions.length - 1].date).getFullYear() : new Date().getFullYear(),
            totalSessions: g.session_count || 0,
            totalLessons: g.lesson_count || 0
          },
          events: goalieEvents,
          feedback: feedbackItems,
          latestMood: reflectionsMap.get(g.id) || 'neutral'
        };
      });
      setGoalies(realGoalies);
    } else {
      setGoalies([]);
    }
    setIsLoading(false);
  };

  const handleCreateCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('roster_uploads').insert({
      email: user.email,
      goalie_name: 'New Goalie', // They can update this later
      is_claimed: true,
      assigned_unique_id: user.id.slice(0, 8), // Temp ID
      sport: 'Hockey'
    });

    if (error) alert("Error creating card: " + error.message);
    else {
      alert("Card Created!");
      fetchMyGoalies();
    }
  };

  useEffect(() => {
    fetchMyGoalies(true);
  }, []);

  // ... (Keep handleLogout, handleRegister, etc)

  // ... (Keep notification effect)

  // Re-bind for context
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem('activated_id'); // Clear local session too
    router.push('/login');
  };

  const handleRegister = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in to register.");
      return;
    }

    if (!confirm("Confirm registration?")) return;

    const { error } = await supabase.from('registrations').insert({
      goalie_id: user.id, // User ID (Profile)
      event_id: eventId,
      status: 'registered'
    });

    if (error) {
      alert("Registration failed: " + error.message);
    } else {
      alert("Successfully registered!");
      fetchMyGoalies(false);
    }
  };

  const [notification, setNotification] = useState<{ id: string, title: string, message: string } | null>(null);

  useEffect(() => {
    const fetchLatestNotification = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setNotification(data);
      }
    };
    fetchLatestNotification();
  }, []);

  const activeGoalie = goalies[currentIndex];

  // LOOP PREVENTION: Removed auto-redirect
  // useEffect(() => {
  //   if (!isLoading && goalies.length === 0) {
  //     router.push('/activate');
  //   }
  // }, [isLoading, goalies, router]);

  if (isLoading) {
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
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 mb-6 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-4 rounded-r-lg flex items-start gap-3 backdrop-blur-sm"
          >
            <div className="p-2 bg-primary/20 rounded-full text-primary">
              <Bell size={16} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-muted-foreground hover:text-foreground">
              <span className="sr-only">Dismiss</span>
              &times;
            </button>
          </motion.div>
        )}

        <header className="flex justify-between items-center mb-8 md:col-span-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Goalie Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground italic tracking-tighter">
              GOALIE <span className="text-primary">CARD</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group z-50">
              <button className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted hover:border-primary transition-all">
                <User size={18} className="text-muted-foreground group-hover:text-foreground" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <div className="text-sm font-bold text-foreground">Goalie Account</div>
                  <div className="text-xs text-muted-foreground">{activeGoalie ? activeGoalie.name : 'Goalie Parent'}</div>
                </div>

                <Link href="/parent/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                  <Settings size={16} /> Account Settings
                </Link>
                <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                  <Plus size={16} /> Activate New Card
                </Link>

                <div className="h-px bg-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
            <button className="relative p-3 bg-card rounded-full hover:bg-muted transition-colors">
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </button>
          </div>
        </header>

        {/* PERFORMANCE DIRECTIVE - PRO FEATURE */}
        <div className="md:col-span-2 mb-6">
          <AiCoachRecommendation lastMood={activeGoalie.latestMood} rosterId={activeGoalie.id} sport={activeGoalie.sport} />
        </div>

        {/* EXPANDABLE JOURNAL & NOTES BLOCK */}
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
            key={activeGoalie.id} // Re-animate on change
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
                className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
              />

              {/* Switcher Controls */}
              {goalies.length > 1 && (
                <>
                  <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                    <button
                      onClick={() => setCurrentIndex(prev => prev === 0 ? goalies.length - 1 : prev - 1)}
                      className="p-1.5 bg-card/80 rounded-full text-muted-foreground hover:text-foreground hover:bg-card backdrop-blur-sm border border-border shadow-xl transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                    <button
                      onClick={() => setCurrentIndex(prev => prev === goalies.length - 1 ? 0 : prev + 1)}
                      className="p-1.5 bg-card/80 rounded-full text-muted-foreground hover:text-foreground hover:bg-card backdrop-blur-sm border border-border shadow-xl transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
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

          {/* Stats Section - Dynamic */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-foreground">{activeGoalie.stats.memberSince}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Member Since</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-foreground">{activeGoalie.stats.totalSessions}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Sessions</div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-primary">{activeGoalie.stats.totalLessons}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Lessons</div>
            </div>
          </div>

          <motion.div
            key={`events-${activeGoalie.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {activeGoalie.events.length > 0 ? (
              <EventsList events={activeGoalie.events} onRegister={handleRegister} />
            ) : (
              <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">
                No upcoming events.
              </div>
            )}
          </motion.div>
        </section>

        {/* Right Column: Actions & History */}
        <section className="flex flex-col gap-6">

          {/* Logic to Reorder for Pro/Adult (Grad Year Checks) using dynamic relationship */}
          {(() => {
            const isPro = activeGoalie.gradYear && (isPastSeniorSeason(activeGoalie.gradYear) || activeGoalie.team?.toLowerCase().includes('blue') || activeGoalie.team?.toLowerCase().includes('pro'));

            const CompCoachInfo = (
              <motion.div
                key={`coach-info-${activeGoalie.id}`}
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
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No coach details available.</div>
                )}

                <div className="mt-4 pt-4 border-t border-border/50">
                  <button
                    onClick={() => {
                      if (confirm("Request Access to Coach OS Card? Administrators will review your request.")) {
                        alert("Request Sent! Pending Admin Confirmation.");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white py-3 rounded-xl transition-all"
                  >
                    <Medal size={14} /> Add Coach OS Card
                  </button>
                </div>
              </motion.div>
            );

            const CompRequest = (
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
            );

            const CompHighlights = (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="glass rounded-3xl p-6 mb-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <span className="text-primary">★</span> Highlights
                  </h3>
                  <button
                    onClick={() => {
                      const url = prompt("Enter Video URL (YouTube/Insta):");
                      if (url) {
                        supabase.from('highlights').insert({
                          roster_id: activeGoalie.id,
                          url: url,
                          description: "Goalie Upload"
                        }).then(({ error }) => {
                          if (error) alert("Error: " + error.message);
                          else alert("Highlight Added!");
                        });
                      }
                    }}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    + Add Video
                  </button>
                </div>
                <div className="text-center text-muted-foreground text-xs py-4">
                  Share game clips for coach review.
                </div>
              </motion.div>
            );

            return isPro ? (
              <>
                <GoalsWidget rosterId={activeGoalie.id} goalieId={userId || undefined} />
                {CompHighlights}
                <div className="opacity-80 scale-95 origin-top">
                  {CompCoachInfo}
                  {CompRequest}
                </div>
              </>
            ) : (
              <>
                <GoalsWidget rosterId={activeGoalie.id} goalieId={userId || undefined} />
                {CompCoachInfo}
                {CompRequest}
                {CompHighlights}
              </>
            );
          })()}

        </section>

      </div>
      <BetaFeedback rosterId={activeGoalie.id} userId={userId || undefined} userRole="goalie" />
      <WhatsNewGuide />
    </main>
  );
}
