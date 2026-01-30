"use client";

import { useState, useEffect } from "react";
import { EventsList } from "@/components/EventsList";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { PRO_SCHEDULE } from "@/lib/demo-data";
import { supabase } from "@/utils/supabase/client";

// Re-fetch logic similar to parent/page
export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [loading, setLoading] = useState(true);

    const [backLink, setBackLink] = useState("/parent");

    useEffect(() => {
        const fetchEvents = async () => {
            // 0. Determine Back Link based on Role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile?.role === 'goalie') setBackLink("/goalie");
                else if (profile?.role === 'coach') setBackLink("/coach");
                else if (profile?.role === 'admin') setBackLink("/admin");
                // Default is parent
            }

            // For Demo: Use PRO_SCHEDULE + DB Events
            // 1. Fetch DB Events
            const { data: dbEvents } = await supabase.from('events').select('*').order('date', { ascending: true });

            // 2. Map PRO_SCHEDULE
            const proEvents = PRO_SCHEDULE.map(e => ({
                id: e.id,
                name: e.name,
                date: new Date(e.date).toLocaleDateString(),
                location: e.location,
                status: "upcoming" as const,
                image: e.type === 'Game' ? "from-purple-900 to-black" : (e.type === 'Practice' ? "from-gray-700 to-gray-900" : "from-gray-800 to-black"),
                price: 0,
                sport: 'Hockey',
                rawDate: new Date(e.date)
            }));

            // 3. Map DB Events
            const mappedDbEvents = dbEvents?.map(e => ({
                id: e.id,
                name: e.name,
                date: new Date(e.date).toLocaleDateString(),
                location: e.location || 'TBA',
                status: "upcoming" as const, // Simplification
                image: e.image || "from-gray-500 to-gray-600",
                price: e.price,
                sport: e.sport,
                rawDate: new Date(e.date)
            })) || [];

            // Merge and Sort
            const allEvents = [...proEvents, ...mappedDbEvents].sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

            setEvents(allEvents);
            setLoading(false);
        };
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(e => {
        const now = new Date();
        if (filter === 'upcoming') return e.rawDate >= now;
        if (filter === 'past') return e.rawDate < now;
        return true;
    });

    return (
        <main className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={backLink}
                        className="p-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors text-foreground"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        FULL <span className="text-primary">SCHEDULE</span>
                    </h1>
                </div>

                {/* Filter Controls */}
                <div className="flex p-1 bg-muted rounded-xl max-w-md">
                    <button onClick={() => setFilter('upcoming')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'upcoming' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Upcoming</button>
                    <button onClick={() => setFilter('past')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'past' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Past</button>
                    <button onClick={() => setFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>All</button>
                </div>

                {loading ? (
                    <div className="text-center text-muted-foreground py-10">Loading schedule...</div>
                ) : (events.length > 0 ? (
                    <EventsList events={filteredEvents} />
                ) : (
                    <div className="text-center text-muted-foreground py-10">No events found.</div>
                ))}
            </div>
        </main>
    );
}
