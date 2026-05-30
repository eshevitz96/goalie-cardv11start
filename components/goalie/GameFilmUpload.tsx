"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, BarChart2, Eye, CheckCircle, AlertCircle, X, Brain } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { supabase } from "@/utils/supabase/client";

interface GameFilmUploadProps {
    rosterId: string;
    sport: string;
    title?: string;
    events?: { id: string; name: string }[];
    onUploadComplete?: (data: any) => void;
}

export function GameFilmUpload({ rosterId, sport, title = "Game Film Analysis", events = [], onUploadComplete }: GameFilmUploadProps) {
    const [stage, setStage] = useState<'event' | 'upload'>(events.length === 0 ? 'event' : 'event'); // Force event selection check
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [analysisType, setAnalysisType] = useState<'shot' | 'play' | null>(null);
    const [associatedEventId, setAssociatedEventId] = useState(events.length > 0 ? events[0].id : '');
    const [isCreatingNewEvent, setIsCreatingNewEvent] = useState(events.length === 0);
    const [newEventData, setNewEventData] = useState({ name: '', type: 'game' as const, date: new Date().toISOString().split('T')[0], location: '' });
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(Array.from(e.target.files));
            setUploadProgress(0);
            setShowSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || !analysisType) return;
        
        // 1. Determine Event ID (Create New if needed)
        let targetEventId = associatedEventId;
        
        setIsUploading(true);
        setUploadProgress(0);

        try {
            if (isCreatingNewEvent) {
                const { createEvent } = await import("@/app/actions");
                const res = await createEvent(rosterId, { 
                    name: newEventData.name, 
                    type: newEventData.type, 
                    date: new Date(newEventData.date).toISOString(), 
                    location: newEventData.location,
                    sport: sport
                });
                if (!res.success) throw new Error(res.error);
                targetEventId = res.event.id;
            }

            if (!targetEventId) throw new Error("No Event ID found. Please select or create an event.");

            // 2. Upload Files
            const MAX_FILE_SIZE = 50 * 1024 * 1024;
            const oversized = selectedFiles.find(f => f.size > MAX_FILE_SIZE);
            if (oversized) throw new Error(`File ${oversized.name} is too large (>50MB).`);

            const publicUrls: string[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${rosterId}_${Date.now()}_clip${i}.${fileExt}`;
                
                const { error } = await supabase.storage
                    .from('game-film')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('game-film')
                    .getPublicUrl(fileName);
                
                publicUrls.push(publicUrl);
                setUploadProgress(((i + 1) / selectedFiles.length) * 100);
            }

            setIsUploading(false);
            setShowSuccess(true);
            if (onUploadComplete) onUploadComplete({ 
                type: analysisType, 
                url: publicUrls.join(','), 
                eventId: targetEventId 
            });
            
        } catch (error: any) {
            console.error("Upload Error:", error);
            alert("Workflow Error: " + error.message);
            setIsUploading(false);
        }
    };

    return (
        <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden bg-card/60">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Film size={84} className="text-foreground" />
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Film size={24} />
                </div>
                <div>
                    <h3 className="font-black text-xl text-foreground tracking-tight leading-none uppercase">{title}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Step {stage === 'event' ? '1' : '2'}: {stage === 'event' ? 'Event Context' : 'File Pipeline'}</p>
                </div>
            </div>

            <div className="space-y-6">
                {stage === 'event' ? (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                        <div className="bg-background/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Which session are we analyzing?</span>
                                {events.length > 0 && !isCreatingNewEvent && (
                                    <button 
                                        onClick={() => setIsCreatingNewEvent(true)}
                                        className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest"
                                    >
                                        + Add New
                                    </button>
                                )}
                            </div>
                            
                            {events.length > 0 && !isCreatingNewEvent ? (
                                <div className="space-y-4">
                                    <select
                                        value={associatedEventId}
                                        onChange={(e) => setAssociatedEventId(e.target.value)}
                                        className="w-full bg-card/50 border border-white/10 rounded-xl px-4 py-4 text-xs font-bold uppercase tracking-widest text-foreground outline-none transition-all focus:ring-1 focus:ring-primary h-auto"
                                    >
                                        <option value="">Select Existing...</option>
                                        {events.map((e) => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={() => setIsCreatingNewEvent(true)}
                                        className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        Or Create New Game Entry
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input 
                                            placeholder="Opponent / Event Name (e. Ranger)"
                                            value={newEventData.name}
                                            onChange={(e) => setNewEventData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-card/50 border border-white/10 rounded-xl px-4 py-3 placeholder:text-muted-foreground/30 text-xs font-bold uppercase tracking-widest outline-none transition-all focus:border-primary/50"
                                        />
                                        <select 
                                            value={newEventData.type}
                                            onChange={(e) => setNewEventData(prev => ({ ...prev, type: e.target.value as any }))}
                                            className="w-full bg-card/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-all focus:border-primary/50"
                                        >
                                            <option value="game">Game Session</option>
                                            <option value="practice">Training / Practice</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input 
                                            type="date"
                                            value={newEventData.date}
                                            onChange={(e) => setNewEventData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-card/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-all focus:border-primary/50"
                                        />
                                        <input 
                                            placeholder="Location (Home/Away)"
                                            value={newEventData.location}
                                            onChange={(e) => setNewEventData(prev => ({ ...prev, location: e.target.value }))}
                                            className="w-full bg-card/50 border border-white/10 rounded-xl px-4 py-3 placeholder:text-muted-foreground/30 text-xs font-bold uppercase tracking-widest outline-none transition-all focus:border-primary/50"
                                        />
                                    </div>
                                    {events.length > 0 && (
                                        <button 
                                            onClick={() => setIsCreatingNewEvent(false)}
                                            className="text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                                        >
                                            ← Use Existing Event
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button 
                            disabled={!isCreatingNewEvent && !associatedEventId || (isCreatingNewEvent && !newEventData.name)}
                            onClick={() => setStage('upload')}
                            className="w-full py-6 bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-20"
                        >
                            Next: Upload Sequence <ArrowRight size={14} className="ml-2" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Context: {isCreatingNewEvent ? newEventData.name || 'New Session' : events.find(e => e.id === associatedEventId)?.name}</span>
                            <button onClick={() => setStage('event')} className="text-[9px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest">Edit Event</button>
                        </div>

                        {selectedFiles.length === 0 ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-video rounded-3xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-4 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-all shadow-sm">
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-black uppercase tracking-[0.3em] block">Select Clips</span>
                                    <span className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.4em] font-black mt-2">Hold Shift for batch</span>
                                </div>
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} accept="video/*" className="hidden" />
                            </button>
                        ) : (
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-6 flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <Film size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black uppercase tracking-widest">{selectedFiles.length} Assets Staged</div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB Payload</div>
                                </div>
                                <button onClick={() => setSelectedFiles([])} className="p-3 bg-white/5 rounded-xl text-muted-foreground hover:text-red-500 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setAnalysisType('shot')} disabled={isUploading} className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 group ${analysisType === 'shot' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                <BarChart2 size={20} className={analysisType === 'shot' ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-primary'} />
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Shot Data</div>
                                    <div className="text-[8px] font-bold text-muted-foreground uppercase opacity-40 mt-1">Biometry tracking</div>
                                </div>
                            </button>

                            <button onClick={() => setAnalysisType('play')} disabled={isUploading} className={`p-6 rounded-2xl border transition-all text-left flex flex-col gap-3 group ${analysisType === 'play' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                <Eye size={20} className={analysisType === 'play' ? 'text-blue-500' : 'text-muted-foreground/40 group-hover:text-blue-500'} />
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest">Play Data</div>
                                    <div className="text-[8px] font-bold text-muted-foreground uppercase opacity-40 mt-1">Tactical Analysis</div>
                                </div>
                            </button>
                        </div>

                        <div className="pt-4">
                            <AnimatePresence mode="wait">
                                {showSuccess ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle size={20} /> Film Synced for Processing
                                    </motion.div>
                                ) : isUploading ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <span>Processing...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <ProgressBar value={uploadProgress} height="h-2" />
                                    </div>
                                ) : (
                                    <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || !analysisType} className="w-full py-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-3xl shadow-2xl hover:scale-[1.05] transition-all disabled:opacity-20">
                                        <Brain size={18} className="mr-2" /> Initialize Advanced Charting
                                    </Button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);
