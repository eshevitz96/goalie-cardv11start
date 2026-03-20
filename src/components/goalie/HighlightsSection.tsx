import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/context/ToastContext';
import { X, Video, Plus, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface HighlightsSectionProps {
    rosterId: string;
}

export function HighlightsSection({ rosterId }: HighlightsSectionProps) {
    const toast = useToast();
    const [showModal, setShowModal] = useState(false);
    const [uploadMode, setUploadMode] = useState<'link' | 'file'>('link');
    const [url, setUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async () => {
        setLoading(true);
        
        if (uploadMode === 'link') {
            if (!url) return;
            const { error } = await supabase.from('highlights').insert({
                roster_id: rosterId,
                url: url,
                description: "Goalie Highlight"
            });

            setLoading(false);
            if (error) {
                toast.error("Error adding video: " + error.message);
            } else {
                toast.success("Highlight Added!");
                setShowModal(false);
                setUrl('');
            }
        } else {
            if (!selectedFile) return;
            // Simulate file upload
            for (let i = 0; i <= 100; i += 10) {
                setUploadProgress(i);
                await new Promise(r => setTimeout(r, 200));
            }
            
            const { error } = await supabase.from('highlights').insert({
                roster_id: rosterId,
                url: "local_upload", // Placeholder for storage URL
                description: selectedFile.name
            });

            setLoading(false);
            if (error) {
                toast.error("Error saving file record: " + error.message);
            } else {
                toast.success("Video Uploaded Successfully!");
                setShowModal(false);
                setSelectedFile(null);
                setUploadProgress(0);
            }
        }
    };

    return (
        <>
            <div className="glass rounded-3xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Video size={18} className="text-primary" /> Highlights
                    </h3>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary hover:text-primary-foreground transition-colors border-none cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add Video
                    </button>
                </div>
                <div className="text-center text-muted-foreground text-xs py-4">
                    Share game clips for coach review.
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[201] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                                    <Video size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Add Highlight</h3>
                                
                                {/* Upload Mode Toggle */}
                                <div className="flex bg-white/5 p-1 rounded-xl mt-4 w-full">
                                    <button 
                                        onClick={() => setUploadMode('link')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${uploadMode === 'link' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                    >
                                        Link
                                    </button>
                                    <button 
                                        onClick={() => setUploadMode('file')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                    >
                                        File
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {uploadMode === 'link' ? (
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            <LinkIcon size={14} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                                            {selectedFile ? (
                                                <span className="text-xs font-bold text-white truncate px-4">{selectedFile.name}</span>
                                            ) : (
                                                <>
                                                    <Video size={24} className="text-muted-foreground mb-2" />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select MP4/MOV</span>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="video/mp4,video/quicktime"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                        {loading && (
                                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${uploadProgress}%` }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button 
                                onClick={handleSubmit}
                                disabled={loading || (uploadMode === 'link' ? !url : !selectedFile)}
                                className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20"
                            >
                                {loading ? "Processing..." : "Save Highlight"}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
