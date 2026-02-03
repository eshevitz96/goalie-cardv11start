"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Save, Smile, Frown, Meh, Maximize2, Minimize2, ChevronRight, X } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface Reflection {
    id: string;
    title: string;
    content: string;
    mood: 'happy' | 'frustrated' | 'neutral' | string;
    created_at: string;
    author_role?: 'goalie' | 'parent' | 'coach';
}

interface ReflectionsProps {
    rosterId: string;
    currentUserRole?: 'goalie' | 'parent' | 'coach';
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    prefill?: string | null;
}

export function Reflections({ rosterId, currentUserRole = 'goalie', isExpanded = false, onToggleExpand, prefill }: ReflectionsProps) {
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [isWriting, setIsWriting] = useState(false);
    const [newReflection, setNewReflection] = useState<any>({
        title: "",
        content: "",
        mood: "neutral",
        activity_type: null,
        skip_reason: null,
        injury_details: null,
        injury_expected_return: null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!rosterId) return;
        fetchReflections();
    }, [rosterId]);

    useEffect(() => {
        if (prefill) {
            setIsWriting(true);
            setNewReflection((prev: any) => ({
                ...prev,
                activity_type: 'practice', // Assume practice context
                content: `Completed recommended protocol: ${prefill}.`
            }));
        }
    }, [prefill]);

    // Reset writing state only when collapsed manually, NOT when prefill opens it
    useEffect(() => {
        if (!isExpanded && !prefill) setIsWriting(false);
    }, [isExpanded, prefill]);

    const fetchReflections = async () => {
        // DEMO BYPASS
        if (rosterId && rosterId.startsWith('demo-')) {
            const saved = localStorage.getItem('demo_reflections');
            if (saved) {
                setReflections(JSON.parse(saved));
            } else {
                // Initial Demo Data
                const initial = [
                    { id: '1', title: 'Great Game', content: 'Felt good tracking the puck today.', mood: 'happy', created_at: new Date(Date.now() - 86400000).toISOString() }
                ];
                setReflections(initial);
                localStorage.setItem('demo_reflections', JSON.stringify(initial));
            }
            return;
        }

        const { data } = await supabase
            .from('reflections')
            .select('*')
            .eq('roster_id', rosterId)
            .order('created_at', { ascending: false });
        if (data) setReflections(data);
    };

    const checkRedFlags = async (text: string) => {
        if (!text) return;
        const flags = ['quit', 'pain', 'hurt', 'depressed', 'hate', 'give up'];
        const found = flags.filter(f => text.toLowerCase().includes(f));

        if (found.length > 0) {
            // Trigger Safety Protocol
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !rosterId.startsWith('demo-')) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: "⚠️ Wellness Check Suggestion",
                    message: `Goalie entry flagged for keywords: "${found.join(', ')}". Please check in with them.`,
                    type: 'alert'
                });
            } else if (rosterId.startsWith('demo-')) {
                console.log("Demo Safety Alert Triggered for:", found);
            }
        }
    };

    const handleSave = async () => {
        // Validation
        if (newReflection.activity_type === 'none' && !newReflection.skip_reason) {
            return alert("Please select a reason for your off day.");
        }
        if (newReflection.activity_type !== 'none' && !newReflection.content) {
            return alert("Please write a short reflection.");
        }

        setLoading(true);

        const newEntry: any = {
            id: Math.random().toString(), // local id
            roster_id: rosterId,
            title: newReflection.title || (newReflection.activity_type === 'none' ? 'Off Day' : new Date().toLocaleDateString()),
            content: newReflection.content || (newReflection.skip_reason ? `Reason: ${newReflection.skip_reason}` : "No content"),
            mood: newReflection.mood,
            activity_type: newReflection.activity_type,
            skip_reason: newReflection.skip_reason,
            created_at: new Date().toISOString()
        };

        // DEMO BYPASS
        if (rosterId && rosterId.startsWith('demo-')) {
            const updated = [newEntry, ...reflections];
            setReflections(updated);
            localStorage.setItem('demo_reflections', JSON.stringify(updated));
            localStorage.setItem('demo_latest_mood', newEntry.mood); // Signal to parent
            localStorage.setItem('demo_latest_content', newEntry.content); // Signal text context to AI

            // Dispatch a custom event so parent can listen
            window.dispatchEvent(new Event('demo_reflection_updated'));

            await new Promise(r => setTimeout(r, 600)); // Fake network delay
            checkRedFlags(newReflection.content);
            setIsWriting(false);
            setNewReflection({ title: "", content: "", mood: "neutral", activity_type: null, skip_reason: null });
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('reflections').insert({
            goalie_id: currentUserRole === 'goalie' ? (await supabase.auth.getUser()).data.user?.id : null,
            roster_id: rosterId,
            title: newEntry.title,
            content: newEntry.content,
            mood: newEntry.mood,
            author_role: currentUserRole,
            author_id: (await supabase.auth.getUser()).data.user?.id,
            activity_type: newReflection.activity_type,
            skip_reason: newReflection.skip_reason,
            injury_expected_return: newReflection.injury_expected_return || null,
            injury_details: newReflection.injury_details || null
        });

        // Background Safety Check
        checkRedFlags(newReflection.content);

        if (error) {
            alert("Error saving: " + error.message);
        } else {
            setIsWriting(false);
            setNewReflection({ title: "", content: "", mood: "neutral", activity_type: null, skip_reason: null });
            fetchReflections();
        }
        setLoading(false);
    };

    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'happy': return <Smile className="text-foreground" />;
            case 'frustrated': return <Frown className="text-destructive" />;
            case 'neutral': return <Meh className="text-muted-foreground" />;
            default: return <BookOpen className="text-primary" />;
        }
    };

    /* -------------------------------------------------------------------------- */
    /*                                CONCISE VIEW                                */
    /* -------------------------------------------------------------------------- */
    if (!isExpanded && onToggleExpand) {
        const latestInfo = reflections[0];
        return (
            <motion.div
                layoutId="journal-card"
                className="bg-card/50 border border-border rounded-3xl p-5 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                onClick={onToggleExpand}
            >
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Training Journal</h3>
                        </div>
                    </div>
                </div>

                {/* Latest Check-in Summary */}
                <div className="relative z-10 mt-2">
                    {latestInfo ? (
                        <div className="pl-1">
                            <div className="flex items-center gap-2 mb-1">
                                {getMoodIcon(latestInfo.mood)}
                                <span className="text-xs font-bold text-foreground">{latestInfo.title}</span>
                                <span className="text-[10px] text-muted-foreground">• {new Date(latestInfo.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                                "{latestInfo.content}"
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground pl-1">No entries yet. Start a new log.</p>
                    )}
                </div>

                {/* Tap to Expand Hint */}
                <div className="absolute top-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    <Maximize2 size={16} />
                </div>
            </motion.div>
        );
    }


    /* -------------------------------------------------------------------------- */
    /*                                EXPANDED VIEW                               */
    /* -------------------------------------------------------------------------- */
    return (
        <motion.div
            layoutId="journal-card"
            className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden shadow-2xl"
        >
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Training Journal</h3>
                        <p className="text-[10px] text-muted-foreground">Updates your Performance Insight. Log daily.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isWriting ? (
                        <button
                            onClick={() => setIsWriting(true)}
                            className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary/20 text-xs font-bold flex items-center gap-2"
                        >
                            <Plus size={16} /> New Entry
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsWriting(false)}
                            className="bg-secondary hover:bg-muted text-foreground p-2 rounded-xl transition-colors"
                            title="Cancel Entry"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {onToggleExpand && (
                        <button
                            onClick={onToggleExpand}
                            className="bg-secondary hover:bg-muted text-foreground p-2 rounded-xl transition-colors"
                            title="Close Journal"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isWriting && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6 bg-muted/30 rounded-2xl p-4 border border-border overflow-hidden"
                    >
                        <div className="mb-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Did you get on the ice/field today?</label>
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setNewReflection({ ...newReflection, activity_type: 'practice' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${newReflection.activity_type && newReflection.activity_type !== 'none' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-foreground/50'}`}
                                >
                                    Yes, Trained/Played
                                </button>
                                <button
                                    onClick={() => setNewReflection({ ...newReflection, activity_type: 'none' })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${newReflection.activity_type === 'none' ? 'bg-muted text-foreground border-border' : 'border-border hover:border-foreground/50'}`}
                                >
                                    No, Off Day
                                </button>
                            </div>

                            {newReflection.activity_type === 'none' && (
                                <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Reason for rest</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-lg p-2 text-sm mb-2"
                                        value={newReflection.skip_reason || ''}
                                        onChange={e => setNewReflection({ ...newReflection, skip_reason: e.target.value })}
                                    >
                                        <option value="">Select Reason...</option>
                                        <option value="rest">Scheduled Rest / Recovery</option>
                                        <option value="injury">Injury / Rehab</option>
                                        <option value="sick">Sick</option>
                                        <option value="other">Other / Life</option>
                                    </select>

                                    {newReflection.skip_reason === 'injury' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                                            <p className="text-xs text-red-400 mb-2">Recovery is part of the journey. When do you think you'll be back?</p>
                                            <input
                                                type="date"
                                                className="w-full bg-black/20 border border-red-500/30 rounded p-1 text-sm text-foreground mb-2"
                                                onChange={e => setNewReflection({ ...newReflection, injury_expected_return: e.target.value })}
                                            />
                                            <textarea
                                                placeholder="Injury details (e.g. tweaked groin, concussion protocol)..."
                                                className="w-full bg-black/20 border border-red-500/30 rounded p-2 text-xs text-foreground h-16 resize-none focus:outline-none"
                                                onChange={e => setNewReflection({ ...newReflection, injury_details: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {newReflection.activity_type !== 'none' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Title (e.g. Post-Game Thoughts)"
                                        className="w-full bg-transparent border-b border-border p-2 mb-2 text-foreground font-bold focus:outline-none focus:border-primary placeholder:font-normal"
                                        value={newReflection.title}
                                        onChange={(e) => setNewReflection({ ...newReflection, title: e.target.value })}
                                    />
                                    <textarea
                                        className="w-full bg-transparent p-2 text-sm text-foreground focus:outline-none resize-none min-h-[100px]"
                                        placeholder="How did you feel today? What did you improve?..."
                                        value={newReflection.content}
                                        onChange={(e) => setNewReflection({ ...newReflection, content: e.target.value })}
                                        maxLength={300}
                                    />
                                    <div className={`text-[10px] text-right mt-1 font-bold ${newReflection.content.length >= 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {newReflection.content.length} / 300
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                            <div className="flex gap-2">
                                {newReflection.activity_type !== 'none' && ['happy', 'neutral', 'frustrated'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setNewReflection({ ...newReflection, mood: m })}
                                        className={`p-1.5 rounded-lg transition-all ${newReflection.mood === m ? 'bg-muted shadow' : 'opacity-50 hover:opacity-100'}`}
                                    >
                                        {getMoodIcon(m)}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={loading || !newReflection.activity_type || (newReflection.activity_type === 'none' && !newReflection.skip_reason)}
                                    className="bg-foreground text-background px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : <><Save size={14} /> Save Entry</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-2 flex items-center gap-2 relative z-10">
                <div className="h-px bg-border flex-1" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Entry History</span>
                <div className="h-px bg-border flex-1" />
            </div>

            <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {reflections.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">No reflections yet. Start tracking your mental game!</p>
                ) : (
                    reflections.map((ref, idx) => (
                        <motion.div
                            key={ref.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }} // Faster delay
                            className="bg-card/50 hover:bg-muted/50 border border-border/50 rounded-xl p-4 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-foreground">{ref.title}</h4>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    {new Date(ref.created_at).toLocaleDateString()}
                                    {getMoodIcon(ref.mood)}
                                    {ref.author_role === 'parent' && <span className="ml-2 text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Guardian</span>}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                                {ref.content}
                            </p>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
