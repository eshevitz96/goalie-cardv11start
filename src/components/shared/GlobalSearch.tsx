"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, BookOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface SearchResult {
    id: string;
    type: 'event' | 'reflection' | 'session';
    title: string;
    description: string;
    date: string;
    url: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export function GlobalSearch({ isOpen, onClose, userId }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Handle Keyboard Shortcuts (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                } else {
                    // We need a way to open it from outside typically, but if it's rendered at the layout level we could.
                    // For now, handled by parent component.
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            if (query === '') fetchDefaultResults();
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Perform Search
    useEffect(() => {
        const bounceCount = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else if (query.length === 0 && isOpen) {
                fetchDefaultResults();
            }
        }, 300);
        return () => clearTimeout(bounceCount);
    }, [query, isOpen]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        const term = `%${searchQuery}%`;
        let combinedResults: SearchResult[] = [];

        try {
            // 1. Search Events (Name or Location)
            const { data: events } = await supabase
                .from('events')
                .select('id, name, location, date')
                .or(`name.ilike.${term},location.ilike.${term}`)
                .limit(3);

            if (events) {
                const eventResults = events.map(e => ({
                    id: e.id,
                    type: 'event' as const,
                    title: e.name,
                    description: e.location || 'No Location',
                    date: new Date(e.date).toLocaleDateString(),
                    url: `/events/${e.id}`
                }));
                combinedResults = [...combinedResults, ...eventResults];
            }

            // 2. Search Reflections (If userId provided)
            if (userId) {
                const { data: reflexes } = await supabase
                    .from('reflections')
                    .select('id, mood, notes, created_at')
                    .eq('author_role', 'goalie')
                    // Assuming notes is text, we can ilike search. Mood is an enum usually.
                    .ilike('notes', term)
                    .limit(3);

                if (reflexes) {
                    const reflexResults = reflexes.map(r => ({
                        id: r.id,
                        type: 'reflection' as const,
                        title: `Journal Entry (${r.mood})`,
                        description: r.notes || '',
                        date: new Date(r.created_at).toLocaleDateString(),
                        url: `/goalie` // Or specific journal view if existed
                    }));
                    combinedResults = [...combinedResults, ...reflexResults];
                }
            }

            // 3. Search Coach Notes / Sessions
            // Skip for now to keep simple, or search sessions table notes
            if (userId) {
                // To search sessions we need roster_id link. For simplicity, just search by notes
                const { data: sessions } = await supabase
                    .from('sessions')
                    .select('id, session_number, lesson_number, notes, date')
                    .ilike('notes', term)
                    .limit(3);

                if (sessions) {
                    const sessionResults = sessions.map(s => ({
                        id: s.id,
                        type: 'session' as const,
                        title: `Session ${s.session_number} • Lesson ${s.lesson_number}`,
                        description: s.notes || '',
                        date: new Date(s.date).toLocaleDateString(),
                        url: `/events/${s.id}?type=session`
                    }));
                    combinedResults = [...combinedResults, ...sessionResults];
                }
            }

            // 4. Search Notifications (Aligning logic)
            if (userId) {
                const { data: notifs } = await supabase
                    .from('notifications')
                    .select('id, title, message, created_at, type')
                    .or(`title.ilike.${term},message.ilike.${term}`)
                    .limit(3);

                if (notifs) {
                    const notifResults = notifs.map(n => ({
                        id: n.id,
                        type: 'reflection' as const, // Reusing icon for generic item or create a new type
                        title: `Alert: ${n.title}`,
                        description: n.message || '',
                        date: new Date(n.created_at).toLocaleDateString(),
                        url: n.type === 'event' ? `/events` : `/dashboard/profile` // Basic routing
                    }));
                    combinedResults = [...combinedResults, ...notifResults];
                }
            }

            setResults(combinedResults);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDefaultResults = async () => {
        // Show upcoming events as default state
        setLoading(true);
        const { data: events } = await supabase
            .from('events')
            .select('id, name, location, date')
            .gte('date', new Date().toISOString())
            .order('date', { ascending: true })
            .limit(4);

        if (events) {
            setResults(events.map(e => ({
                id: e.id,
                type: 'event' as const,
                title: e.name,
                description: e.location || 'No Location',
                date: new Date(e.date).toLocaleDateString(),
                url: `/events/${e.id}`
            })));
        }
        setLoading(false);
    };

    const handleResultClick = (url: string) => {
        onClose();
        router.push(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-card border border-border rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Search Input Area */}
                        <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30 relative">
                            <Search className="text-muted-foreground ml-2" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search events, journal, or coach notes..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg h-10"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="p-2 text-muted-foreground hover:text-foreground">
                                    <X size={16} />
                                </button>
                            )}
                            <div className="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 pointer-events-none" style={{ width: loading ? '100%' : '0%', opacity: loading ? 1 : 0 }} />
                        </div>

                        {/* Search Results Area */}
                        <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                            {results.length === 0 && !loading && (
                                <div className="p-8 text-center text-muted-foreground">
                                    {query.length > 0 ? "No results found for that query." : "Type to start searching..."}
                                </div>
                            )}

                            {results.map((result, idx) => (
                                <motion.div
                                    key={`${result.type}-${result.id}-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <button
                                        onClick={() => handleResultClick(result.url)}
                                        className="w-full text-left p-3 flex gap-4 items-center rounded-xl hover:bg-secondary/50 group transition-colors"
                                    >
                                        <div className={`p-3 rounded-lg flex-shrink-0 ${result.type === 'event' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
                                            result.type === 'reflection' ? 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white' :
                                                'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                                            } transition-colors`}>
                                            {result.type === 'event' && <Calendar size={18} />}
                                            {result.type === 'reflection' && <BookOpen size={18} />}
                                            {result.type === 'session' && <MessageSquare size={18} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="font-bold text-foreground truncate pl-1">{result.title}</h4>
                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{result.date}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 pl-1">{result.description}</p>
                                        </div>

                                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer Hints */}
                        <div className="p-3 border-t border-border bg-secondary/10 flex items-center justify-between text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">↑↓</kbd> to navigate</span>
                                <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">Enter</kbd> to select</span>
                            </div>
                            <span className="flex items-center gap-1"><kbd className="bg-muted px-1.5 py-0.5 rounded border border-border">ESC</kbd> to close</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
