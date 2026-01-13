"use client";

import { GoalieCard } from "@/components/GoalieCard";
import { PaymentList } from "@/components/PaymentList";
import { ScheduleRequest } from "@/components/ScheduleRequest";
import { PostGameReport } from "@/components/PostGameReport";
import { EventsList } from "@/components/EventsList";
import { motion } from "framer-motion";
import { Bell, ChevronLeft, ChevronRight, User, Settings, CreditCard, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Data Mock
const GOALIE_DATA = [
  {
    id: 1,
    name: "Leo Vance",
    coach: "Coach Mike",
    session: 1,
    lesson: 4,
    stats: { gaa: "2.10", sv: ".925" },
    events: [
      {
        id: 1,
        name: "GS Baltimore Camp",
        date: "Dec 12-14, 2024",
        location: "Reistertown Sportsplex",
        status: "upcoming" as const, // Cast to literal type
        image: "from-blue-600 to-indigo-600"
      }
    ],
    feedback: [
      {
        id: 1,
        date: "Today, 10:00 AM",
        coach: "Coach Mike",
        title: "Glove Hand Precision",
        content: "Leo was electric today. We really focused on keeping that glove hand elevated during the butterfly slide. He needs to keep tracking the puck all the way into the pocket.",
        rating: 5,
        hasVideo: true,
      },
      {
        id: 2,
        date: "Oct 24, 2023",
        coach: "Coach Sarah",
        title: "Post-Post Integration",
        content: "Solid session. The RVH entry is getting smoother, but watch for the gap on the short side. Good intensity.",
        rating: 4,
        hasVideo: false,
      }
    ]
  },
  {
    id: 2,
    name: "Jamie Vance",
    coach: "Coach Dave",
    session: 2,
    lesson: 1,
    stats: { gaa: "3.45", sv: ".890" },
    events: [
      {
        id: 2,
        name: "GS Georgia Clinic",
        date: "Jan 05, 2025",
        location: "The Cooler, Alpharetta",
        status: "open" as const,
        image: "from-orange-500 to-red-600"
      }
    ],
    feedback: [
      {
        id: 3,
        date: "Yesterday, 4:00 PM",
        coach: "Coach Dave",
        title: "Butterfly Slides",
        content: "Jamie is getting faster but needs to stay square to the shooter. Good progress on the recoveries.",
        rating: 3,
        hasVideo: true,
      }
    ]
  }
];

export default function Home() {
  const [currentGoalieIndex, setCurrentGoalieIndex] = useState(0);
  const activeGoalie = GOALIE_DATA[currentGoalieIndex];

  return (
    <main className="min-h-screen bg-black p-4 md:p-8 overflow-x-hidden selection:bg-primary selection:text-white">
      <div className="max-w-md mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-8 lg:gap-12">

        {/* Header - Mobile only usually, but here global */}
        <header className="flex justify-between items-center mb-8 md:col-span-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Parent Portal</span>
            <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">
              GOALIE<span className="text-primary">CARD</span>
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
                  <div className="text-xs text-zinc-500">managed by leovance@gmail.com</div>
                </div>

                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <Settings size={16} /> Account Settings
                </button>
                <Link href="/activate" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <Plus size={16} /> Activate New Card
                </Link>
                <Link href="/parent/payments" className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                  <CreditCard size={16} /> Billing & History
                </Link>

                <div className="h-px bg-zinc-800 my-1" />
                <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
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

              {/* Switcher Controls (Mocked for 2 goalies) */}
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12">
                <button
                  onClick={() => setCurrentGoalieIndex(prev => prev === 0 ? 1 : 0)}
                  className="p-1.5 bg-zinc-900/80 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700/50 shadow-xl transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12">
                <button
                  onClick={() => setCurrentGoalieIndex(prev => prev === 0 ? 1 : 0)}
                  className="p-1.5 bg-zinc-900/80 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700/50 shadow-xl transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {GOALIE_DATA.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentGoalieIndex(idx)}
                    className={`h-2 rounded-full transition-all ${currentGoalieIndex === idx ? "w-8 bg-primary" : "w-2 bg-zinc-800 hover:bg-zinc-700"}`}
                  />
                ))}
              </div>
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
            <EventsList events={activeGoalie.events} />
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
            <PostGameReport report={activeGoalie.feedback} />
          </motion.div>



          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <PaymentList />
          </motion.div>
        </section>
      </div>
    </main>
  );
}
