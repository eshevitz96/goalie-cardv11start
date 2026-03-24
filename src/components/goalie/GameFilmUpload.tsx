"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, BarChart2, Eye, CheckCircle, AlertCircle, X, Brain } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { supabase } from "@/utils/supabase/client";

interface GameFilmUploadProps {
    rosterId: string;
    title?: string;
    events?: { id: string; name: string }[];
    onUploadComplete?: (data: any) => void;
}

export function GameFilmUpload({ rosterId, title = "Game Film Analysis", events = [], onUploadComplete }: GameFilmUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<'shot' | 'play' | null>(null);
    const [associatedEventId, setAssociatedEventId] = useState(events.length > 0 ? events[0].id : '');
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setUploadProgress(0);
            setShowSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !analysisType) return;
        setIsUploading(true);
        setUploadProgress(0);

        const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
        if (selectedFile.size > MAX_FILE_SIZE) {
            alert("File is too large. Maximum size is 500MB. Please use a shorter clip or compress the video.");
            setIsUploading(false);
            return;
        }

        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${rosterId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Real Supabase Upload
            const { data, error } = await supabase.storage
                .from('game-film')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            setUploadProgress(100);

            const { data: { publicUrl } } = supabase.storage
                .from('game-film')
                .getPublicUrl(filePath);

            setIsUploading(false);
            setShowSuccess(true);
            if (onUploadComplete) onUploadComplete({ file: selectedFile, type: analysisType, url: publicUrl, eventId: associatedEventId });
            
        } catch (error: any) {
            console.error("Upload Error:", error);
            alert("Upload failed: " + error.message);
            setIsUploading(false);
        }
    };

    return (
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Film size={84} className="text-foreground" />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Film size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-foreground leading-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground">Upload film for AI-powered technical breakdown</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* 1. File Selection */}
                {!selectedFile ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-sm">
                            <Upload size={24} />
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-bold block">Select Game Film</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">MP4, MOV, WebM</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="video/*"
                            className="hidden"
                        />
                    </button>
                ) : (
                    <div className="relative rounded-2xl border border-border bg-muted/20 p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-primary shadow-inner">
                            <Film size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{selectedFile.name}</div>
                            <div className="text-[10px] text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* 2. Analysis Types */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setAnalysisType('shot')}
                        disabled={isUploading}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${analysisType === 'shot'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card/50 hover:border-border-foreground/20'
                            }`}
                    >
                        <BarChart2 size={18} className={analysisType === 'shot' ? 'text-primary' : 'text-muted-foreground'} />
                        <div>
                            <div className="text-sm font-bold">Shot Analysis</div>
                            <div className="text-[10px] text-muted-foreground">Biometry + Tracking</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setAnalysisType('play')}
                        disabled={isUploading}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${analysisType === 'play'
                            ? 'border-blue-500 bg-blue-500/5'
                            : 'border-border bg-card/50 hover:border-border-foreground/20'
                            }`}
                    >
                        <Eye size={18} className={analysisType === 'play' ? 'text-blue-500' : 'text-muted-foreground'} />
                        <div>
                            <div className="text-sm font-bold">Play Analysis</div>
                            <div className="text-[10px] text-muted-foreground">Tactical + Coach-Eye</div>
                        </div>
                    </button>
                </div>

                {/* 2.5 Event Allocation */}
                {events.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Allocate to Event</label>
                        <select
                            value={associatedEventId}
                            onChange={(e) => setAssociatedEventId(e.target.value)}
                            className="w-full bg-card/50 border border-border rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                        >
                            <option value="">No specific event</option>
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* 3. Upload Action */}
                <div className="pt-2">
                    <AnimatePresence mode="wait">
                        {showSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-500 font-bold text-sm"
                            >
                                <CheckCircle size={18} /> Film Uploaded for Processing
                            </motion.div>
                        ) : isUploading ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <ProgressBar value={uploadProgress} height="h-2" />
                            </div>
                        ) : (
                            <Button
                                onClick={handleUpload}
                                disabled={!selectedFile || !analysisType}
                                className="w-full py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-foreground/5 disabled:opacity-50"
                            >
                                <Brain size={16} className="mr-2" /> Start AI Analysis
                            </Button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
