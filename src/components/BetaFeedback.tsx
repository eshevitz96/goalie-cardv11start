"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Meh, Frown, Send, X, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

interface BetaFeedbackProps {
    rosterId?: string;
    userId?: string;
    userRole?: string;
}

export function BetaFeedback({ rosterId, userId, userRole }: BetaFeedbackProps) {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!mood) return;
        setIsSubmitting(true);

        try {
            // Determine user identifier
            const authorId = userId || 'anonymous';

            // We'll use the reflections table since it's already set up for user input
            // Title will distinguish it as System Feedback
            const { error } = await supabase.from('reflections').insert({
                roster_id: rosterId || undefined, // Optional if global feedback
                author_id: userId,
                author_role: userRole || 'tester',
                title: "BETA FEEDBACK",
                content: comment || "No comment provided.",
                mood: mood === 'sad' ? 'frustrated' : mood, // Map 'sad' to 'frustrated' to match enum if needed
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setMood(null);
                setComment("");
            }, 2000);

        } catch (err: any) {
            console.error("Feedback Error:", err);
            toast.error("Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="bg-card border border-border shadow-2xl rounded-2xl w-80 overflow-hidden"
                    >
                        <div className="p-4 bg-primary/10 border-b border-border flex justify-between items-center">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <span className="text-xl">🚀</span> Beta Feedback
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-0 h-auto w-auto hover:bg-transparent"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        {submitted ? (
                            <div className="p-8 text-center space-y-3">
                                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Send size={24} />
                                </div>
                                <h4 className="font-bold text-foreground">Thank You!</h4>
                                <p className="text-xs text-muted-foreground">Your feedback helps us build the best platform for goalies.</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block text-center">How is your experience?</label>
                                    <div className="flex justify-center gap-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setMood('happy')}
                                            className={`p-3 rounded-xl transition-all h-auto w-auto ${mood === 'happy' ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-500/20 hover:bg-green-600' : 'bg-secondary text-muted-foreground hover:bg-green-500/10 hover:text-green-500'}`}
                                        >
                                            <Smile size={28} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setMood('neutral')}
                                            className={`p-3 rounded-xl transition-all h-auto w-auto ${mood === 'neutral' ? 'bg-yellow-500 text-white scale-110 shadow-lg shadow-yellow-500/20 hover:bg-yellow-600' : 'bg-secondary text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-500'}`}
                                        >
                                            <Meh size={28} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setMood('sad')}
                                            className={`p-3 rounded-xl transition-all h-auto w-auto ${mood === 'sad' ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20 hover:bg-red-600' : 'bg-secondary text-muted-foreground hover:bg-red-500/10 hover:text-red-500'}`}
                                        >
                                            <Frown size={28} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comments (Optional)</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Found a bug? Have a suggestion?"
                                        className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none h-24"
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={!mood || isSubmitting}
                                    className="w-full bg-foreground text-background font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-auto"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Submit Feedback <Send size={16} /></>}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-foreground text-background p-4 rounded-full shadow-2xl hover:bg-primary hover:text-white transition-colors flex items-center gap-2 font-bold pr-6 group"
                    >
                        <MessageSquare size={24} />
                        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Feedback</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
