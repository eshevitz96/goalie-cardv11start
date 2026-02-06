"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";

export default function LogSession() {
    const params = useParams(); // params.id is the Goalie (Roster) ID or Profile ID? Usually we link to Roster ID for coaches.
    const router = useRouter();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [goalieName, setGoalieName] = useState("");
    const [goalieProfileId, setGoalieProfileId] = useState<string | null>(null);

    // Form State matching User's Table
    const [formData, setFormData] = useState({
        sessionNumber: 1,
        lessonNumber: 1,
        startTime: "",
        endTime: "",
        location: "", // E.g. "Rink A"
        notes: "",
        date: new Date().toISOString().split('T')[0],
    });

    // Fetch Goalie Details on Mount
    useEffect(() => {
        const fetchGoalie = async () => {
            if (!params.id) return;

            // 1. Try to find in roster_uploads first (common for coaches)
            const { data: rosterData, error: rosterError } = await supabase
                .from('roster_uploads')
                .select('goalie_name, session_count, lesson_count, assigned_unique_id, email')
                .eq('id', params.id)
                .single();

            if (rosterData) {
                setGoalieName(rosterData.goalie_name || "Unknown Goalie");
                setFormData(prev => ({
                    ...prev,
                    sessionNumber: (rosterData.session_count || 0) + 1,
                    lessonNumber: (rosterData.lesson_count || 0) + 1
                }));

                // Try to find linked profile ID for the foreign key
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', rosterData.email)
                    .single();

                if (profileData) setGoalieProfileId(profileData.id);
            } else {
                console.error("Goalie not found in roster:", rosterError);
            }
            setLoading(false);
        };

        fetchGoalie();
    }, [params.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Helper to combine date + time
            const getFullTimestamp = (timeStr: string) => {
                if (!timeStr) return null;
                const [hours, minutes] = timeStr.split(':');
                const d = new Date(formData.date);
                d.setHours(Number(hours));
                d.setMinutes(Number(minutes));
                return d.toISOString();
            };

            // 1. Insert into sessions table
            const { error: insertError } = await supabase
                .from('sessions')
                .insert({
                    goalie_id: goalieProfileId, // Can be null if not registered
                    roster_id: params.id, // Link to roster entry
                    session_number: Number(formData.sessionNumber),
                    lesson_number: Number(formData.lessonNumber),
                    // Convert "HH:MM" to full timestamp
                    start_time: getFullTimestamp(formData.startTime),
                    end_time: getFullTimestamp(formData.endTime),
                    location: formData.location,
                    date: new Date(formData.date).toISOString(), // Ensure standard ISO format
                    notes: formData.notes,
                    is_active: false // Completed
                });

            if (insertError) {
                throw insertError;
            }

            // 2. Update Roster Counts
            const { error: updateError } = await supabase
                .from('roster_uploads')
                .update({
                    session_count: Number(formData.sessionNumber),
                    lesson_count: Number(formData.lessonNumber)
                })
                .eq('id', params.id);

            if (updateError) throw updateError;

            toast.success("Session Logged Successfully!");
            router.push('/coach');

        } catch (err: any) {
            toast.error("Error logging session: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/coach"
                        className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Entry Log</div>
                        <h1 className="text-2xl font-black italic tracking-tighter">
                            LOG <span className="text-primary">DATA</span>
                        </h1>
                    </div>
                </div>

                {/* Data Entry Form */}
                <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">

                    {/* Goalie Name (Read Only) */}
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Goalie</label>
                        <input
                            type="text"
                            value={goalieName}
                            disabled
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed font-bold"
                        />
                    </div>

                    {/* Counts Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session #</label>
                            <input
                                name="sessionNumber"
                                type="number"
                                value={formData.sessionNumber}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lesson #</label>
                            <input
                                name="lessonNumber"
                                type="number"
                                value={formData.lessonNumber}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono"
                            />
                        </div>
                    </div>

                    {/* Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Start Time</label>
                            <input
                                name="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">End Time</label>
                            <input
                                name="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Location & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                            <input
                                name="location"
                                type="text"
                                placeholder="e.g. Rink A"
                                value={formData.location}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                            <input
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Notes</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Session details..."
                            className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    <Button
                        disabled={submitting}
                        className="w-full py-4 bg-primary rounded-xl font-bold text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 h-auto"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Save Entry</>}
                    </Button>

                </form>
            </div>
        </main>
    );
}
