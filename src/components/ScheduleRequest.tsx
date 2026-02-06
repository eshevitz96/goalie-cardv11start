"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, Check, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

interface ScheduleRequestProps {
    rosterId: string;
    goalieName: string;
    coachName: string;
    coachIds?: string[]; // Array of assigned IDs
    sport?: string;
    onCoachUpdate: () => void;
}

export function ScheduleRequest({ rosterId, goalieName, coachName, coachIds = [], sport, onCoachUpdate }: ScheduleRequestProps) {
    const toast = useToast();
    const [isSelectingCoach, setIsSelectingCoach] = useState(false);
    const [coaches, setCoaches] = useState<{ id: string, goalie_name: string, full_name?: string }[]>([]);
    const [loadingCoaches, setLoadingCoaches] = useState(false);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch coaches when opening selection
    useEffect(() => {
        if (isSelectingCoach && coaches.length === 0) {
            setLoadingCoaches(true);
            const query = supabase.from('profiles')
                .select('id, goalie_name, full_name')
                .eq('role', 'coach');

            query.then(({ data, error }) => {
                if (data) setCoaches(data);
                setLoadingCoaches(false);
            });
        }
    }, [isSelectingCoach]);

    const handleToggleCoach = async (coachId: string, currentIds: string[]) => {
        const isSelected = currentIds.includes(coachId);
        let newIds;
        if (isSelected) {
            newIds = currentIds.filter(id => id !== coachId);
        } else {
            newIds = [...currentIds, coachId];
        }

        const { error } = await supabase
            .from('roster_uploads')
            .update({ assigned_coach_ids: newIds })
            .eq('id', rosterId);

        if (error) {
            toast.error("Error updating coaches: " + error.message);
        } else {
            // Keep selection open for multiple picks
            onCoachUpdate();
        }
    };

    const [availableSlots, setAvailableSlots] = useState<{ id: string, start_time: string, coach_name?: string }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState("");

    // Fetch availability when coachIds change
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!coachIds || coachIds.length === 0) {
                setAvailableSlots([]);
                return;
            }

            setLoadingSlots(true);
            const { data, error } = await supabase
                .from('coach_availability')
                .select(`
                    id, 
                    start_time, 
                    coach_id,
                    profiles (goalie_name)
                `)
                .in('coach_id', coachIds)
                .eq('is_booked', false)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (data) {
                // Map to flat structure for easier display
                const slots = data.map((d: any) => ({
                    id: d.id,
                    start_time: d.start_time,
                    coach_id: d.coach_id,
                    coach_name: d.profiles?.goalie_name || "Unknown Coach"
                }));
                setAvailableSlots(slots);
            }
            setLoadingSlots(false);
        };

        fetchAvailability();
    }, [coachIds]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlotId) {
            toast.warning("Please select an available time slot.");
            return;
        }

        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("Please sign in to request a session.");
            setSubmitting(false);
            return;
        }

        const slot = availableSlots.find(s => s.id === selectedSlotId);
        if (!slot) return;

        // Create request (maybe link to slot?)
        // Ideally we should also mark the slot as 'pending' or booked, but for this 'request' flow:
        const { error } = await supabase.from('schedule_requests').insert({
            goalie_id: user.id,
            requested_date: slot.start_time, // Use the real slot time
            note: note,
            // You might want to store the slot_id specifically if you link tables
            // slot_id: slot.id 
        });

        if (error) {
            toast.error("Request Failed: " + error.message);
        } else {
            toast.success("Session Requested Successfully!");
            setNote("");
            setSelectedSlotId("");
        }
        setSubmitting(false);
    };

    return (
        <div className="glass rounded-3xl p-6 relative overflow-visible shadow-xl">
            {/* Decorative elements */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-muted rounded-lg text-foreground">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground">Request Session</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium relative">
                        <span>With:</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSelectingCoach(!isSelectingCoach)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-colors flex items-center gap-1 font-bold h-auto"
                        >
                            {coachName || "Select Coach"}
                            <ChevronRight size={12} className="rotate-90" />
                        </Button>

                        <AnimatePresence>
                            {isSelectingCoach && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 p-2"
                                >
                                    <div className="flex justify-between items-center px-2 py-2 border-b border-border mb-1">
                                        <span className="text-xs font-bold text-foreground">Select Coach</span>
                                        <Button variant="ghost" size="icon" onClick={() => setIsSelectingCoach(false)} className="text-muted-foreground hover:text-white h-auto w-auto p-1"><X size={14} /></Button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {loadingCoaches ? (
                                            <div className="p-4 text-center text-muted-foreground text-xs">Loading...</div>
                                        ) : coaches.length === 0 ? (
                                            <div className="p-4 text-center text-muted-foreground text-xs">No coaches found.</div>
                                        ) : (
                                            coaches.map(coach => {
                                                const isSelected = coachIds.includes(coach.id);
                                                return (
                                                    <Button
                                                        key={coach.id}
                                                        variant="ghost"
                                                        onClick={() => handleToggleCoach(coach.id, coachIds)}
                                                        className="w-full justify-start px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2 group h-auto font-normal"
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border bg-muted group-hover:border-foreground/50'}`}>
                                                            {isSelected && <Check size={10} className="text-primary-foreground" />}
                                                        </div>
                                                        <div className="flex-1 truncate">{coach.goalie_name || coach.full_name || "Unknown Coach"}</div>
                                                    </Button>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <form className="space-y-4 relative z-0" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Available Times
                    </label>
                    <div className="relative">
                        <select
                            required
                            value={selectedSlotId}
                            onChange={e => setSelectedSlotId(e.target.value)}
                            disabled={loadingSlots || availableSlots.length === 0}
                            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm appearance-none disabled:opacity-50"
                        >
                            <option value="">
                                {loadingSlots ? "Loading schedule..." :
                                    availableSlots.length === 0 ? (coachIds && coachIds.length > 0 ? "No available times found" : "Select a coach first") :
                                        "-- Select a Time --"}
                            </option>
                            {availableSlots.map((slot: any) => (
                                <option key={slot.id} value={slot.id}>
                                    {slot.coach_name} - {new Date(slot.start_time).toLocaleDateString()} @ {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground rotate-90" size={16} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Notes for Coach
                    </label>
                    <textarea
                        rows={3}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={`Start typing for ${goalieName.split(' ')[0]}...`}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50 resize-none text-sm"
                    />
                </div>

                <Button
                    disabled={submitting}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50 hover:opacity-90 transition-all h-auto"
                >
                    {submitting ? "Sending..." : "Submit Request"}
                    {!submitting && <ChevronRight className="group-hover:translate-x-1 transition-transform" />}
                </Button>
            </form>
        </div>
    );
}
