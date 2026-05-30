"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter, Calendar, BarChart3, Film, ArrowRight, TrendingUp, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { HighlightsSection } from "./HighlightsSection";
import { EventDetailView } from "./EventDetailView";
import { SupportedSport } from "@/types/goalie-v11";
import { Button } from "@/components/ui/Button";

interface FullAnalyticsLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    rosterId: string;
    sport: SupportedSport;
    onAddClips?: (eventId: string) => void;
}

export function FullAnalyticsLibrary({ isOpen, onClose, rosterId, sport, onAddClips }: FullAnalyticsLibraryProps) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [filterSeason, setFilterSeason] = useState('2025-26');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[500] bg-background overflow-hidden flex flex-col pt-12">
                {/* Header Section */}
                <div className="max-w-[1400px] mx-auto w-full px-8 pb-12 flex justify-between items-end border-b border-white/5">
                    <div className="space-y-1">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Library
                        </h1>
                    </div>
                    <div className="flex items-center gap-10 pb-1">
                        <div className="flex flex-col gap-0 items-end">
                            <div className="flex items-center gap-4 relative pr-1 border-b border-foreground/10 pb-2">
                                <select 
                                    value={filterSeason}
                                    onChange={(e) => setFilterSeason(e.target.value)}
                                    className="bg-transparent border-none text-[11px] font-black uppercase tracking-[.3em] text-foreground outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-6"
                                >
                                    <option value="2025-26">2025-26 Season</option>
                                    <option value="2024-25">2024-25 Season</option>
                                    <option value="2023-24">2023-24 Season</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 mb-1" />
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Search & Filters Navigation */}
                <div className="max-w-[1400px] mx-auto w-full px-8 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="text-primary border-b border-primary pb-1">All Assets</span>
                        <span className="hover:text-foreground cursor-pointer transition-colors">Games Only</span>
                        <span className="hover:text-foreground cursor-pointer transition-colors">Practices</span>
                        <span className="hover:text-foreground cursor-pointer transition-colors">Scouted clips</span>
                    </div>
                    <div className="relative w-80 group">
                        <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by opponent or date..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>
                </div>

                {/* Library Scroll Area (Relocated HighlightsSection) */}
                <div className="flex-1 overflow-y-auto px-8 pb-32 pt-4">
                    <div className="max-w-[1400px] mx-auto">
                        <HighlightsSection 
                            rosterId={rosterId} 
                            gridCols={4} 
                            onSelectEvent={(eventId) => setSelectedEventId(eventId)}
                            hideHeader={true}
                        />
                    </div>
                </div>

                {/* Event Detail View (The Drill-Down) */}
                {selectedEventId && (
                    <EventDetailView 
                        isOpen={!!selectedEventId}
                        onClose={() => setSelectedEventId(null)}
                        eventId={selectedEventId}
                        sport={sport}
                        onAddClips={(id) => {
                            onAddClips?.(id);
                            setSelectedEventId(null);
                            onClose();
                        }}
                    />
                )}
            </div>
        </AnimatePresence>
    );
}
