"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode, Film, Database, Video } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/utils/supabase/client";

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
                                                    {event.is_charted ? 'Charted' : 'Processing AI'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isPast && !event.video_id && (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUploadFilm?.(event.id);
                                            }}
                                            className="h-8 px-4 bg-primary text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                                        >
                                            <Video size={10} className="mr-1.5" fill="currentColor" />
                                            Film
                                        </Button>
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

function EventModal({ isOpen, onClose, onAdded, defaultSport, goalieId, editEvent }: {
    isOpen: boolean,
    onClose: () => void,
    onAdded?: () => void,
    defaultSport?: string,
    goalieId?: string,
    editEvent: Event | null
}) {
    // Helper to format date for datetime-local input
    const formatForInput = (dateString: string) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        // Correctly handle local time offset for datetime-local input
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [manualEvent, setManualEvent] = useState({
        type: 'Game',
        name: '',
        date: '',
        location: '',
        scouting_report: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();


    // We use a useEffect to ensure form is updated when opening for edit
    useEffect(() => {
        if (isOpen) {
            if (editEvent) {
                const parts = editEvent.name.split(': ');
                setManualEvent({
                    type: ['Game', 'Practice', 'Training'].includes(parts[0]) ? parts[0] : 'Game',
                    name: parts.length > 1 ? parts.slice(1).join(': ') : editEvent.name,
                    date: formatForInput(editEvent.date),
                    location: editEvent.location,
                    scouting_report: editEvent.scouting_report || ''
                });
            } else {
                setManualEvent({ type: 'Game', name: '', date: '', location: '', scouting_report: '' });
            }
        }
    }, [isOpen, editEvent]);

    const handleSubmit = async () => {
        if (!manualEvent.name || !manualEvent.date) {
            toast("Please fill in required fields.", "error");
            return;
        }
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        const finalName = `${manualEvent.type}: ${manualEvent.name}`;
        // Ensure we parse the date correctly as local time
        const finalDate = new Date(manualEvent.date).toISOString();

        if (editEvent) {
            const { updateEvent } = await import('@/app/events/actions');
            const result = await updateEvent(editEvent.id, {
                name: finalName,
                date: finalDate,
                location: manualEvent.location || 'TBA',
                sport: defaultSport || editEvent.sport || 'Hockey',
                scouting_report: manualEvent.scouting_report
            });

            if (result.success) {
                toast("Event updated successfully!", "success");
                onAdded?.();
                onClose();
            } else {
                toast("Error updating event: " + result.error, "error");
            }
        } else {
            const { addEvent } = await import('@/app/events/actions');
            const result = await addEvent({
                name: finalName,
                date: finalDate,
                location: manualEvent.location || 'TBA',
                sport: defaultSport || 'Hockey',
                scouting_report: manualEvent.scouting_report,
                userId: user?.id
            });

            if (result.success) {
                toast(`${manualEvent.type} Added & Registered!`, "success");
                onAdded?.();
                onClose();
            } else {
                toast("Error adding event: " + result.error, "error");
            }
        }
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!editEvent) return;
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        setIsSubmitting(true);
        try {
            const { deleteEvent } = await import('@/app/events/actions');
            const result = await deleteEvent(editEvent.id);

            if (result.success) {
                toast("Event deleted successfully.", "success");
                onAdded?.();
                onClose();
            } else {
                toast("Error deleting event: " + result.error, "error");
            }
        } catch (err: any) {
            toast("Exception deleting event: " + err.message, "error");
        }
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editEvent ? "Edit Event" : "Add New Event"}>
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
                    <p className="text-[10px] text-muted-foreground mt-1 ml-1 italic">
                        Select your local date and time.
                    </p>
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
                <div>
                    <label className="block text-sm font-medium mb-1">Scouting Report</label>
                    <textarea
                        value={manualEvent.scouting_report}
                        onChange={e => setManualEvent({ ...manualEvent, scouting_report: e.target.value })}
                        placeholder="Log scout feedback or performance notes..."
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 h-24 resize-none text-sm"
                    />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                    <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (editEvent ? "Updating..." : "Adding...") : (editEvent ? "Save Changes" : "Confirm")}
                        </Button>
                    </div>
                    {editEvent && (
                        <button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="text-xs text-red-500 hover:text-red-400 font-bold py-2 transition-colors uppercase tracking-widest"
                        >
                            Delete Event
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
