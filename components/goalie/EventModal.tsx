"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { X, Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Event {
    id: string;
    name: string;
    date: string;
    location: string;
    sport?: string;
    status?: string;
    description?: string;
    scouting_report?: string;
    video_id?: string;
    is_charted?: boolean;
    created_by?: string;
}

export function EventModal({ isOpen, onClose, onAdded, defaultSport, goalieId, editEvent }: {
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
    const { success, error } = useToast();

    // We use a useEffect to ensure form is updated when opening for edit
    useEffect(() => {
        if (isOpen) {
            if (editEvent) {
                const nameStr = editEvent.name || "";
                const parts = nameStr.split(': ');
                setManualEvent({
                    type: ['Game', 'Practice', 'Training'].includes(parts[0]) ? parts[0] : 'Game',
                    name: parts.length > 1 ? parts.slice(1).join(': ') : nameStr,
                    date: formatForInput(editEvent.date),
                    location: editEvent.location || "",
                    scouting_report: editEvent.scouting_report || editEvent.description || ''
                });
            } else {
                setManualEvent({ type: 'Game', name: '', date: '', location: '', scouting_report: '' });
            }
        }
    }, [isOpen, editEvent]);

    const handleSubmit = async () => {
        if (!manualEvent.name || !manualEvent.date) {
            error("Please fill in required fields.");
            return;
        }
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        const finalName = `${manualEvent.type}: ${manualEvent.name}`;
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
                success("Event updated successfully!");
                onAdded?.();
                onClose();
            } else {
                error("Error updating event: " + result.error);
            }
        } else {
            const { addEvent } = await import('@/app/events/actions');
            const result = await addEvent({
                name: finalName,
                date: finalDate,
                location: manualEvent.location || 'TBA',
                sport: defaultSport || 'Hockey',
                scouting_report: manualEvent.scouting_report
            });

            if (result.success) {
                success("Event added successfully!");
                onAdded?.();
                onClose();
            } else {
                error("Error adding event: " + result.error);
            }
        }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">{editEvent ? 'Edit Event' : '+ Log New Event'}</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manual entry for performance charting.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                        {['Game', 'Practice', 'Training'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setManualEvent({ ...manualEvent, type })}
                                className={`py-4 px-2 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all ${manualEvent.type === type ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-muted/30 border-border/50 text-muted-foreground hover:border-foreground/30'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Competition / Title</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                placeholder="vs. Wolves, Team Practice..."
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                                value={manualEvent.name}
                                onChange={e => setManualEvent({ ...manualEvent, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Date & Time</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    type="datetime-local"
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-tight focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={manualEvent.date}
                                    onChange={e => setManualEvent({ ...manualEvent, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                <input
                                    placeholder="Arena or Field"
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-tight focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={manualEvent.location}
                                    onChange={e => setManualEvent({ ...manualEvent, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Scouting / Analyst Notes</label>
                        <textarea
                            placeholder="Add game context (e.g. state of the crease, weather, injury notes)..."
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none transition-all min-h-[100px]"
                            value={manualEvent.scouting_report}
                            onChange={e => setManualEvent({ ...manualEvent, scouting_report: e.target.value })}
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? 'Processing...' : (editEvent ? 'Update Record' : 'Create Event Record')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
