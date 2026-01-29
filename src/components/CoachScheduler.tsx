"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { Calendar, Clock, Plus, Trash2, Bell } from "lucide-react";
import { motion } from "framer-motion";

export function CoachScheduler() {
    const [slots, setSlots] = useState<any[]>([]);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [notifying, setNotifying] = useState(false);

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('coach_availability')
            .select('*')
            .eq('coach_id', user.id)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (data) setSlots(data);
    };

    const handleAddSlot = async () => {
        if (!date || !time) return alert("Please pick date and time");
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return alert("Not logged in");
        }

        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour default

        const { error } = await supabase.from('coach_availability').insert({
            coach_id: user.id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString()
        });

        if (error) {
            alert(error.message);
        } else {
            fetchSlots();
            // Optional: clear inputs?
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('coach_availability').delete().eq('id', id);
        if (!error) fetchSlots();
    };

    const handleBlastNotification = async () => {
        setNotifying(true);
        // Create a broadcast notification (user_id = null for all, or we could loop through roster)
        const { error } = await supabase.from('notifications').insert({
            title: "New Schedule Dropped! 📅",
            message: "Coach has set availability for the week. Secure your spot now!",
            type: "schedule"
        });

        if (error) {
            alert("Error sending blast: " + error.message);
        } else {
            alert("Parents notified successfully!");
        }
        setNotifying(false);
    };

    return (
        <div className="glass rounded-3xl p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Calendar className="text-primary" size={20} />
                        Manage Availability
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">Set your training hours for the week</p>
                </div>
                <button
                    onClick={handleBlastNotification}
                    disabled={notifying}
                    className="flex items-center gap-2 bg-muted hover:bg-foreground hover:text-background text-foreground text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-border"
                >
                    <Bell size={14} className={notifying ? "animate-swing" : ""} />
                    {notifying ? "Sending..." : "Notify Parents"}
                </button>
            </div>

            {/* Add Slot Form */}
            <div className="flex gap-2 mb-6 p-4 bg-muted/50 rounded-xl border border-border">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <button
                    onClick={handleAddSlot}
                    disabled={loading}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
                >
                    <Plus size={16} /> Add
                </button>
            </div>

            {/* Slots List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {slots.length === 0 ? (
                    <div className="text-center text-muted-foreground text-xs py-4">No upcoming slots set.</div>
                ) : (
                    slots.map(slot => (
                        <motion.div
                            layout
                            key={slot.id}
                            className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg group hover:border-primary/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-md text-muted-foreground">
                                    <Clock size={14} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-foreground">
                                        {new Date(slot.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(slot.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-2"
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
