"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
    hidePayments?: boolean;
}

export function EventsList({ events, onRegister, onEventAdded, sport, maxItems, hidePayments }: EventsListProps & {
    // Add simulated payment handler if not already present in parent, 
    // but for now we'll handle the logic inside to "simulate". 
    // In real app, this would pass up to parent.
}) {
    const toast = useToast();
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
            toast.success("Code Accepted! Registration fees waived.");
            onRegister?.(selectedEvent!.id);
            setShowPayModal(false);
        } else {
            toast.error("Invalid Code. Try 'VIPGOALIE'.");
        }
    };

    const handleStripePay = async () => {
        try {
            // Get user info for Stripe session
            const userEmail = localStorage.getItem('user_email') || '';
            const rosterId = localStorage.getItem('setup_roster_id') || '';

            // Call our Stripe checkout API
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // For dynamic pricing, we'll create a price on the fly
                    // In production, you'd use priceId from a catalog
                    amount: selectedEvent!.price || 0,
                    eventId: selectedEvent!.id,
                    eventName: selectedEvent!.name,
                    email: userEmail,
                    userId: rosterId,
                    returnUrl: window.location.origin + '/goalie?payment=success',
                    mode: 'payment'
                })
            });

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Payment initialization failed. Please try again.');
        }
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
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = '/events'}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 h-auto p-0 hover:bg-transparent"
                            title="View Full Calendar"
                        >
                            View All
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => setShowAddEventModal(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors h-auto p-0 hover:bg-transparent"
                    >
                        + Add Game/Practice
                    </Button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center p-8 border border-border border-dashed rounded-2xl text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <span>No upcoming events.</span>
                    <Button
                        variant="ghost"
                        onClick={() => setShowAddEventModal(true)}
                        className="text-primary font-bold hover:underline h-auto p-0 hover:bg-transparent"
                    >
                        + Add your first Game or Practice
                    </Button>
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
                                            {!hidePayments && (event.status === "upcoming" ? (
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
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRegisterClick(event)}
                                                        className="font-bold shadow-lg shadow-primary/20"
                                                    >
                                                        {event.price && event.price > 0 ? "Purchase" : "Register"}
                                                    </Button>
                                                </div>
                                            ))}
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
            <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Complete Registration" size="sm">
                <div className="space-y-6">
                    <div className="text-center -mt-2">
                        <p className="text-sm text-muted-foreground">{selectedEvent?.name}</p>
                    </div>

                    <div className="bg-secondary/50 rounded-xl p-4 text-center">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Due</div>
                        <div className="text-3xl font-black text-foreground">{selectedEvent && formatPrice(selectedEvent.price || 0)}</div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleStripePay}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <div className="w-4 h-4 bg-background rounded-sm" /> {/* Fake card icon */}
                            Pay with Card
                        </Button>

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
                            <Button
                                variant="secondary"
                                onClick={handleAccessCode}
                                className="text-xs font-bold"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => setShowPayModal(false)}
                        className="w-full h-auto py-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                </div>
            </Modal>

            <AddEventModal isOpen={showAddEventModal} onClose={() => setShowAddEventModal(false)} onAdded={() => onEventAdded?.()} defaultSport={sport} />
        </div>
    );
}

import { supabase } from "@/utils/supabase/client";

function AddEventModal({ isOpen, onClose, onAdded, defaultSport }: { isOpen: boolean, onClose: () => void, onAdded?: () => void, defaultSport?: string }) {
    const toast = useToast();
    const [mode, setMode] = useState<'manual' | 'upload'>('manual');
    const [manualEvent, setManualEvent] = useState({ name: '', date: '', location: '', type: 'Game' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManualSubmit = async () => {
        if (!manualEvent.name || !manualEvent.date) {
            toast.warning("Please fill in required fields.");
            return;
        }
        setIsSubmitting(true);

        // Get User for Ownership
        const { data: { user } } = await supabase.auth.getUser();

        // Insert into Supabase
        const { error } = await supabase.from('events').insert({
            name: `${manualEvent.type}: ${manualEvent.name}`,
            date: new Date(manualEvent.date).toISOString(),
            location: manualEvent.location || 'TBA',
            sport: defaultSport || 'Hockey',
            price: 0, // Personal schedule events are free/tracking only
            image: "from-zinc-500 to-zinc-700", // Default team color
            created_by: user?.id
        });

        if (error) {
            toast.error("Error adding event: " + error.message); // Replaced alert with toast
        } else {
            toast.success(`${manualEvent.type} Added to Schedule!`); // Replaced alert with toast
            onAdded?.();
            onClose();
        }
        setIsSubmitting(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.info(`Processing ${file.name}... \n(Logic would parse CSV/ICS here and insert to DB)`);
        onClose();
    };

    if (!isOpen) return null;

    return (

        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Add Event" size="md">
                <div className="flex flex-col h-full">
                    <div className="flex p-1 bg-muted rounded-xl mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all h-auto ${mode === 'manual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                            Manual Entry
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setMode('upload')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all h-auto ${mode === 'upload' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                            Upload API/CSV
                        </Button>
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
                            <Button
                                onClick={handleManualSubmit}
                                disabled={isSubmitting}
                                className="w-full font-bold py-6 text-base"
                            >
                                {isSubmitting ? "Adding..." : "Add to Schedule"}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
