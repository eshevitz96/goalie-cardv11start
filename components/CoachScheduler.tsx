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
    List,
    Lock,
    User,
    LayoutGrid,
    AlignLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_LOCATIONS = [
    "Bell Memorial Park",
    "Milton",
    "Lambert",
    "Harrison High School",
    "Custom"
];

const PRESET_TIMES = [
    { label: "12:00 PM", value: "12:00" },
    { label: "1:00 PM", value: "13:00" },
    { label: "3:00 PM", value: "15:00" },
    { label: "3:30 PM", value: "15:30" },
    { label: "4:00 PM", value: "16:00" },
    { label: "4:30 PM", value: "16:30" },
    { label: "5:00 PM", value: "17:00" },
    { label: "5:30 PM", value: "17:30" },
    { label: "6:00 PM", value: "18:00" }
];

export function CoachScheduler() {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [notifying, setNotifying] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

    // View mode: 'calendar' (Week Schedule) | 'list'
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    // Calendar layout style: 'agenda' (Spacious Day Rows) | 'grid' (7-Day Columns)
    const [calendarStyle, setCalendarStyle] = useState<'agenda' | 'grid'>('agenda');

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
    const [selectedLocation, setSelectedLocation] = useState<string>("Bell Memorial Park");
    const [customLocation, setCustomLocation] = useState<string>("");
    const [isCustomLoc, setIsCustomLoc] = useState<boolean>(false);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchSlots();
    }, []);

    const COACH_ACCOUNTS = [
        '14092722-0e2b-492b-866c-0f77e87469de', // eshevitz96@gmail.com
        '715ddfe1-23c8-4d4a-a144-5a06985cf50d', // e@cmmncreators.com
        '3088e71c-8b79-47d8-a25b-b3f540f19e7a'  // thegoaliebrand@gmail.com
    ];

    const fetchSlots = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const coachFilter = COACH_ACCOUNTS.includes(user.id)
                ? COACH_ACCOUNTS
                : [user.id];

            // 1. Fetch coach availability slots, active sessions, and athlete rosters simultaneously
            const [
                { data: availData, error: availErr },
                { data: sessionsData, error: sessErr },
                { data: rosterData, error: rosterErr }
            ] = await Promise.all([
                supabase
                    .from('coach_availability')
                    .select('*')
                    .in('coach_id', coachFilter)
                    .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('start_time', { ascending: true }),
                supabase
                    .from('sessions')
                    .select('*')
                    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('date', { ascending: true }),
                supabase
                    .from('roster_uploads')
                    .select('id, goalie_name, email, guardian_email, linked_user_id')
            ]);

            const rosters = rosterData || [];
            const mergedList: any[] = [];
            const matchedSessionIds = new Set<string>();

            // Helper to resolve athlete name and lesson info from session notes or roster
            const resolveAthleteInfo = (sess: any) => {
                let athleteName = "";
                let lessonCode = "";

                if (sess.roster_id) {
                    const match = rosters.find(r => r.id === sess.roster_id);
                    if (match?.goalie_name) athleteName = match.goalie_name;
                }
                if (!athleteName && sess.goalie_id) {
                    const match = rosters.find(r => r.linked_user_id === sess.goalie_id);
                    if (match?.goalie_name) athleteName = match.goalie_name;
                }
                if (!athleteName && sess.notes) {
                    for (const r of rosters) {
                        if (r.goalie_name && sess.notes.toLowerCase().includes(r.goalie_name.toLowerCase())) {
                            athleteName = r.goalie_name;
                            break;
                        }
                    }
                    if (!athleteName) {
                        const match = sess.notes.match(/The Goalie Brand\s*-\s*([^S\n]+?)\s*S\d+/i);
                        if (match && match[1]) {
                            athleteName = match[1].trim();
                        } else if (sess.notes.includes(' - ')) {
                            athleteName = sess.notes.split(' - ')[0].trim();
                        }
                    }
                }

                if (sess.session_number && sess.lesson_number) {
                    lessonCode = `S${sess.session_number} L${sess.lesson_number}`;
                } else if (sess.notes) {
                    const codeMatch = sess.notes.match(/S(\d+)\s*L(\d+)/i);
                    if (codeMatch) {
                        lessonCode = `S${codeMatch[1]} L${codeMatch[2]}`;
                    }
                }

                return {
                    athleteName: athleteName || "Athlete",
                    lessonCode: lessonCode || ""
                };
            };

            // 2. Process Coach Availability Slots
            if (availData && !availErr) {
                for (const slot of availData) {
                    const slotStartTime = new Date(slot.start_time).getTime();
                    
                    const matchingSession = (sessionsData || []).find((sess: any) => {
                        if (!sess.date) return false;
                        const sessTime = new Date(sess.date).getTime();
                        return Math.abs(sessTime - slotStartTime) < 45 * 60 * 1000;
                    });

                    if (matchingSession) {
                        matchedSessionIds.add(matchingSession.id);
                        const { athleteName, lessonCode } = resolveAthleteInfo(matchingSession);
                        mergedList.push({
                            ...slot,
                            is_booked: true,
                            athlete_name: athleteName,
                            lesson_code: lessonCode,
                            location: matchingSession.location || slot.location || "Field",
                            notes: matchingSession.notes || slot.notes,
                            is_session_source: false
                        });
                    } else if (slot.is_booked) {
                        let athleteName = "Athlete";
                        let lessonCode = "";
                        for (const r of rosters) {
                            if (r.goalie_name && slot.notes && slot.notes.toLowerCase().includes(r.goalie_name.toLowerCase())) {
                                athleteName = r.goalie_name;
                                break;
                            }
                        }
                        if (athleteName === "Athlete" && slot.notes) {
                            const match = slot.notes.match(/The Goalie Brand\s*-\s*([^S\n]+?)\s*S\d+/i);
                            if (match && match[1]) athleteName = match[1].trim();
                        }
                        if (slot.notes) {
                            const codeMatch = slot.notes.match(/S(\d+)\s*L(\d+)/i);
                            if (codeMatch) lessonCode = `S${codeMatch[1]} L${codeMatch[2]}`;
                        }

                        mergedList.push({
                            ...slot,
                            is_booked: true,
                            athlete_name: athleteName,
                            lesson_code: lessonCode,
                            location: slot.location || "Field",
                            is_session_source: false
                        });
                    } else {
                        mergedList.push({
                            ...slot,
                            is_booked: false,
                            is_session_source: false
                        });
                    }
                }
            }

            // 3. Add any booked sessions from `sessions` that weren't in coach_availability (e.g. Colton Aven)
            if (sessionsData && !sessErr) {
                for (const sess of sessionsData) {
                    if (matchedSessionIds.has(sess.id)) continue;

                    const { athleteName, lessonCode } = resolveAthleteInfo(sess);
                    const sessStart = new Date(sess.date);
                    const sessEnd = new Date(sessStart.getTime() + 60 * 60 * 1000);

                    mergedList.push({
                        id: `sess_${sess.id}`,
                        coach_id: user.id,
                        start_time: sessStart.toISOString(),
                        end_time: sessEnd.toISOString(),
                        location: sess.location || "Field / Training Facility",
                        notes: sess.notes,
                        is_booked: true,
                        athlete_name: athleteName,
                        lesson_code: lessonCode,
                        is_session_source: true,
                        raw_session_id: sess.id
                    });
                }
            }

            // Deduplicate slots with identical start_time and booked status
            const seenKeys = new Set<string>();
            const uniqueSlots: any[] = [];
            for (const s of mergedList) {
                const key = `${s.start_time}_${s.athlete_name || ''}_${s.is_booked}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueSlots.push(s);
                }
            }

            uniqueSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            setSlots(uniqueSlots);
        } catch (err) {
            console.error("Error fetching coach slots & sessions:", err);
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

    const handleAddSlot = async () => {
        if (!selectedDate || !selectedTime) {
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

            const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

            const { error } = await supabase.from('coach_availability').insert({
                coach_id: user.id,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                is_booked: false
            });

            if (error) {
                throw error;
            }

            setActionSuccess(`Slot added for ${activeLocationName}!`);
            setTimeout(() => setActionSuccess(null), 3000);
            await fetchSlots();
        } catch (err: any) {
            console.error("Error adding slot:", err);
            alert(err.message || "Failed to add availability slot.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slot: any) => {
        if (slot.is_session_source) {
            alert("This is a booked session from an athlete. Please manage or complete it from the Coach Schedule tab.");
            return;
        }

        try {
            const { error } = await supabase.from('coach_availability').delete().eq('id', slot.id);
            if (!error) {
                setSlots(prev => prev.filter(s => s.id !== slot.id));
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
                title: "New Private Training Schedule Published",
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
            {/* VIEW 1: WEEK SCHEDULE */}
            {/* ======================================================== */}
            {viewMode === 'calendar' && (
                <div className="space-y-4">
                    {/* Week Navigation Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 sm:px-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const prev = new Date(currentWeekMonday);
                                    prev.setDate(currentWeekMonday.getDate() - 7);
                                    setCurrentWeekMonday(prev);
                                }}
                                className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                            >
                                <ChevronLeft size={16} />
                                <span>Prev Week</span>
                            </button>

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
                                <span>Next Week</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="text-center sm:text-right flex items-center justify-between sm:justify-end gap-3">
                            <div>
                                <h4 className="text-sm sm:text-base font-black text-foreground m-0">
                                    {weekTitle}
                                </h4>
                            </div>

                            {/* Agenda vs Grid Toggle */}
                            <div className="bg-muted p-0.5 rounded-lg border border-border flex items-center">
                                <button
                                    onClick={() => setCalendarStyle('agenda')}
                                    title="Spacious Day Agenda View"
                                    className={`p-1.5 rounded-md transition-all ${
                                        calendarStyle === 'agenda'
                                            ? 'bg-card text-foreground shadow-2xs font-bold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <AlignLeft size={14} />
                                </button>
                                <button
                                    onClick={() => setCalendarStyle('grid')}
                                    title="7-Day Column Grid View"
                                    className={`p-1.5 rounded-md transition-all ${
                                        calendarStyle === 'grid'
                                            ? 'bg-card text-foreground shadow-2xs font-bold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <LayoutGrid size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* STYLE A: SPACIOUS DAY AGENDA (RECOMMENDED - FULL TEXT, NEVER CRAMPED) */}
                    {calendarStyle === 'agenda' && (
                        <div className="space-y-3">
                            {weekDays.map((day) => {
                                const isToday = new Date().toDateString() === day.toDateString();
                                const daySlots = getSlotsForDay(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`bg-card rounded-2xl border transition-all p-3.5 sm:p-4 ${
                                            isToday 
                                                ? 'border-[#00E676]/60 shadow-xs ring-1 ring-[#00E676]/30 bg-muted/10' 
                                                : 'border-border/70 hover:border-border'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            {/* Date Badge */}
                                            <div className="flex items-center gap-3 min-w-[140px]">
                                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl font-bold border ${
                                                    isToday 
                                                        ? 'bg-[#00E676] text-black border-[#00E676]' 
                                                        : 'bg-muted text-foreground border-border'
                                                }`}>
                                                    <span className="text-[10px] uppercase font-black tracking-wider leading-none">
                                                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                                                    </span>
                                                    <span className="text-base font-black leading-tight">
                                                        {day.getDate()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="text-xs font-bold text-foreground">
                                                        {day.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "long" })}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {daySlots.length === 0 ? "No hours scheduled" : `${daySlots.length} session${daySlots.length > 1 ? 's' : ''} / slots`}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Slots Area */}
                                            <div className="flex-1">
                                                {daySlots.length === 0 ? (
                                                    <div className="py-2 px-3 rounded-xl bg-muted/30 border border-dashed border-border/60 text-xs text-muted-foreground/60 italic">
                                                        No training hours scheduled for this date
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                        {daySlots.map((slot) => {
                                                            const sTime = new Date(slot.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                                            const eTime = new Date(slot.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                                            const locName = getSlotLocation(slot);

                                                            return (
                                                                <div
                                                                    key={slot.id}
                                                                    className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 group relative ${
                                                                        slot.is_booked
                                                                            ? 'bg-muted/70 border-border/80 text-foreground'
                                                                            : 'bg-[#00E676]/10 border-[#00E676]/30 hover:border-[#00E676]/60 text-foreground'
                                                                    }`}
                                                                >
                                                                    {/* Top row: Time & Status Badge */}
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                                                                            <Clock size={13} className={slot.is_booked ? "text-muted-foreground" : "text-[#00E676]"} />
                                                                            <span>{sTime} – {eTime}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            {slot.is_booked ? (
                                                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                                                                                    <Lock size={9} /> Booked
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30">
                                                                                    Open Slot
                                                                                </span>
                                                                            )}

                                                                            {!slot.is_booked && !slot.is_session_source && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDeleteSlot(slot);
                                                                                    }}
                                                                                    title="Delete slot"
                                                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Middle row: Athlete & Lesson Info (if booked) */}
                                                                    {slot.is_booked && (
                                                                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground bg-card/70 px-2.5 py-1 rounded-lg border border-border/50">
                                                                            <User size={12} className="text-[#00E676] shrink-0" />
                                                                            <span className="truncate">{slot.athlete_name || "Athlete"}</span>
                                                                            {slot.lesson_code && (
                                                                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#00E676]/15 text-[#00E676] rounded">
                                                                                    {slot.lesson_code}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Bottom row: Location */}
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                                                        <MapPin size={11} className="text-[#00E676] shrink-0" />
                                                                        <span className="truncate">{locName}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* STYLE B: 7-DAY COLUMN GRID */}
                    {calendarStyle === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                            {weekDays.map((day) => {
                                const isToday = new Date().toDateString() === day.toDateString();
                                const daySlots = getSlotsForDay(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`bg-card rounded-2xl border transition-all flex flex-col justify-start p-3 min-h-[180px] ${
                                            isToday 
                                                ? 'border-[#00E676]/60 shadow-xs ring-1 ring-[#00E676]/30' 
                                                : 'border-border/70 hover:border-border'
                                        }`}
                                    >
                                        {/* Day Header */}
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
                                        <div className="space-y-2 flex-1">
                                            {daySlots.length === 0 ? (
                                                <div className="py-6 text-center">
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
                                                            className={`p-2.5 rounded-xl border transition-all text-left space-y-1 group relative ${
                                                                slot.is_booked
                                                                    ? 'bg-muted/70 border-border/70 text-foreground'
                                                                    : 'bg-[#00E676]/10 border-[#00E676]/25 hover:border-[#00E676]/50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-[10px] font-extrabold text-foreground leading-tight">
                                                                    {sTime} – {eTime}
                                                                </span>
                                                                {!slot.is_booked && !slot.is_session_source && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSlot(slot);
                                                                        }}
                                                                        title="Delete slot"
                                                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Athlete Name if booked */}
                                                            {slot.is_booked && (
                                                                <div className="flex items-center gap-1 text-[10px] font-extrabold text-foreground bg-card/80 px-1.5 py-0.5 rounded border border-border/50">
                                                                    <User size={10} className="text-[#00E676] shrink-0" />
                                                                    <span className="truncate">{slot.athlete_name || "Athlete"}</span>
                                                                    {slot.lesson_code && (
                                                                        <span className="text-[8px] font-black text-[#00E676]">
                                                                            {slot.lesson_code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Location Pill */}
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                                                                <MapPin size={9} className="text-[#00E676] shrink-0" />
                                                                <span className="truncate">{locName}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                            <p className="text-sm font-bold text-foreground">No upcoming availability slots or booked lessons</p>
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
                                        className={`flex items-center justify-between p-3.5 bg-card border rounded-2xl group transition-all shadow-2xs ${
                                            slot.is_booked ? 'border-border/80 bg-muted/40' : 'border-[#00E676]/30 hover:border-[#00E676]/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl border ${
                                                slot.is_booked 
                                                    ? 'bg-muted text-muted-foreground border-border' 
                                                    : 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20'
                                            }`}>
                                                {slot.is_booked ? <Lock size={16} /> : <Clock size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                                    <span>{startDate.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    {slot.is_booked ? (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded">
                                                            Booked: {slot.athlete_name} {slot.lesson_code ? `(${slot.lesson_code})` : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#00E676]/20 text-[#00E676] rounded">
                                                            Open Slot
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

                                        {!slot.is_booked && !slot.is_session_source && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSlot(slot)}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10 cursor-pointer"
                                                title="Delete slot"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
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
