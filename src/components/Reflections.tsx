"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Save, Smile, Frown, Meh, Maximize2, Minimize2, ChevronRight, X, Paperclip, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface Reflection {
    id: string;
    title: string;
    content: string;
    mood: 'happy' | 'frustrated' | 'neutral' | string;
    created_at: string;
    author_role?: 'goalie' | 'parent' | 'coach';
    file_url?: string;
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
        injury_expected_return: null,
        soreness: 2,
        sleep_quality: 8
    });
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
                content: `Completed protocol for ${new Date().toLocaleDateString()}: ${prefill}.`
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
            .neq('title', 'BETA FEEDBACK')
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
                // console.log("Demo Safety Alert Triggered for:", found);
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
            soreness: newReflection.soreness,
            sleep_quality: newReflection.sleep_quality,
            created_at: new Date().toISOString()
        };

        // DEMO BYPASS
        if (rosterId && rosterId.startsWith('demo-')) {
            if (editingId) {
                // Update existing
                const updatedList = reflections.map(r => r.id === editingId ? { ...r, ...newEntry } : r);
                setReflections(updatedList);
                localStorage.setItem('demo_reflections', JSON.stringify(updatedList));
            } else {
                // Insert new
                const updated = [newEntry, ...reflections];
                setReflections(updated);
                localStorage.setItem('demo_reflections', JSON.stringify(updated));
            }
            localStorage.setItem('demo_latest_mood', newEntry.mood); // Signal to parent
            localStorage.setItem('demo_latest_content', newEntry.content); // Signal text context to AI
            localStorage.setItem('demo_latest_soreness', String(newEntry.soreness));
            localStorage.setItem('demo_latest_sleep', String(newEntry.sleep_quality));

            // Dispatch a custom event so parent can listen
            window.dispatchEvent(new Event('demo_reflection_updated'));

            await new Promise(r => setTimeout(r, 600)); // Fake network delay
            checkRedFlags(newReflection.content);
            setIsWriting(false);
            setEditingId(null);
            setNewReflection({ title: "", content: "", mood: "neutral", activity_type: null, skip_reason: null });
            setLoading(false);
            return;
        }

        // Server Action Submission
        let result;
        const finalFileUrl = selectedFile ? await uploadFile() : (editingId ? reflections.find(r => r.id === editingId)?.file_url : null);

        if (editingId) {
            const { updateReflection } = await import('@/app/actions');
            result = await updateReflection(editingId, rosterId, {
                title: newEntry.title,
                content: newEntry.content,
                mood: newEntry.mood,
                activity_type: newReflection.activity_type,
                skip_reason: newReflection.skip_reason,
                injury_expected_return: newReflection.injury_expected_return || null,
                injury_details: newReflection.injury_details || null,
                file_url: finalFileUrl
            });
        } else {
            const { submitReflection } = await import('@/app/actions');
            result = await submitReflection(rosterId, {
                author_role: currentUserRole,
                title: newEntry.title,
                content: newEntry.content,
                mood: newEntry.mood,
                activity_type: newReflection.activity_type,
                skip_reason: newReflection.skip_reason,
                injury_expected_return: newReflection.injury_expected_return || null,
                injury_details: newReflection.injury_details || null,
                soreness: newReflection.soreness,
                sleep_quality: newReflection.sleep_quality,
                file_url: finalFileUrl
            });
        }

        // Background Safety Check
        checkRedFlags(newReflection.content);

        if (!result.success) {
            alert("Error saving: " + result.error);
        } else {
            setIsWriting(false);
            setEditingId(null);
            setNewReflection({ title: "", content: "", mood: "neutral", activity_type: null, skip_reason: null });
            setSelectedFile(null);
            fetchReflections();
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert("Please select a PDF file.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadFile = async (): Promise<string | null> => {
        if (!selectedFile || !rosterId) return null;
        setUploading(true);
        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${rosterId}_${Date.now()}.${fileExt}`;
            const filePath = `reflections/${fileName}`;

            const { data, error } = await supabase.storage
                .from('reflection-attachments')
                .upload(filePath, selectedFile);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('reflection-attachments')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err: any) {
            console.error("Upload Error:", err);
            alert("Failed to upload file. Entry will be saved without attachment.");
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Modified handleSave to include upload
    const handleSaveWithUpload = async () => {
        let fileUrl = null;
        if (selectedFile) {
            fileUrl = await uploadFile();
        }
        const reflectionWithFile = { ...newReflection, file_url: fileUrl };

        // Re-use logic but with fileUrl
        // I'll actually just integrate this into handleSave directly in the next turn if I can't do it all at once.
        // For now I'll just keep the original handleSave and wrap it.
        // Wait, I should just modify the original handleSave.
        // But multi_replace is safer.
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
                <div className="flex justify-between items-center gap-4 mb-2 relative z-10 flex-nowrap">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">Training Journal</h3>
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
            <div className="flex justify-between items-center gap-4 mb-6 relative z-10 flex-nowrap">
                <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                        <BookOpen size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-foreground flex items-center gap-2 whitespace-nowrap">Journal</h3>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isWriting ? (
                        <>
                            <button
                                onClick={() => setIsWriting(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-colors shadow-lg shadow-primary/20 text-[10px] font-black flex items-center gap-2 whitespace-nowrap shrink-0 h-8"
                            >
                                <Plus size={14} /> New Entry
                            </button>
                            {onToggleExpand && (
                                <button
                                    onClick={onToggleExpand}
                                    className="bg-secondary hover:bg-muted text-foreground p-2 rounded-xl transition-colors h-8 w-8 flex items-center justify-center"
                                    title="Close Journal"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setIsWriting(false);
                                setEditingId(null);
                                setNewReflection({ title: "", content: "", mood: "neutral", activity_type: null, skip_reason: null });
                            }}
                            className="bg-secondary hover:bg-muted text-foreground p-2 rounded-xl transition-colors h-8 w-8 flex items-center justify-center"
                            title="Cancel Entry"
                        >
                            <X size={14} />
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
                        {/* THE V11 READINESS INPUTS */}
                        <div className="grid grid-cols-2 gap-4 mb-6 pt-2">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Body Soreness</label>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${newReflection.soreness > 7 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        {newReflection.soreness}/10
                                    </span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" 
                                    value={newReflection.soreness}
                                    onChange={(e) => setNewReflection({...newReflection, soreness: parseInt(e.target.value)})}
                                    className="w-full accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                    <span>Fresh</span>
                                    <span>Sore</span>
                                </div>
                             </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sleep Quality</label>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${newReflection.sleep_quality < 4 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        {newReflection.sleep_quality}/10
                                    </span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" 
                                    value={newReflection.sleep_quality}
                                    onChange={(e) => setNewReflection({...newReflection, sleep_quality: parseInt(e.target.value)})}
                                    className="w-full accent-primary h-1 bg-border rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                                    <span>Poor</span>
                                    <span>Deep</span>
                                </div>
                             </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Intensity / Session Type</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['game', 'practice', 'training', 'none'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setNewReflection({ ...newReflection, activity_type: type })}
                                        className={`flex-1 min-w-[80px] py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${newReflection.activity_type === type ? (type === 'none' ? 'bg-secondary text-foreground border-border' : 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20') : 'border-border hover:border-foreground/50'}`}
                                    >
                                        {type === 'none' ? 'Off Day' : type}
                                    </button>
                                ))}
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
                                                className="w-full bg-secondary border border-red-500/30 rounded p-1 text-sm text-foreground mb-2"
                                                onChange={e => setNewReflection({ ...newReflection, injury_expected_return: e.target.value })}
                                            />
                                            <textarea
                                                placeholder="Injury details (e.g. tweaked groin, concussion protocol)..."
                                                className="w-full bg-secondary border border-red-500/30 rounded p-2 text-xs text-foreground h-16 resize-none focus:outline-none"
                                                onChange={e => setNewReflection({ ...newReflection, injury_details: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {newReflection.activity_type !== 'none' && (
                                <>
                                    <textarea
                                        className="w-full bg-transparent p-2 text-sm text-foreground focus:outline-none resize-none min-h-[100px] border border-border rounded-xl mt-2"
                                        placeholder="How did you feel today? What did you improve?..."
                                        value={newReflection.content}
                                        onChange={(e) => setNewReflection({ ...newReflection, content: e.target.value })}
                                        autoFocus
                                    />
                                    <div className="mt-3 flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer bg-secondary/50 hover:bg-secondary border border-border px-3 py-1.5 rounded-lg transition-colors group">
                                            <Paperclip size={14} className="text-muted-foreground group-hover:text-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Clip PDF</span>
                                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                                        </label>
                                        {selectedFile && (
                                            <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                                                <FileText size={12} />
                                                <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                                                <button onClick={() => setSelectedFile(null)} className="hover:text-foreground">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                        {uploading && <Loader2 size={14} className="animate-spin text-primary" />}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                            <div className="flex gap-2">
                                {newReflection.activity_type !== 'none' && ['happy', 'neutral', 'frustrated'].map(m => {
                                    const isSelected = newReflection.mood === m;
                                    let borderRing = "";
                                    if (isSelected) {
                                        if (m === 'happy') borderRing = "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background/50 scale-110";
                                        else if (m === 'neutral') borderRing = "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background/50 scale-110";
                                        else if (m === 'frustrated') borderRing = "ring-2 ring-red-500 ring-offset-2 ring-offset-background/50 scale-110";
                                    }

                                    return (
                                        <button
                                            key={m}
                                            onClick={() => setNewReflection({ ...newReflection, mood: m })}
                                            className={`p-1.5 rounded-full transition-all duration-200 ${isSelected ? `bg-muted shadow-lg ${borderRing}` : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                                            title={`Mark as ${m}`}
                                        >
                                            {getMoodIcon(m)}
                                        </button>
                                    );
                                })}
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
                            onClick={() => {
                                setIsWriting(true);
                                setEditingId(ref.id);
                                setNewReflection({
                                    title: ref.title || "",
                                    content: ref.content || "",
                                    mood: ref.mood || "neutral",
                                    activity_type: ref.title === 'Off Day' || !ref.content || ref.content.startsWith('Reason:') ? 'none' : 'practice',
                                    skip_reason: ref.title === 'Off Day' ? (ref.content?.replace('Reason: ', '') || 'other') : null,
                                });
                                // Scroll to top smoothly
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                    {ref.title}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Edit</span>
                                </h4>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                    {new Date(ref.created_at).toLocaleDateString()}
                                    {getMoodIcon(ref.mood)}
                                    {ref.author_role === 'parent' && <span className="ml-2 text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Guardian</span>}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                                {ref.content}
                            </p>
                            {ref.file_url && (
                                <div className="mt-2 flex items-center gap-2">
                                    <a
                                        href={ref.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 hover:bg-primary/20 transition-colors w-fit"
                                    >
                                        <FileText size={12} /> View Attachment
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
