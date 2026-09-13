"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import { 
    Calendar, 
    Clock, 
    Plus, 
    Trash2, 
    Bell, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    Check, 
    CalendarDays, 
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_LOCATIONS = [
    "Bell Mem",
    "Milton",
    "Lambert",
    "Custom"
];

const PRESET_TIMES = [
    { label: "3:00 PM", value: "15:00" },
    { label: "3:30 PM", value: "15:30" },
    { label: "4:00 PM", value: "16:00" },
    { label: "4:30 PM", value: "16:30" },
    { label: "5:00 PM", value: "17:00" },
    { label: "5:30 PM", value: "17:30" },
    { label: "6:00 PM", value: "18:00" },
    { label: "6:30 PM", value: "18:30" },
    { label: "7:00 PM", value: "19:00" }
];

export function CoachScheduler() {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

    // View mode: 'calendar' (Week Grid) | 'list'
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Week navigation anchor date (Monday of the current viewed week)
    const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => {
        const today = new Date();
        const day = today.getDay(); // 0 = Sun, 1 = Mon
        const diff = day === 0 ? 6 : day - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
    });

    // Add Slot Form State
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [selectedTime, setSelectedTime] = useState<string>("16:30");
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [selectedLocation, setSelectedLocation] = useState<string>("Bell Mem");
    const [customLocation, setCustomLocation] = useState<string>("");
    const [isCustomLoc, setIsCustomLoc] = useState<boolean>(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('coach_availability')
                .select('*')
                .eq('coach_id', user.id)
                .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('start_time', { ascending: true });

            if (data && !error) {
                setSlots(data);
            }
        } catch (err) {
            console.error("Error fetching coach slots:", err);
        }
    };

    // Week Dates array (Mon to Sun)
    const weekDays = useMemo(() => {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(currentWeekMonday);
            d.setDate(currentWeekMonday.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentWeekMonday]);

    // Format week title
    const weekTitle = useMemo(() => {
        const start = weekDays[0];
        const end = weekDays[6];
        const startMonth = start.toLocaleDateString("en-US", { month: "short" });
        const endMonth = end.toLocaleDateString("en-US", { month: "short" });
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        if (startMonth === endMonth && startYear === endYear) {
            return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${startYear}`;
        }
        return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${endYear}`;
    }, [weekDays]);

    const activeLocationName = isCustomLoc ? (customLocation.trim() || "Bell Memorial Park") : selectedLocation;

    const handleLocationPreset = (loc: string) => {
        if (loc === "Custom") {
            setIsCustomLoc(true);
        } else {
            setIsCustomLoc(false);
            setSelectedLocation(loc);
        }
    };

    const handleAddSlot = async (overrideDate?: string, overrideTime?: string, overrideLoc?: string) => {
        const dateToUse = overrideDate || selectedDate;
        const timeToUse = overrideTime || selectedTime;
        const locToUse = overrideLoc || activeLocationName;

        if (!dateToUse || !timeToUse) {
            alert("Please select both a date and time.");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to manage coach availability.");
                setLoading(false);
                return;
            }

            const startDateTime = new Date(`${dateToUse}T${timeToUse}`);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

            // Robust insert handling: inserts base fields
            const { error } = await supabase.from('coach_availability').insert({
                coach_id: user.id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                is_booked: false
            });

            if (error) {
                throw error;
            }

            setActionSuccess(`Slot added for ${locToUse}!`);
            setTimeout(() => setActionSuccess(null), 3000);
            await fetchSlots();
        } catch (err: any) {
            console.error("Error adding slot:", err);
            alert(err.message || "Failed to add availability slot.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (id: string) => {
        try {
            const { error } = await supabase.from('coach_availability').delete().eq('id', id);
            if (!error) {
                setSlots(prev => prev.filter(s => s.id !== id));
            } else {
                alert("Error removing slot: " + error.message);
            }
        } catch (err) {
            console.error("Error deleting slot:", err);
        }
    };

    const handleBlastNotification = async () => {
        setNotifying(true);
        try {
            const { error } = await supabase.from('notifications').insert({
                title: "New Private Training Schedule Dropped! 📅",
                message: `Coach Elliott has published availability for the week. Book your private goalie sessions now!`,
                type: "schedule"
            });

            if (error) {
                alert("Notice: " + error.message);
            } else {
                setNotificationMessage("Parents & Athletes notified successfully!");
                setTimeout(() => setNotificationMessage(null), 4000);
            }
        } catch (err) {
            console.error("Notification blast error:", err);
        } finally {
            setNotifying(false);
        }
    };

    // Helper to extract location cleanly from a slot
    const getSlotLocation = (slot: any) => {
        if (slot.location) return slot.location;
        if (slot.notes) {
            const match = slot.notes.match(/Location:\s*([^\n;]+)/i);
            if (match && match[1]) return match[1].trim();
        }
        return "Training Facility";
    };

    // Filter slots for a given Date object (YYYY-MM-DD) in local browser time
    const getSlotsForDay = (day: Date) => {
        const y = day.getFullYear();
        const m = String(day.getMonth() + 1).padStart(2, '0');
        const d = String(day.getDate()).padStart(2, '0');
        const targetDateStr = `${y}-${m}-${d}`;

        return slots.filter(s => {
            if (!s.start_time) return false;
            const slotDate = new Date(s.start_time);
            const sy = slotDate.getFullYear();
            const sm = String(slotDate.getMonth() + 1).padStart(2, '0');
            const sd = String(slotDate.getDate()).padStart(2, '0');
            return `${sy}-${sm}-${sd}` === targetDateStr;
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground m-0 leading-tight">
                                Manage Availability
                            </h3>
                            <p className="text-xs text-muted-foreground m-0 mt-0.5">
                                Set your location, training days, and weekly private session hours
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher */}
                    <div className="bg-muted p-1 rounded-xl border border-border flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'calendar' 
                                    ? 'bg-[#00E676] text-black shadow-xs' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <CalendarDays size={14} />
                            <span>Week Grid</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'list' 
                                    ? 'bg-[#00E676] text-black shadow-xs' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <List size={14} />
                            <span>Slot List ({slots.length})</span>
                        </button>
                    </div>

                    {/* Notify Parents Blast */}
                    <button
                        onClick={handleBlastNotification}
                        disabled={notifying}
                        className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-3.5 py-2 rounded-xl transition-colors border border-border cursor-pointer disabled:opacity-50"
                        title="Broadcast push notification to active goalie roster"
                    >
                        <Bell size={14} className={notifying ? "animate-bounce text-[#00E676]" : "text-[#00E676]"} />
                        <span>{notifying ? "Sending Blast..." : "Notify Parents"}</span>
                    </button>
                </div>
            </div>

            {/* Notification & Success Banners */}
            <AnimatePresence>
                {notificationMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] rounded-xl text-xs font-bold flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <Check size={14} /> {notificationMessage}
                        </span>
                        <button onClick={() => setNotificationMessage(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                    </motion.div>
                )}
                {actionSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                        <Check size={14} /> {actionSuccess}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QUICK ADD & LOCATION BUILDER BAR */}
            <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Plus size={13} className="text-[#00E676]" /> Add Training Slot
                    </span>
                </div>

                {/* 1. Location Selection */}
                <div>
                    <label className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <MapPin size={12} className="text-[#00E676]" />
                        <span>Training Location</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {PRESET_LOCATIONS.map((loc) => {
                            const isSelected = loc === "Custom" ? isCustomLoc : (!isCustomLoc && selectedLocation === loc);
                            return (
                                <button
                                    key={loc}
                                    type="button"
                                    onClick={() => handleLocationPreset(loc)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#00E676] text-black border-[#00E676] shadow-xs font-black'
                                            : 'bg-card text-muted-foreground hover:text-foreground border-border hover:border-border/80'
                                    }`}
                                >
                                    {loc}
                                </button>
                            );
                        })}
                    </div>

                    {isCustomLoc && (
                        <div className="mt-2.5">
                            <input
                                type="text"
                                placeholder="Enter custom facility or field name (e.g. Field Name)..."
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                className="w-full bg-card border border-border focus:border-[#00E676] rounded-xl px-3.5 py-2 text-xs text-foreground focus:outline-none transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* 2. Date, Time & Add Button Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                    {/* Date Input */}
                    <div className="sm:col-span-4">
                        <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-card border border-border focus:border-[#00E676] rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Time Input */}
                    <div className="sm:col-span-3">
                        <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Start Time</label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full bg-card border border-border focus:border-[#00E676] rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Duration */}
                    <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Duration</label>
                        <select
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-full bg-card border border-border focus:border-[#00E676] rounded-xl px-2.5 py-2 text-xs font-bold text-foreground focus:outline-none transition-colors"
                        >
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-3 flex items-end">
                        <button
                            type="button"
                            onClick={() => handleAddSlot()}
                            disabled={loading}
                            className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-black text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 h-[38px]"
                        >
                            <Plus size={15} />
                            <span>{loading ? "Publishing..." : "Publish Slot"}</span>
                        </button>
                    </div>
                </div>

                {/* Quick Time Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Quick Times:</span>
                    {PRESET_TIMES.map((pt) => (
                        <button
                            key={pt.value}
                            type="button"
                            onClick={() => setSelectedTime(pt.value)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                selectedTime === pt.value
                                    ? 'bg-muted text-foreground border-[#00E676]/60 text-[#00E676]'
                                    : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
                            }`}
                        >
                            {pt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: WEEK GRID (INTERACTIVE CALENDAR) */}
            {/* ======================================================== */}
            {viewMode === 'calendar' && (
                <div className="space-y-4">
                    {/* Week Navigation Header */}
                    <div className="flex items-center justify-between bg-card border border-border/80 rounded-2xl p-3 sm:px-4">
                        <button
                            onClick={() => {
                                const prev = new Date(currentWeekMonday);
                                prev.setDate(currentWeekMonday.getDate() - 7);
                                setCurrentWeekMonday(prev);
                            }}
                            className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Prev Week</span>
                        </button>

                        <div className="text-center">
                            <h4 className="text-sm sm:text-base font-black text-foreground m-0">
                                {weekTitle}
                            </h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Weekly Training Grid
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const day = today.getDay();
                                    const diff = day === 0 ? 6 : day - 1;
                                    const monday = new Date(today);
                                    monday.setDate(today.getDate() - diff);
                                    monday.setHours(0, 0, 0, 0);
                                    setCurrentWeekMonday(monday);
                                }}
                                className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold rounded-lg border border-border transition-colors cursor-pointer"
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => {
                                    const next = new Date(currentWeekMonday);
                                    next.setDate(currentWeekMonday.getDate() + 7);
                                    setCurrentWeekMonday(next);
                                }}
                                className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            >
                                <span className="hidden sm:inline">Next Week</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 7-Day Week Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {weekDays.map((day) => {
                            const isToday = new Date().toDateString() === day.toDateString();
                            const daySlots = getSlotsForDay(day);
                            const dayStr = day.toISOString().split('T')[0];

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`bg-card rounded-2xl border transition-all flex flex-col justify-between p-3 min-h-[160px] ${
                                        isToday 
                                            ? 'border-[#00E676]/60 shadow-xs ring-1 ring-[#00E676]/30' 
                                            : 'border-border/70 hover:border-border'
                                    }`}
                                >
                                    {/* Day Header */}
                                    <div>
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                                            <div>
                                                <span className={`text-[11px] font-black uppercase ${isToday ? 'text-[#00E676]' : 'text-muted-foreground'}`}>
                                                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                                                </span>
                                                <div className="text-sm font-extrabold text-foreground leading-none">
                                                    {day.getDate()}
                                                </div>
                                            </div>
                                            {isToday && (
                                                <span className="text-[8px] font-black uppercase tracking-wider bg-[#00E676] text-black px-1.5 py-0.5 rounded-md">
                                                    Today
                                                </span>
                                            )}
                                        </div>

                                        {/* Day Slots List */}
                                        <div className="space-y-1.5">
                                            {daySlots.length === 0 ? (
                                                <div className="py-4 text-center">
                                                    <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">
                                                        No Slots
                                                    </span>
                                                </div>
                                            ) : (
                                                daySlots.map((slot) => {
                                                    const sTime = new Date(slot.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                                    const eTime = new Date(slot.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                                    const locName = getSlotLocation(slot);

                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            className={`p-2 rounded-xl border transition-all text-left space-y-1 group relative ${
                                                                slot.is_booked
                                                                    ? 'bg-muted/60 border-border/60 opacity-60'
                                                                    : 'bg-[#00E676]/10 border-[#00E676]/25 hover:border-[#00E676]/50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-[10px] font-extrabold text-foreground leading-tight truncate">
                                                                    {sTime} – {eTime}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteSlot(slot.id);
                                                                    }}
                                                                    title="Delete slot"
                                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>

                                                            {/* Location Pill */}
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground truncate">
                                                                <MapPin size={9} className="text-[#00E676] shrink-0" />
                                                                <span className="truncate">{locName}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Fast Quick Add for this specific day */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(dayStr);
                                            handleAddSlot(dayStr);
                                        }}
                                        className="mt-2.5 w-full py-1 px-2 bg-muted/60 hover:bg-[#00E676]/20 text-muted-foreground hover:text-[#00E676] border border-border/60 hover:border-[#00E676]/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                                    >
                                        <Plus size={11} />
                                        <span>+ Add Slot</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: LIST VIEW */}
            {/* ======================================================== */}
            {viewMode === 'list' && (
                <div className="space-y-2">
                    {slots.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center">
                            <Calendar size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-bold text-foreground">No upcoming availability slots set</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Select a date, time, and location above to publish training hours for athletes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {slots.map((slot) => {
                                const startDate = new Date(slot.start_time);
                                const endDate = new Date(slot.end_time);
                                const locName = getSlotLocation(slot);

                                return (
                                    <motion.div
                                        layout
                                        key={slot.id}
                                        className="flex items-center justify-between p-3.5 bg-card border border-border/80 rounded-2xl group hover:border-[#00E676]/40 transition-all shadow-2xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-[#00E676]/10 text-[#00E676] rounded-xl border border-[#00E676]/20">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                                    <span>{startDate.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    {slot.is_booked && (
                                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                                            Booked
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-2">
                                                    <span>
                                                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-foreground/80 font-bold">
                                                        <MapPin size={11} className="text-[#00E676]" />
                                                        {locName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10 cursor-pointer"
                                            title="Delete slot"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
