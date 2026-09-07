"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    CheckCircle2, 
    ArrowLeft, 
    ArrowRight, 
    Check, 
    Plus, 
    Trash2, 
    Loader2, 
    ExternalLink,
    Sparkles,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAvailableTrainingSlots, getGoalieBookingProfile, bookTrainingSlots } from "./actions";
import { TrainingSlot } from "@/constants/trainingAvailability";

export default function BookTrainingPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
                <Loader2 className="animate-spin text-primary opacity-50" size={36} />
            </main>
        }>
            <BookTrainingContent />
        </Suspense>
    );
}

function BookTrainingContent() {
    const auth = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slots, setSlots] = useState<(TrainingSlot & { isBooked: boolean; spotsLeft: number })[]>([]);
    const [goalieProfile, setGoalieProfile] = useState<{
        goalieName: string;
        email: string;
        lessonsRemaining: number;
    } | null>(null);

    // Month Navigation (Default to Sep 2026)
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 8, 1)); // Month index 8 = September
    const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-09-09");
    const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
    const [bookedResult, setBookedResult] = useState<{
        bookedSlots: TrainingSlot[];
        googleCalLinks: { slotId: string; title: string; url: string }[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const activeUid = auth.userId || "00000000-0000-0000-0000-000000000000";
            
            const [slotsRes, profileRes] = await Promise.all([
                getAvailableTrainingSlots(),
                getGoalieBookingProfile(activeUid, auth.userEmail || undefined)
            ]);

            if (slotsRes.slots) {
                setSlots(slotsRes.slots);
            }
            if (profileRes.success) {
                setGoalieProfile({
                    goalieName: profileRes.goalieName,
                    email: profileRes.email,
                    lessonsRemaining: profileRes.lessonsRemaining
                });
            }
            setIsLoading(false);
        };

        if (!auth.loading) {
            init();
        }
    }, [auth.loading, auth.userId, auth.userEmail]);

    // Calendar Grid Calculation
    const calendarDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days: ({
            dayNumber: number;
            dateStr: string;
            isCurrentMonth: boolean;
            availableSlotCount: number;
            hasSelected: boolean;
        } | null)[] = [];

        // Padding before first day of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Days in month
        for (let d = 1; d <= daysInMonth; d++) {
            const padD = String(d).padStart(2, '0');
            const padM = String(month + 1).padStart(2, '0');
            const dateStr = `${year}-${padM}-${padD}`;
            
            const daySlots = slots.filter(s => s.date === dateStr && !s.isBooked);
            const hasSelected = slots.some(s => s.date === dateStr && selectedSlotIds.includes(s.id));

            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: true,
                availableSlotCount: daySlots.length,
                hasSelected
            });
        }

        return days;
    }, [currentMonthDate, slots, selectedSlotIds]);

    // Slots for the currently selected date
    const slotsForSelectedDay = useMemo(() => {
        return slots.filter(s => s.date === selectedDateStr);
    }, [slots, selectedDateStr]);

    const handleToggleSlot = (slotId: string) => {
        if (selectedSlotIds.includes(slotId)) {
            setSelectedSlotIds(prev => prev.filter(id => id !== slotId));
        } else {
            const maxAllowed = goalieProfile?.lessonsRemaining ?? 16;
            if (selectedSlotIds.length >= maxAllowed) {
                setError(`You have ${maxAllowed} lesson${maxAllowed > 1 ? 's' : ''} available to book.`);
                return;
            }
            setError(null);
            setSelectedSlotIds(prev => [...prev, slotId]);
        }
    };

    const handleConfirmBooking = async () => {
        if (selectedSlotIds.length === 0) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const activeUid = auth.userId || "00000000-0000-0000-0000-000000000000";
            const res = await bookTrainingSlots({
                goalieProfileId: activeUid,
                athleteName: goalieProfile?.goalieName || "Athlete",
                email: goalieProfile?.email || auth.userEmail || "",
                selectedSlotIds
            });

            if (res.error) {
                setError(res.error);
                setIsSubmitting(false);
            } else if (res.success) {
                setBookedResult({
                    bookedSlots: res.bookedSlots!,
                    googleCalLinks: res.googleCalLinks!
                });
                setIsSubmitting(false);
            }
        } catch (err: any) {
            setError(err.message || "Failed to confirm booking.");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
                <Loader2 className="animate-spin text-primary opacity-60" size={36} />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                    Loading Private Training Schedule...
                </p>
            </main>
        );
    }

    // ── SUCCESS CONFIRMATION VIEW ─────────────────────────────────────────────
    if (bookedResult) {
        return (
            <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/40 via-emerald-500 to-emerald-500/40" />

                <div className="w-full max-w-xl relative z-10">
                    <div className="text-center mb-8 flex flex-col items-center">
                        <BrandLogo size={36} textClassName="text-2xl font-bold tracking-tight mb-2" />
                        <div className="flex items-center gap-2 text-emerald-500 text-xs uppercase tracking-[0.2em] font-black">
                            <CheckCircle2 size={14} />
                            Schedule Confirmed
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 md:p-10 shadow-2xl space-y-6">
                        <div className="text-center py-2">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">You’re booked!</h2>
                        </div>

                        {/* List of Booked Sessions */}
                        <div className="space-y-3 pt-2">
                            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60 px-1">
                                Confirmed Dates ({bookedResult.bookedSlots.length})
                            </p>
                            {bookedResult.bookedSlots.map((slot, idx) => {
                                const calLink = bookedResult.googleCalLinks.find(c => c.slotId === slot.id)?.url;
                                const dateFormatted = new Date(slot.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric'
                                });

                                return (
                                    <div key={slot.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-foreground">
                                                {dateFormatted} • {slot.timeDisplay}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin size={12} className="text-primary" /> {slot.location}
                                            </p>
                                        </div>
                                        {calLink && (
                                            <a 
                                                href={calLink} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                <CalendarIcon size={12} /> Add to Cal
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="w-full py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em]"
                            >
                                <ArrowRight size={14} className="mr-2" /> Go to My Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ── MAIN SCHEDULING CALENDAR VIEW ─────────────────────────────────────────
    const selectedDateDisplay = new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    const monthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-8 relative">
            {/* Header bar */}
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-border/40">
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <BrandLogo textClassName="text-xl font-medium tracking-tight" />
            </div>

            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-28">
                
                {/* ── LEFT / TOP COLUMN: BIG CALENDAR ────────────────────────── */}
                <div className="col-span-1 lg:col-span-7 space-y-6">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-500">
                            Private Training
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1 text-foreground">
                            Schedule Your Sessions
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Choose available weekend and weeknight training times below.
                        </p>
                    </div>

                    {/* Calendar Card */}
                    <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-3xl p-6 shadow-xl space-y-5">
                        {/* Month Header */}
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold tracking-tight text-foreground">
                                {monthLabel}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                    className="p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                                <button 
                                    onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                    className="p-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 gap-2 text-center">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <span key={day} className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/60 py-1">
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {calendarDays.map((day, idx) => {
                                if (!day) {
                                    return <div key={`empty-${idx}`} className="h-14 rounded-2xl opacity-0" />;
                                }

                                const isSelected = day.dateStr === selectedDateStr;
                                const hasAvailable = day.availableSlotCount > 0;

                                return (
                                    <button
                                        key={day.dateStr}
                                        onClick={() => setSelectedDateStr(day.dateStr)}
                                        className={`h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all border ${
                                            isSelected 
                                                ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/40' 
                                                : day.hasSelected
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : hasAvailable
                                                        ? 'bg-secondary/30 border-border/50 hover:bg-secondary/60'
                                                        : 'bg-secondary/10 border-transparent opacity-40 hover:opacity-70'
                                        }`}
                                    >
                                        <span className={`text-sm font-black ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                            {day.dayNumber}
                                        </span>
                                        {hasAvailable && (
                                            <span className="text-[8px] font-black uppercase text-emerald-500 tracking-wider mt-0.5">
                                                {day.availableSlotCount} {day.availableSlotCount === 1 ? 'Slot' : 'Slots'}
                                            </span>
                                        )}
                                        {day.hasSelected && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: DAY DETAIL & TIME SLOTS ───────────────────── */}
                <div className="col-span-1 lg:col-span-5 space-y-6">
                    {/* Lesson Balance Info */}
                    <div className="bg-secondary/30 border border-border/40 rounded-3xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Your Balance</p>
                            <h4 className="text-xl font-bold text-foreground">
                                {goalieProfile?.lessonsRemaining ?? 16} Lessons Remaining
                            </h4>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                            {selectedSlotIds.length} Selected
                        </div>
                    </div>

                    {/* Day Slot Selector */}
                    <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="border-b border-border/40 pb-3">
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Selected Date</p>
                            <h3 className="text-lg font-bold text-foreground">{selectedDateDisplay}</h3>
                        </div>

                        {slotsForSelectedDay.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground space-y-2">
                                <Clock size={24} className="mx-auto opacity-30" />
                                <p className="text-xs font-bold">No sessions scheduled for this date.</p>
                                <p className="text-[10px] text-muted-foreground/60">Select another highlighted date on the calendar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {slotsForSelectedDay.map(slot => {
                                    const isChosen = selectedSlotIds.includes(slot.id);
                                    const isBooked = slot.isBooked;

                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={isBooked}
                                            onClick={() => handleToggleSlot(slot.id)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                isBooked
                                                    ? 'opacity-40 bg-secondary/10 border-transparent cursor-not-allowed'
                                                    : isChosen
                                                        ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-500/5'
                                                        : 'bg-secondary/30 border-border/40 hover:bg-secondary/60'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className={isChosen ? 'text-emerald-500' : 'text-muted-foreground'} />
                                                    <span className="text-sm font-bold text-foreground">{slot.timeDisplay}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                    <MapPin size={12} className="text-primary" /> {slot.location}
                                                </p>
                                            </div>

                                            <div className="shrink-0">
                                                {isBooked ? (
                                                    <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">Booked</span>
                                                ) : isChosen ? (
                                                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                                                        <Check size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-xl bg-secondary/50 border border-border/40 text-muted-foreground flex items-center justify-center font-black group-hover:border-primary">
                                                        <Plus size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BOTTOM STICKY SELECTION TRAY ───────────────────────────────── */}
            <AnimatePresence>
                {selectedSlotIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="fixed bottom-0 inset-x-0 bg-card/90 backdrop-blur-2xl border-t border-border/50 p-4 md:p-6 z-50 shadow-2xl"
                    >
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-base border border-emerald-500/30">
                                    {selectedSlotIds.length}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">
                                        {selectedSlotIds.length} Session{selectedSlotIds.length > 1 ? 's' : ''} Ready to Book
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground">
                                        Coach Elliott will be automatically notified with your confirmed schedule.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedSlotIds([])}
                                    className="px-4 py-3 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Clear
                                </button>
                                <Button
                                    onClick={handleConfirmBooking}
                                    loading={isSubmitting}
                                    className="w-full sm:w-auto px-8 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10"
                                >
                                    Confirm Schedule ({selectedSlotIds.length}) <ArrowRight size={14} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
