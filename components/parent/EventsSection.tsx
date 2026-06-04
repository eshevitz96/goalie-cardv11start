"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EventsList } from "@/components/EventsList";
import { supabase } from "@/utils/supabase/client";
import { eventsService } from "@/services/events";

interface EventsSectionProps {
    activeGoalie: any;
    onEventAdded: () => void;
}

export function EventsSection({ activeGoalie, onEventAdded }: EventsSectionProps) {
    const handleRegister = async (eventId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please sign in to register.");
            return;
        }

        if (!confirm("Confirm registration?")) return;

        try {
            await eventsService.register(user.id, eventId);
            alert("Successfully registered!");
            onEventAdded();
        } catch (error: any) {
            alert("Registration failed: " + error.message);
        }
    };

    return (
        <motion.div
            key={`events-${activeGoalie.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
        >
            {activeGoalie.events && activeGoalie.events.length > 0 ? (
                <EventsList
                    events={activeGoalie.events}
                    onRegister={handleRegister}
                    onEventAdded={onEventAdded}
                    sport={activeGoalie.sport}
                    maxItems={3}
                />
            ) : (
                <div className="bg-card border border-border rounded-3xl p-6 text-center text-muted-foreground text-sm">
                    No upcoming events.
                </div>
            )}
        </motion.div>
    );
}
