"use client";

import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, RefreshCw, Calendar, Globe, User, Image as ImageIcon } from 'lucide-react';
import { getFeedbackForCoach, FeedbackSubmission } from '@/app/actions/feedback';
import { Button } from '@/components/ui/Button';

export function CoachFeedbackList() {
    const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFeedback = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getFeedbackForCoach();
            if (res.success) {
                setFeedbackList(res.feedback);
            } else {
                setError(res.error || "Failed to load feedback");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Client Feedback</h2>
                    <p className="text-xs text-muted-foreground">Direct feedback from private training clients</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadFeedback}
                    disabled={loading}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 border border-border"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
            </div>

            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading client feedback...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
                    <p className="text-sm font-semibold text-red-400">{error}</p>
                    <Button size="sm" onClick={loadFeedback} variant="ghost" className="text-xs text-red-300">
                        Retry
                    </Button>
                </div>
            ) : feedbackList.length === 0 ? (
                <div className="py-12 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                    <MessageSquare size={32} className="text-muted-foreground/40" />
                    <h3 className="text-sm font-semibold text-foreground">No Feedback Yet</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                        Private training clients can submit feedback from their account menu or after every 3rd logged session.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {feedbackList.map((item) => (
                        <div
                            key={item.id}
                            className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                                        <User size={14} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-foreground mr-2">
                                            {item.user_name || 'Client'}
                                        </span>
                                        {item.user_email && (
                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                {item.user_email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        item.kind === 'prompt' 
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                        {item.kind === 'prompt' ? 'Session Check-in' : 'Account Menu'}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {item.rating !== null && item.rating !== undefined && (
                                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                    <span>Rating: {item.rating} / 5</span>
                                    <div className="flex items-center ml-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                size={12}
                                                className={s <= (item.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted/40"}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {item.body && (
                                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap bg-secondary/20 p-3 rounded-xl border border-border/40">
                                    {item.body}
                                </div>
                            )}

                            {item.page && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                                    <Globe size={11} /> Submitted from: <code className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded">{item.page}</code>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
