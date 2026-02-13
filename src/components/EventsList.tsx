"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/utils/supabase/client";

export interface Event {
    id: string; // Changed from number to string (UUID)
    name: string;
    date: string;
    location: string;
    status: "upcoming" | "open" | "past";
    image: string;
    price?: number;
    access_code?: string;
    sport?: string;
}

// ... (previous imports)

interface EventsListProps {
    events: Event[];
    onRegister?: (eventId: string) => void;
    onEventAdded?: () => void;
    sport?: string;
    maxItems?: number;
    hidePayments?: boolean;
    goalieId?: string; // NEW: Needed for auto-registration
}

export function EventsList({ events, onRegister, onEventAdded, sport, maxItems, hidePayments, goalieId }: EventsListProps) {
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const { toast } = useToast();

    return (
        <div className="w-full space-y-4">
            <div className="flex items-end justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="text-primary" />
                    Event Passes & Schedule
                </h3>
                <div className="flex items-center gap-3">
                    {maxItems && (
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = '/events'}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors h-auto py-1 px-2"
                            title="View Full Calendar"
                        >
                            See All
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => setShowAddEventModal(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors h-auto py-1 px-2 hover:bg-primary/10"
                    >
                        + Add Event
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {events.length > 0 ? (
                    events.slice(0, maxItems || events.length).map((event, idx) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => window.location.href = `/events/${event.id}`}
                            className="bg-secondary/30 border border-border/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-secondary/50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                    <QrCode size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-sm">{event.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            {event.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant={event.status === 'open' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5">
                                {event.status}
                            </Badge>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-secondary/10 border border-dashed border-border rounded-2xl">
                        <Calendar className="text-muted-foreground mb-3 opacity-20" size={32} />
                        <p className="text-xs text-muted-foreground font-medium">No upcoming events scheduled.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Use "+ Add Event" to log a game or practice.</p>
                    </div>
                )}
            </div>

            <AddEventModal
                isOpen={showAddEventModal}
                onClose={() => setShowAddEventModal(false)}
                onAdded={() => onEventAdded?.()}
                defaultSport={sport}
                goalieId={goalieId}
            />
        </div>
    );
}

function AddEventModal({ isOpen, onClose, onAdded, defaultSport, goalieId }: { isOpen: boolean, onClose: () => void, onAdded?: () => void, defaultSport?: string, goalieId?: string }) {
    const [manualEvent, setManualEvent] = useState({ type: 'Game', name: '', date: '', location: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleManualSubmit = async () => {
        if (!manualEvent.name || !manualEvent.date) {
            toast("Please fill in required fields.", "error");
            return;
        }
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { data: eventData, error: eventError } = await supabase.from('events').insert({
            name: `${manualEvent.type}: ${manualEvent.name}`,
            date: new Date(manualEvent.date).toISOString(),
            location: manualEvent.location || 'TBA',
            sport: defaultSport || 'Hockey',
            price: 0,
            image: "from-zinc-500 to-zinc-700",
            created_by: user?.id
        }).select().single();

        if (eventError) {
            toast("Error adding event: " + eventError.message, "error");
        } else if (eventData && user) {
            const { error: regError } = await supabase.from('registrations').insert({
                goalie_id: user.id,
                event_id: eventData.id,
                status: 'registered'
            });

            if (regError) {
                console.error("Auto-registration failed", regError);
                toast("Event added, but auto-registration failed.", "error");
            } else {
                toast(`${manualEvent.type} Added & Registered!`, "success");
            }

            onAdded?.();
            onClose();
        } else {
            toast("Event Added (No Registration linked)", "success");
            onAdded?.();
            onClose();
        }
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Event">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Event Type</label>
                    <div className="flex gap-2">
                        {['Game', 'Practice', 'Training'].map(type => (
                            <button
                                key={type}
                                onClick={() => setManualEvent({ ...manualEvent, type })}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${manualEvent.type === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Event Name</label>
                    <input
                        type="text"
                        value={manualEvent.name}
                        onChange={e => setManualEvent({ ...manualEvent, name: e.target.value })}
                        placeholder="e.g. vs Boston"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Date & Time</label>
                    <input
                        type="datetime-local"
                        value={manualEvent.date}
                        onChange={e => setManualEvent({ ...manualEvent, date: e.target.value })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                        type="text"
                        value={manualEvent.location}
                        onChange={e => setManualEvent({ ...manualEvent, location: e.target.value })}
                        placeholder="Arena Name"
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex gap-2 pt-4">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" onClick={handleManualSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Confirm"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
