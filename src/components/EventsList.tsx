"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode } from "lucide-react";

export interface Event {
    id: string; // Changed from number to string (UUID)
    name: string;
    date: string;
    location: string;
    status: "upcoming" | "open" | "past";
    image: string;
    price?: number;
    access_code?: string;
    sport?: string;
}

interface EventsListProps {
    events: Event[];
    onRegister?: (eventId: string) => void;
    onEventAdded?: () => void;
    sport?: string;
    maxItems?: number;
}

export function EventsList({ events, onRegister, onEventAdded, sport, maxItems }: EventsListProps & {
    // Add simulated payment handler if not already present in parent, 
    // but for now we'll handle the logic inside to "simulate". 
    // In real app, this would pass up to parent.
}) {
    // We need state to handle the "simulation" of payment flow
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [accessCodeInput, setAccessCodeInput] = useState("");

    // Helper to format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price / 100);
    };

    const handleRegisterClick = (event: Event) => {
        // If free or included
        if (!event.price || event.price === 0) {
            if (confirm(`Confirm registration for ${event.name}? (Team Included)`)) {
                onRegister?.(event.id);
            }
            return;
        }

        // If paid, show options
        setSelectedEvent(event);
        setShowPayModal(true);
        setAccessCodeInput("");
    };

    const handleAccessCode = () => {
        // Simulate code check
        // In real app, we'd verify with backend.
        // For sim, we'll accept 'VIPGOALIE' or any generic code for now if user entered something.
        if (accessCodeInput.trim().toUpperCase() === 'VIPGOALIE') {
            alert("Code Accepted! Registration fees waived.");
            onRegister?.(selectedEvent!.id);
            setShowPayModal(false);
        } else {
            alert("Invalid Code. Try 'VIPGOALIE'.");
        }
    };

    const handleStripePay = () => {
        // Simulate Stripe
        alert(`Redirecting to Stripe Checkout for ${formatPrice(selectedEvent!.price || 0)}... \n\n(Simulation: Payment Successful!)`);
        // Simulate success return
        onRegister?.(selectedEvent!.id);
        setShowPayModal(false);
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-end justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="text-primary" />
                    Event Passes & Schedule
                </h3>
                <div className="flex items-center gap-3">
                    {/* View All Icon Link - Always visible if constrained */}
                    {maxItems && (
                        <button
                            onClick={() => window.location.href = '/events'}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            title="View Full Calendar"
                        >
                            View All
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddEventModal(true)}
                        className="text-xs font-bold text-primary hover:text-white transition-colors"
                    >
                        + Add Game/Practice
                    </button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center p-8 border border-border border-dashed rounded-2xl text-muted-foreground text-sm">
                    No upcoming events.
                </div>
            ) : (
                <div className="grid gap-4">
                    {(maxItems ? events.slice(0, maxItems) : events).map((event, i) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative overflow-hidden bg-card border border-border rounded-2xl flex flex-col md:flex-row hover:border-primary/50 transition-all"
                        >
                            {/* Event "Art" / Color Strip */}
                            <div className={`h-24 md:h-28 md:w-2 bg-gradient-to-br ${event.image}`} />

                            <div className="p-5 flex-1 flex flex-col justify-between text-foreground">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg leading-tight w-3/4 cursor-pointer hover:text-primary transition-colors" onClick={() => window.location.href = `/events`}>
                                            {event.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {event.status === "upcoming" ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-muted text-muted-foreground border border-border">
                                                        Registered
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    {event.price && event.price > 0 ? (
                                                        <span className="text-xs font-bold text-foreground">{formatPrice(event.price)}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">Team Included</span>
                                                    )}
                                                    <button
                                                        onClick={() => handleRegisterClick(event)}
                                                        className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                                    >
                                                        {event.price && event.price > 0 ? "Purchase" : "Register"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1 block group-hover:opacity-80 transition-opacity">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar size={12} /> {event.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin size={12} /> {event.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {maxItems && events.length > maxItems && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-card/50 border border-border border-dashed rounded-2xl p-4 text-center hover:bg-card hover:border-solid hover:border-primary/50 transition-all cursor-pointer group"
                            onClick={() => window.location.href = '/events'}
                        >
                            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground">View All {events.length} Events</span>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Simulated Payment Modal */}
            {showPayModal && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm space-y-6 shadow-2xl"
                    >
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-foreground mb-1">Complete Registration</h3>
                            <p className="text-sm text-muted-foreground">{selectedEvent.name}</p>
                        </div>

                        <div className="bg-secondary/50 rounded-xl p-4 text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Due</div>
                            <div className="text-3xl font-black text-foreground">{formatPrice(selectedEvent.price || 0)}</div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleStripePay}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                            >
                                <div className="w-4 h-4 bg-background rounded-sm" /> {/* Fake card icon */}
                                Pay with Card
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or used code</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={accessCodeInput}
                                    onChange={(e) => setAccessCodeInput(e.target.value)}
                                    placeholder="Enter access code..."
                                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                />
                                <button
                                    onClick={handleAccessCode}
                                    className="px-4 bg-secondary border border-border text-foreground rounded-xl text-xs font-bold hover:bg-secondary/80"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPayModal(false)}
                            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}

            <AddEventModal isOpen={showAddEventModal} onClose={() => setShowAddEventModal(false)} onAdded={() => onEventAdded?.()} defaultSport={sport} />
        </div>
    );
}

import { supabase } from "@/utils/supabase/client";

function AddEventModal({ isOpen, onClose, onAdded, defaultSport }: { isOpen: boolean, onClose: () => void, onAdded?: () => void, defaultSport?: string }) {
    const [mode, setMode] = useState<'manual' | 'upload'>('manual');
    const [manualEvent, setManualEvent] = useState({ name: '', date: '', location: '', type: 'Game' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManualSubmit = async () => {
        if (!manualEvent.name || !manualEvent.date) return alert("Please fill in required fields.");
        setIsSubmitting(true);

        // Insert into Supabase
        const { error } = await supabase.from('events').insert({
            name: `${manualEvent.type}: ${manualEvent.name}`,
            date: new Date(manualEvent.date).toISOString(),
            location: manualEvent.location || 'TBA',
            sport: defaultSport || 'Hockey',
            price: 0, // Personal schedule events are free/tracking only
            image: "from-zinc-500 to-zinc-700" // Default team color
        });

        if (error) {
            alert("Error adding event: " + error.message);
        } else {
            alert(`${manualEvent.type} Added to Schedule!`);
            onAdded?.();
            onClose();
        }
        setIsSubmitting(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        alert(`Processing ${file.name}... \n(Logic would parse CSV/ICS here and insert to DB)`);
        onClose();
    };

    if (!isOpen) return null;

    return (

        <>
            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                />
            )}

            {/* Side Sheet */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? 0 : "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto"
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Add Event</h3>
                            <p className="text-sm text-muted-foreground">Add game or practice to schedule</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex p-1 bg-muted rounded-xl mb-6">
                        <button onClick={() => setMode('manual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'manual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Manual Entry</button>
                        <button onClick={() => setMode('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'upload' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>Upload API/CSV</button>
                    </div>

                    <div className="flex-1">
                        {mode === 'manual' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Event Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Game vs. Knights"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                                        value={manualEvent.name}
                                        onChange={e => setManualEvent({ ...manualEvent, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                                        value={manualEvent.date}
                                        onChange={e => setManualEvent({ ...manualEvent, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Location</label>
                                    <input
                                        type="text"
                                        placeholder="Arena / Facility"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                                        value={manualEvent.location}
                                        onChange={e => setManualEvent({ ...manualEvent, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Type</label>
                                    <select
                                        value={manualEvent.type}
                                        onChange={e => setManualEvent({ ...manualEvent, type: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option>Game</option>
                                        <option>Practice</option>
                                        <option>Workout</option>
                                        <option>Video Session</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center py-10">
                                <div className="border-2 border-dashed border-border rounded-2xl p-8 hover:border-primary/50 transition-colors cursor-pointer relative group">
                                    <input type="file" accept=".csv,.ics" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                        <QrCode className="mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity" size={48} />
                                        <p className="text-base font-bold">Drop CSV or iCal file</p>
                                        <p className="text-xs opacity-50 mt-1">Supports standard schedule formats</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                    We will automatically parse the file and add the events to your personal calendar.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        {mode === 'manual' && (
                            <button
                                onClick={handleManualSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 text-base"
                            >
                                {isSubmitting ? "Adding..." : "Add to Schedule"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
