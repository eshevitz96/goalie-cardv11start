"use client";

import { GoalieCard } from "@/components/GoalieCard";
import { PaymentList } from "@/components/PaymentList";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { EventsList } from "@/components/EventsList";
import { motion } from "framer-motion";
import { Bell, ChevronLeft, ChevronRight, User, Settings, CreditCard, LogOut, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [goalies, setGoalies] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initial Load Logic
  useEffect(() => {
    const fetchMyGoalies = async () => {
      // 1. Check Auth User first (Most reliable)
      const { data: { user } } = await supabase.auth.getUser();
      let emailToSearch = user?.email;
      const localId = typeof window !== 'undefined' ? localStorage.getItem('activated_id') : null;

      if (!emailToSearch && !localId) {
        // No user, no local ID -> Nothing to show
        setGoalies([]);
        setIsLoading(false);
        return;
      }

      // Query Roster
      let query = supabase.from('roster_uploads').select('*');

      // Construct OR query to find by Email (Case Insensitive) OR ID
      const conditions = [];
      if (emailToSearch) conditions.push(`email.ilike.${emailToSearch}`);
      if (localId) conditions.push(`assigned_unique_id.eq.${localId}`);

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      } else {
        // No identifiers
        setGoalies([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await query;

      if (data && data.length > 0) {
        // Transform DB data to UI Model
        const realGoalies = data.map(g => ({
          id: g.id,
          name: g.goalie_name,
          team: g.team,
          gradYear: g.grad_year,
          coach: "Assigned Coach",
          session: 1,
          lesson: 1,
          stats: { gaa: "0.00", sv: ".000" },
          events: [],
          feedback: []
        }));
        setGoalies(realGoalies);
      } else {
        console.log("No roster record found for this user.");
        setGoalies([]);
      }
      setIsLoading(false);
    };

    fetchMyGoalies();
  }, []);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await supabase.auth.signOut();
    localStorage.removeItem('activated_id'); // Clear local session too
    router.push('/login');
  };

  const activeGoalie = goalies[currentIndex];

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  // If no goalies found, showing Empty State or Redirect
  if (goalies.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">No Goalie Profile Found</h1>
        <p className="text-zinc-400 mb-8 max-w-md">We couldn't link your account to a roster. Please contact support or try activating again.</p>
        <button onClick={() => router.push('/login')} className="bg-zinc-800 px-6 py-3 rounded-xl font-bold">Back to Login</button>
      </div>
    );
  }

  if (!activeGoalie) return <div className="min-h-screen bg-black text-white p-8">No Goalies Found. <Link href="/activate" className="text-primary underline">Activate a Card</Link></div>;

  return (
    <main className="min-h-screen bg-black p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
      <div className="max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-8 lg:gap-12">

        <header className="flex justify-between items-center mb-8 md:col-span-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] mb-1">Parent Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">
              GOALIE CARD
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group z-50">
              <button className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-all">
                <User size={18} className="text-zinc-400 group-hover:text-white" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                  <div className="text-sm font-bold text-white">Parent Account</div>
                  <div className="text-xs text-zinc-500">{activeGoalie ? activeGoalie.name : 'Goalie Parent'}</div>
                </div>

                <Link href="/parent/profile" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <Settings size={16} /> Account Settings
                </Link>
                <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <Plus size={16} /> Activate New Card
                </Link>
                <Link href="/parent/payments" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <CreditCard size={16} /> Billing & History
                </Link>

                <div className="h-px bg-zinc-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
            <button className="relative p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
              <Bell size={20} className="text-zinc-400" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </button>
          </div>
        </header>

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
                className="w-full h-auto aspect-[4/5] md:aspect-auto md:h-[500px]"
              />

              {/* Switcher Controls */}
              {goalies.length > 1 && (
                <>
                  <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                    <button
                      onClick={() => setCurrentIndex(prev => prev === 0 ? goalies.length - 1 : prev - 1)}
                      className="p-1.5 bg-zinc-900/80 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700/50 shadow-xl transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                    <button
                      onClick={() => setCurrentIndex(prev => prev === goalies.length - 1 ? 0 : prev + 1)}
                      className="p-1.5 bg-zinc-900/80 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700/50 shadow-xl transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex justify-center gap-2 mt-4">
                    {goalies.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2 rounded-full transition-all ${currentIndex === idx ? "w-8 bg-primary" : "w-2 bg-zinc-800 hover:bg-zinc-700"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats Section - Dynamic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{activeGoalie.stats.gaa}</div>
              <div className="text-xs font-medium text-zinc-500 uppercase">GAA</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{activeGoalie.stats.sv}</div>
              <div className="text-xs font-medium text-zinc-500 uppercase">SV%</div>
            </div>
          </div>

          <motion.div
            key={`events-${activeGoalie.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {activeGoalie.events.length > 0 ? (
              <EventsList events={activeGoalie.events} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center text-zinc-500 text-sm">
                No upcoming events.
              </div>
            )}
          </motion.div>
        </section>

        {/* Right Column: Actions & History */}
        <section className="flex flex-col gap-6">

          <motion.div
            key={`req-${activeGoalie.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ScheduleRequest goalieName={activeGoalie.name} coachName={activeGoalie.coach} />
          </motion.div>

          <motion.div
            key={`feed-${activeGoalie.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {activeGoalie.feedback.length > 0 ? (
              <PostGameReport report={activeGoalie.feedback} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center text-zinc-500 text-sm">
                No session reports yet.
              </div>
            )}
          </motion.div>

          {/* Highlights Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span className="text-purple-500">★</span> Highlights
              </h3>
              <button
                onClick={() => {
                  const url = prompt("Enter Video URL (YouTube/Insta):");
                  if (url) {
                    supabase.from('highlights').insert({
                      roster_id: activeGoalie.id,
                      url: url,
                      description: "Parent Upload"
                    }).then(({ error }) => {
                      if (error) alert("Error: " + error.message);
                      else alert("Highlight Added!");
                    });
                  }
                }}
                className="text-xs bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-500 hover:text-white transition-colors"
              >
                + Add Video
              </button>
            </div>
            <div className="text-center text-zinc-500 text-xs py-4">
              Share game clips for coach review.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <PaymentList rosterId={activeGoalie.id} />
          </motion.div>
        </section>
      </div>
    </main>
  );
}
