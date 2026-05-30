"use client";

import { useState, useEffect } from "react";
import { EventsList } from "@/components/EventsList";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRO_SCHEDULE } from "@/lib/demo-data";
import { supabase } from "@/utils/supabase/client";

// Re-fetch logic similar to parent/page
export default function EventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [goalieId, setGoalieId] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);
    const [backLink, setBackLink] = useState("/parent");

    const fetchEvents = async () => {
        setLoading(true);
        // 0. Determine Back Link and Fetch Goalie Info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role === 'goalie') {
                setBackLink("/dashboard");
                // For goalies, they are their own roster spot
                const { data: roster } = await supabase.from('roster_uploads').select('id').eq('linked_user_id', user.id).single();
                if (roster) setGoalieId(roster.id);
            }
            else if (profile?.role === 'coach') setBackLink("/dashboard");
            else if (profile?.role === 'admin') setBackLink("/dashboard");
            else {
                // Parent: possibly multiple children, but for events page we might need to know which goalie we're looking at.
                // For now, let's fetch the first linked goalie for this parent.
                const { data: roster } = await supabase.from('roster_uploads').select('id').eq('linked_user_id', user.id).limit(1).single();
                if (roster) setGoalieId(roster.id);
            }
        }

        // For Demo: Use PRO_SCHEDULE + DB Events
        // 1. Fetch DB Events
        const { data: dbEvents } = await supabase.from('events').select('*').order('date', { ascending: true });

        // 1.5 Fetch Registrations for user
        let registeredIds = new Set();
        if (user) {
            const { data: regs } = await supabase.from('registrations').select('event_id').eq('goalie_id', user.id);
            registeredIds = new Set(regs?.map(r => r.event_id) || []);
        }

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

        // 3. Map DB Events (Filtered to registered or owned)
        const mappedDbEvents = dbEvents
            ?.filter(e => {
                const isRegistered = registeredIds.has(e.id);
                const isCreator = user && e.created_by === user.id;
                return isRegistered || isCreator;
            })
            .map(e => ({
                id: e.id,
                name: e.name,
                date: new Date(e.date).toLocaleDateString(),
                location: e.location || 'TBA',
                status: "upcoming" as const, // Simplify to upcoming if visible
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

    useEffect(() => {
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
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors text-foreground"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Full Schedule
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
                    <EventsList events={filteredEvents} goalieId={goalieId} onEventAdded={fetchEvents} />
                ) : (
                    <div className="text-center text-muted-foreground py-10">No events found.</div>
                ))}
            </div>
        </main>
    );
}
