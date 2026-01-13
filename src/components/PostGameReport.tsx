"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote, Star, Video } from "lucide-react";

export interface FeedbackItem {
    id: number;
    date: string;
    coach: string;
    title: string;
    content: string;
    rating: number;
    hasVideo: boolean;
}

interface PostGameReportProps {
    report?: FeedbackItem[];
}

export function PostGameReport({ report = [] }: PostGameReportProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <MessageSquareQuote className="text-primary" />
                <h3 className="text-xl font-bold text-white">Coach's Corner</h3>
            </div>

            {report.length === 0 ? (
                <div className="text-center p-8 border border-zinc-800 border-dashed rounded-2xl text-zinc-500 text-sm">
                    No recent feedback reports.
                </div>
            ) : (
                <div className="space-y-4">
                    {report.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                                        {item.coach.split(" ")[1] ? item.coach.split(" ")[1][0] : item.coach[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white leading-none">{item.coach}</div>
                                        <div className="text-xs text-zinc-500">{item.date}</div>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            className={i < item.rating ? "fill-amber-500 text-amber-500" : "text-zinc-700"}
                                        />
                                    ))}
                                </div>
                            </div>

                            <h4 className="text-base font-bold text-white mb-1">{item.title}</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                "{item.content}"
                            </p>

                            {item.hasVideo && (
                                <button className="w-full py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-primary flex items-center justify-center gap-2 transition-colors border border-dashed border-zinc-700 hover:border-primary/50">
                                    <Video size={14} />
                                    Watch Session Highlights
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
