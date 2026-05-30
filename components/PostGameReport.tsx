"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote, Star, Video, Maximize2, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export interface FeedbackItem {
    id: string | number;
    date: string;
    coach: string;
    title: string;
    content: string;
    rating: number;
    hasVideo: boolean;
}

interface PostGameReportProps {
    report?: FeedbackItem[];
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

export function PostGameReport({ report = [], isExpanded = false, onToggleExpand }: PostGameReportProps) {
    const [showAll, setShowAll] = useState(false);

    // Filter out invalid/empty reports if necessary, or just use all
    const validReports = report;
    const displayedReports = (showAll || isExpanded) ? validReports : validReports.slice(0, 1);

    /* -------------------------------------------------------------------------- */
    /*                                CONCISE VIEW                                */
    /* -------------------------------------------------------------------------- */
    if (!isExpanded && onToggleExpand) {
        const latestReport = validReports[0];
        return (
            <motion.div
                layoutId="notes-card"
                className="bg-card/50 border border-border rounded-3xl p-5 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                onClick={onToggleExpand}
            >
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg text-blue-500 group-hover:from-blue-500 group-hover:to-purple-500 group-hover:text-white transition-all">
                            <MessageSquareQuote size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground">Coach's Notes</h3>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-2">
                    {latestReport ? (
                        <div className="pl-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-foreground">{latestReport.coach}</span>
                                <span className="text-[10px] text-muted-foreground">• {latestReport.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 pl-4 border-l-2 border-primary/20">
                                "{latestReport.content}"
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground pl-1">No notes available yet.</p>
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
            layoutId="notes-card"
            className="space-y-4 bg-card border border-border rounded-3xl p-6 shadow-2xl relative"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <MessageSquareQuote className="text-primary" />
                    <h3 className="text-xl font-bold text-foreground">Coach's Coach</h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* Only show internal toggle if NOT controlled by parent expansion mode, roughly */}
                    {!onToggleExpand && validReports.length > 1 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                            {showAll ? "Show Less" : "View All History"}
                        </button>
                    )}
                    {onToggleExpand && (
                        <button
                            onClick={onToggleExpand}
                            className="bg-secondary hover:bg-muted text-foreground p-2 rounded-xl transition-colors"
                            title="Close Notes"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {validReports.length === 0 ? (
                <div className="text-center p-8 border border-border border-dashed rounded-2xl text-muted-foreground text-sm">
                    No recent feedback reports.
                </div>
            ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {displayedReports.map((item, index) => {
                        // Fix for S0 L0 display: If title contains "Session 0 • Lesson 0", purely replace it or format it nicer.
                        const cleanTitle = item.title.replace("Session 0 • Lesson 0", "Evaluation Session");

                        return (
                            <Link href={`/events/${item.id}?type=session`} passHref legacyBehavior key={item.id}>
                                <motion.a
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center font-bold text-xs text-foreground">
                                                {item.coach.split(" ")[1] ? item.coach.split(" ")[1][0] : item.coach[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-foreground leading-none group-hover:text-primary transition-colors">{item.coach}</div>
                                                <div className="text-xs text-muted-foreground">{item.date}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    className={i < item.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <h4 className="text-base font-bold text-foreground mb-1 group-hover:underline decoration-primary underline-offset-4">{cleanTitle}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                        "{item.content}"
                                    </p>

                                    {item.hasVideo && (
                                        <button className="w-full py-2 bg-muted/50 hover:bg-muted rounded-lg text-xs font-semibold text-primary flex items-center justify-center gap-2 transition-colors border border-dashed border-border hover:border-primary/50">
                                            <Video size={14} />
                                            Watch Session Highlights
                                        </button>
                                    )}
                                </motion.a>
                            </Link>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}

