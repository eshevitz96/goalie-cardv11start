"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode, Film, Database, Video } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/utils/supabase/client";
import { EventModal } from "./goalie/EventModal";

export interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    status: "upcoming" | "open" | "past";
    image: string;
    price?: number;
    access_code?: string;
    sport?: string;
    scouting_report?: string;
    created_by?: string;
    video_id?: string;
    is_charted?: boolean;
}

interface EventsListProps {
    events: Event[];
    onRegister?: (eventId: string) => void;
    onUploadFilm?: (eventId: string) => void;
    onEventAdded?: () => void;
    sport?: string;
    maxItems?: number;
    hidePayments?: boolean;
    goalieId?: string;
}

export function EventsList({ events, onRegister, onUploadFilm, onEventAdded, sport, maxItems, hidePayments, goalieId }: EventsListProps) {
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const { toast } = useToast();

    const handleEdit = (e: React.MouseEvent, event: Event) => {
        e.stopPropagation();
        setEditingEvent(event);
        setShowEventModal(true);
    };

    const handleAdd = () => {
        setEditingEvent(null);
        setShowEventModal(true);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between gap-4 mb-4 flex-nowrap px-4 pt-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2 whitespace-nowrap">
                    <Calendar className="text-primary shrink-0" size={18} />
                    Events
                </h3>
                <div className="flex items-center gap-2">
                    {maxItems && (
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = '/events'}
                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors h-7 px-2"
                            title="View Full Calendar"
                        >
                            See All
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={handleAdd}
                        className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors h-7 px-3 hover:bg-primary/10 border border-primary/20 rounded-full whitespace-nowrap"
                    >
                        + Add Event
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {events.length > 0 ? (
                    events.slice(0, maxItems || events.length).map((event, idx) => {
                        const isOwner = event.created_by === goalieId;
                        const isPast = event.status === 'past' || new Date(event.date) < new Date();

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => window.location.href = `/events/${event.id}`}
                                className="bg-secondary/30 border border-border/50 rounded-2xl p-4 flex items-center justify-between group hover:bg-secondary/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-all ${
                                        event.video_id ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black'
                                    }`}>
                                        {event.video_id ? <Film size={20} /> : <QrCode size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-foreground text-sm truncate">{event.name}</h4>
                                        <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                <Calendar size={12} />
                                                {new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                            {isPast && event.video_id && (
                                                <span className="flex items-center gap-1 text-primary font-bold">
                                                    <Database size={10} />
                                                    {event.is_charted ? 'Charted' : 'Processing Film'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isPast && !event.video_id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUploadFilm?.(event.id);
                                            }}
                                            className="h-8 px-4 bg-white text-black border border-zinc-200 dark:border-transparent dark:bg-primary dark:text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-all flex items-center shadow-sm"
                                        >
                                            <Video size={10} className="mr-1.5" fill="currentColor" />
                                            Film
                                        </button>
                                    )}
                                    {isOwner && !isPast && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleEdit(e, event)}
                                            className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 h-auto bg-primary/5 hover:bg-primary/20 text-primary border border-primary/20"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    <Badge variant={event.status === 'open' ? 'default' : (isPast ? 'outline' : 'secondary')} className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 whitespace-nowrap">
                                        {isPast ? 'Completed' : event.status}
                                    </Badge>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-secondary/10 border border-dashed border-border rounded-2xl">
                        <Calendar className="text-muted-foreground mb-3 opacity-20" size={32} />
                        <p className="text-xs text-muted-foreground font-medium">No upcoming events scheduled.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Use "+ Add Event" to log a game or practice.</p>
                    </div>
                )}
            </div>

            <EventModal
                isOpen={showEventModal}
                onClose={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                }}
                onAdded={() => onEventAdded?.()}
                defaultSport={sport}
                goalieId={goalieId}
                editEvent={editingEvent}
            />
        </div>
    );
}
