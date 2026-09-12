"use client";

import { useEffect, useState, useMemo } from "react";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  FileText, 
  Video, 
  Smile, 
  Pencil,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Sun,
  Flame,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Target,
  Dumbbell,
  Award,
  Shield,
  Users,
  Activity,
  Layers,
  ChevronDown,
  X,
  Trash2
} from "lucide-react";
import { ATHLETE_TRAINING_HISTORY, ATHLETE_PROFILE_METRICS } from "@/lib/athleteTrainingHistory";
import { fetchCoachOSData } from "@/app/training/book/actions";

type ViewMode = "day" | "week" | "month" | "year";

export default function CalendarPage() {
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [privateSessions, setPrivateSessions] = useState<any[]>([]);
  const [weeklyIntention, setWeeklyIntention] = useState<any>(null);
  const [rosterGoalies, setRosterGoalies] = useState<{ id: string; name: string; linked_user_id?: string | null }[]>([]);
  const [selectedGoalieFilter, setSelectedGoalieFilter] = useState<string>("all");
  const [roleTrackFilter, setRoleTrackFilter] = useState<'all' | 'athlete' | 'coach'>('all');
  const [athleteHockeySessions, setAthleteHockeySessions] = useState<any[]>([]);

  // View state: 'day' | 'week' | 'month' | 'year'
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  // Anchor date for calendar navigation (default today)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Selected date for month/year drawer drill-down
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  // Setup & Event Creation Modals
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonNameInput, setSeasonNameInput] = useState("");
  const [seasonStartInput, setSeasonStartInput] = useState("");
  const [seasonEndInput, setSeasonEndInput] = useState("");
  const [seasonError, setSeasonError] = useState("");

  const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

  // Unified Add Event Modal State
  const [showUnifiedAddModal, setShowUnifiedAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'training' | 'lesson' | 'game' | 'practice'>('training');

  // Coaching Lesson Form States
  const [lessonAthleteName, setLessonAthleteName] = useState("");
  const [lessonRosterId, setLessonRosterId] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [lessonTime, setLessonTime] = useState("");
  const [lessonLocation, setLessonLocation] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [lessonNumber, setLessonNumber] = useState<number | string>("");

  const [showGameModal, setShowGameModal] = useState(false);
  const [gameOpponent, setGameOpponent] = useState("");
  const [gameLocation, setGameLocation] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [gameTime, setGameTime] = useState("");
  const [gameType, setGameType] = useState("game");

  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [practiceDate, setPracticeDate] = useState("");
  const [practiceTime, setPracticeTime] = useState("");
  const [practiceLocation, setPracticeLocation] = useState("");
  const [practiceNotes, setPracticeNotes] = useState("");

  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingDate, setTrainingDate] = useState("");
  const [trainingTime, setTrainingTime] = useState("");
  const [trainingFocus, setTrainingFocus] = useState("");
  const [trainingLocation, setTrainingLocation] = useState("");

  // Edit Game Form States
  const [editingGame, setEditingGame] = useState<any>(null);
  const [editGameOpponent, setEditGameOpponent] = useState("");
  const [editGameLocation, setEditGameLocation] = useState("");
  const [editGameDate, setEditGameDate] = useState("");
  const [editGameTime, setEditGameTime] = useState("");
  const [editGameType, setEditGameType] = useState("game");
  const [editGameError, setEditGameError] = useState("");
  const [gameDeleteConfirm, setGameDeleteConfirm] = useState(false);

  // Edit Practice Form States
  const [editingPractice, setEditingPractice] = useState<any>(null);
  const [editPracticeDate, setEditPracticeDate] = useState("");
  const [editPracticeTime, setEditPracticeTime] = useState("");
  const [editPracticeLocation, setEditPracticeLocation] = useState("");
  const [editPracticeNotes, setEditPracticeNotes] = useState("");
  const [editPracticeError, setEditPracticeError] = useState("");
  const [practiceDeleteConfirm, setPracticeDeleteConfirm] = useState(false);

  // Edit Coaching Lesson Form States
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editLessonRosterId, setEditLessonRosterId] = useState("");
  const [editLessonAthleteName, setEditLessonAthleteName] = useState("");
  const [editLessonDate, setEditLessonDate] = useState("");
  const [editLessonTime, setEditLessonTime] = useState("");
  const [editLessonLocation, setEditLessonLocation] = useState("");
  const [editLessonNotes, setEditLessonNotes] = useState("");
  const [editLessonSessionNum, setEditLessonSessionNum] = useState<number | string>("");
  const [editLessonLessonNum, setEditLessonLessonNum] = useState<number | string>("");
  const [editLessonError, setEditLessonError] = useState("");
  const [lessonDeleteConfirm, setLessonDeleteConfirm] = useState(false);

  // Pro Goalie Training (Athlete Track) Details Modal State
  const [selectedHockeySession, setSelectedHockeySession] = useState<any>(null);

  const [dbSaving, setDbSaving] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  // Helper date key format YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "TBD";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const min = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${min} ${ampm}`;
  };

  // Compute active week dates (Monday to Sunday) based on currentDate
  const weekDates = useMemo(() => {
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - daysSinceMon);
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(day);
    }
    return dates;
  }, [currentDate]);

  // Compute active month calendar grid dates (6 weeks x 7 days = 42 cells)
  const monthGridDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstOfMonth.getDay(); // 0 = Sun, 1 = Mon
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startDate = new Date(firstOfMonth);
    startDate.setDate(firstOfMonth.getDate() - daysSinceMon);

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      cells.push({
        date: d,
        isCurrentMonth: d.getMonth() === month
      });
    }
    return cells;
  }, [currentDate]);

  // Compute query range based on active viewMode and currentDate
  const queryRange = useMemo(() => {
    if (viewMode === "day") {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - 7);
      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + 7);
      return {
        startStr: formatDateKey(start),
        endStr: formatDateKey(end)
      };
    } else if (viewMode === "week") {
      return {
        startStr: formatDateKey(weekDates[0]),
        endStr: formatDateKey(weekDates[6])
      };
    } else if (viewMode === "month") {
      return {
        startStr: formatDateKey(monthGridDates[0].date),
        endStr: formatDateKey(monthGridDates[monthGridDates.length - 1].date)
      };
    } else {
      // Year view
      const year = currentDate.getFullYear();
      return {
        startStr: `${year}-01-01`,
        endStr: `${year}-12-31`
      };
    }
  }, [viewMode, currentDate, weekDates, monthGridDates]);

  // Load calendar data
  const loadData = async () => {
    setLoading(true);
    try {
      const uid = auth.userId;
      const { startStr, endStr } = queryRange;

      // 1. Fetch coach roster & private training sessions from authoritative server action
      const coachData = await fetchCoachOSData(uid || undefined, auth.userEmail || undefined);
      let rosterList: any[] = [];
      let allSessionsData: any[] = [];

      if (coachData?.success && coachData.athletes && coachData.athletes.length > 0) {
        rosterList = coachData.athletes.map((a: any) => ({
          id: a.id,
          goalie_name: a.goalie_name,
          email: a.email,
          guardian_email: a.guardian_email,
          athlete_email: a.email,
          linked_user_id: a.id,
          team: a.team
        }));
        allSessionsData = coachData.sessions || [];
      } else {
        const { data: allRosters } = await supabase
          .from("roster_uploads")
          .select("id, goalie_name, email, guardian_email, athlete_email, linked_user_id, team")
          .order("goalie_name", { ascending: true });

        rosterList = (allRosters || []).filter(r => {
          const name = (r.goalie_name || '').toLowerCase();
          return name && !name.includes('test') && !name.includes('elliott');
        });

        const { data: rawSess } = await supabase
          .from("sessions")
          .select("id, date, start_time, end_time, location, notes, session_number, lesson_number, goalie_id, roster_id, is_active")
          .order("date", { ascending: true });
        allSessionsData = rawSess || [];
      }

      setRosterGoalies(rosterList.map(r => ({ id: r.id, name: r.goalie_name, linked_user_id: r.linked_user_id })));

      // 2. Fetch user profile, email & identity if authenticated
      let publicUserId: string | undefined;
      let userEmail = "";
      let goalieName = "";
      let isCoach = true; // default coach access on calendar

      if (uid && uid !== "00000000-0000-0000-0000-000000000000") {
        const [
          { data: userRes },
          { data: profileRes },
          { data: authUserData }
        ] = await Promise.all([
          supabase.from("users").select("id, auth_user_id, email, role").eq("auth_user_id", uid).maybeSingle(),
          supabase.from("profiles").select("id, email, goalie_name, full_name, role, roles").eq("id", uid).maybeSingle(),
          supabase.auth.getUser()
        ]);
        publicUserId = userRes?.id;
        userEmail = (authUserData?.user?.email || userRes?.email || profileRes?.email || "").toLowerCase().trim();
        goalieName = (profileRes?.goalie_name || profileRes?.full_name || "").trim();
        const isCoachRole = profileRes?.role === 'coach' || (Array.isArray(profileRes?.roles) && profileRes?.roles.includes('coach')) || userRes?.role === 'coach';
        isCoach = isCoachRole || userEmail === "eshevitz96@gmail.com" || userEmail === "thegoaliebrand@gmail.com" || !goalieName || goalieName.toLowerCase().includes("elliott");
      }

      // 3. Resolve matching roster IDs for this goalie
      const matchedRosterIds: string[] = [];
      const nameKeywords: string[] = [];
      if (goalieName) nameKeywords.push(goalieName.toLowerCase());

      rosterList.forEach(r => {
        const rEmail = (r.email || r.guardian_email || r.athlete_email || "").toLowerCase().trim();
        const rName = (r.goalie_name || "").toLowerCase().trim();

        const matches = (r.linked_user_id && (r.linked_user_id === uid || r.linked_user_id === publicUserId)) ||
                        (userEmail && rEmail === userEmail) ||
                        (goalieName && rName && (rName.includes(goalieName.toLowerCase()) || goalieName.toLowerCase().includes(rName)));

        if (matches) {
          matchedRosterIds.push(r.id);
          if (r.goalie_name && !nameKeywords.includes(rName)) {
            nameKeywords.push(rName);
          }
        }
      });

      // 4. Fetch games and practices for selected range if authenticated
      if (uid && uid !== "00000000-0000-0000-0000-000000000000") {
        const { data: gamesData } = await supabase
          .from("game_sessions")
          .select("*")
          .or(`user_id.eq.${uid},user_id.eq.${publicUserId || uid}`)
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr);
        setGames(gamesData || []);

        const { data: practicesData } = await supabase
          .from("practices")
          .select("*")
          .or(`user_id.eq.${publicUserId || uid},user_id.eq.${uid}`)
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr);
        setPractices(practicesData || []);
      } else {
        setGames([]);
        setPractices([]);
      }

      // 4b. Load Pro Hockey Goalie Training Schedule (Athlete Track)
      const hockeySchedule: any[] = [];
      const historyDateSet = new Set<string>();

      // 1. Add all exact and reconstructed historical sessions from Coach Alpha training dossier
      ATHLETE_TRAINING_HISTORY.forEach(item => {
        historyDateSet.add(item.date);
        hockeySchedule.push({
          id: item.id,
          title: item.title,
          scheduled_date: item.date,
          scheduled_time: item.time || "09:00:00",
          date: item.date,
          location: item.location || "Ice Arena / Gym",
          focus: item.notes || (item.strength ? item.strength.join(', ') : (item.athletic ? item.athletic.join(', ') : "")),
          type: item.type,
          confidence: item.confidence,
          phase: item.phase,
          strength: item.strength,
          athletic: item.athletic,
          balance: item.balance,
          core: item.core,
          warmup: item.warmup,
          recovery: item.recovery,
          notes: item.notes,
          athleteReflection: item.athleteReflection,
          coachNotes: item.coachNotes,
          cues: item.cues,
          sport: "Ice Hockey"
        });
      });

      // 2. Project ongoing weekly model for future dates starting post-import (Sept 12, 2026 onwards)
      const futureStart = new Date("2026-09-12T00:00:00");
      const rangeEnd = new Date(endStr);
      const curr = new Date(futureStart);

      while (curr <= rangeEnd) {
        const dateKey = formatDateKey(curr);
        const dayOfWeek = curr.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

        if (dayOfWeek === 3) { // Wednesday: Ice / Development
          hockeySchedule.push({
            id: `hockey-wed-${dateKey}`,
            title: "On-Ice Goalie Development Skate",
            scheduled_date: dateKey,
            scheduled_time: "08:30:00",
            date: dateKey,
            location: "Ice Arena Rink",
            focus: "Angles, depth management, edge calibration & rebound redirection",
            type: "on_ice",
            confidence: "EXACT",
            phase: "Current State / Future Model",
            cues: ["Sit into edges.", "Angles → depth → arrive set → read → save."],
            sport: "Ice Hockey"
          });
        } else if (dayOfWeek === 5) { // Friday: Ice / Play & Performance
          hockeySchedule.push({
            id: `hockey-fri-${dateKey}`,
            title: "Friday Compete / High-Velocity Game Reps",
            scheduled_date: dateKey,
            scheduled_time: "08:30:00",
            date: dateKey,
            location: "Ice Arena Rink",
            focus: "Puck battle reads, 2-on-1 backdoor slides, competitive game speed",
            type: "on_ice",
            confidence: "EXACT",
            phase: "Current State / Future Model",
            cues: ["Arrive set.", "Sit into your edges."],
            sport: "Ice Hockey"
          });
        } else if (dayOfWeek === 1) { // Monday: Early-Week Meaningful Strength
          hockeySchedule.push({
            id: `hockey-mon-${dateKey}`,
            title: "Goalie Strength & Power (Smith Front Squat / RDL)",
            scheduled_date: dateKey,
            scheduled_time: "09:00:00",
            date: dateKey,
            location: "Planet Fitness",
            strength: ["Smith front squat: up to 55 lb/side", "RDL: 70 lb (3-sec eccentric)", "Bulgarian split squat: 30–35 lb DBs", "Pull-ups: 4 x 6"],
            athletic: ["Skater bounds 3 x 5/side", "Jump drop → goalie stance 3 x 5"],
            type: "off_ice",
            confidence: "EXACT",
            phase: "Current State / Future Model",
            cues: ["GET LOW → LOAD → PUSH → STICK."],
            sport: "Ice Hockey"
          });
        } else if (dayOfWeek === 2 || dayOfWeek === 4) { // Tuesday / Thursday: Short Upper & Trunk Maintenance
          hockeySchedule.push({
            id: `hockey-upper-${dateKey}`,
            title: "Upper Body & Trunk Maintenance",
            scheduled_date: dateKey,
            scheduled_time: "10:00:00",
            date: dateKey,
            location: "Planet Fitness",
            strength: ["Incline DB press: 60–65 lb", "Single-arm DB row: 65–70 lb", "DB shoulder press: 40 lb"],
            core: ["Suitcase carry: 70–75 lb 2x30s", "Dead bugs: 2x10"],
            type: "off_ice",
            confidence: "EXACT",
            phase: "Current State / Future Model",
            sport: "Ice Hockey"
          });
        } else if (dayOfWeek === 0) { // Sunday: Active Recovery
          hockeySchedule.push({
            id: `hockey-rec-${dateKey}`,
            title: "Active Recovery & Dynamic Goalie Mobility",
            scheduled_date: dateKey,
            scheduled_time: "10:00:00",
            date: dateKey,
            location: "Studio / Recovery Lab",
            recovery: ["Yoga stretch", "Adductor rockbacks", "Hip flexor flushes & fascia release"],
            type: "recovery",
            confidence: "EXACT",
            phase: "Current State / Future Model",
            sport: "Ice Hockey"
          });
        }

        curr.setDate(curr.getDate() + 1);
      }

      setAthleteHockeySessions(hockeySchedule);

      // 5. Process private training sessions (lacrosse coaching lessons)
      // Hydrate all sessions with real athlete names
      const hydrated = allSessionsData.map(sess => {
        let name = sess.athlete_name || "Private Client";
        if (name === "Private Client" || name === "Athlete") {
          if (sess.roster_id) {
            const m = rosterList.find(r => r.id === sess.roster_id);
            if (m && m.goalie_name) name = m.goalie_name;
          }
          if ((name === "Private Client" || name === "Athlete") && sess.goalie_id) {
            const m = rosterList.find(r => r.linked_user_id === sess.goalie_id || r.id === sess.goalie_id);
            if (m && m.goalie_name) name = m.goalie_name;
          }
          if ((name === "Private Client" || name === "Athlete") && sess.notes) {
            for (const r of rosterList) {
              if (sess.notes.toLowerCase().includes(r.goalie_name.toLowerCase())) {
                name = r.goalie_name;
                break;
              }
            }
          }
        }
        return {
          ...sess,
          athlete_name: name,
          sport: "Lacrosse"
        };
      });

      // Filter sessions for this user / selected goalie
      const userSessions = hydrated.filter(s => {
        if (selectedGoalieFilter !== "all") {
          const targetRoster = rosterList.find(r => r.id === selectedGoalieFilter);
          if (s.roster_id === selectedGoalieFilter) return true;
          if (targetRoster && s.athlete_name && s.athlete_name.toLowerCase() === targetRoster.goalie_name.toLowerCase()) return true;
          return false;
        }
        return true;
      });

      setPrivateSessions(userSessions);

      // 6. Fetch or auto-initialize season
      let activeSeason = null;
      if (publicUserId || (uid && uid !== "00000000-0000-0000-0000-000000000000")) {
        const { data: seasonData } = await supabase
          .from("seasons")
          .select("*")
          .or(`user_id.eq.${publicUserId || uid},user_id.eq.${uid}`)
          .eq("is_active", true)
          .maybeSingle();

        activeSeason = seasonData;
      }

      if (!activeSeason) {
        activeSeason = {
          id: "active-season-2026",
          name: "Goalie Brand 2026",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          is_active: true
        };
      }

      setSeason(activeSeason);

      // 7. Fetch weekly intention
      if (publicUserId || uid) {
        const weekMondayStr = formatDateKey(weekDates[0]);
        const { data: intentionData } = await supabase
          .from("weekly_intentions")
          .select("*")
          .or(`user_id.eq.${publicUserId || uid},user_id.eq.${uid}`)
          .eq("week_start_date", weekMondayStr)
          .maybeSingle();

        setWeeklyIntention(intentionData);
      }
    } catch (err) {
      console.error("Error loading calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryRange.startStr, queryRange.endStr, auth.userId, selectedGoalieFilter]);

  // Date Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(currentDate.getDate() - 1);
    } else if (viewMode === "week") {
      next.setDate(currentDate.getDate() - 7);
    } else if (viewMode === "month") {
      next.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === "year") {
      next.setFullYear(currentDate.getFullYear() - 1);
    }
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(currentDate.getDate() + 1);
    } else if (viewMode === "week") {
      next.setDate(currentDate.getDate() + 7);
    } else if (viewMode === "month") {
      next.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === "year") {
      next.setFullYear(currentDate.getFullYear() + 1);
    }
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Navigation Header Title Label
  const navigationTitle = useMemo(() => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } else if (viewMode === "week") {
      const mon = weekDates[0];
      const sun = weekDates[6];
      const monMonth = mon.toLocaleDateString("en-US", { month: "short" });
      const sunMonth = sun.toLocaleDateString("en-US", { month: "short" });
      const year = sun.getFullYear();
      if (monMonth === sunMonth) {
        return `${monMonth} ${mon.getDate()} – ${sun.getDate()}, ${year}`;
      }
      return `${monMonth} ${mon.getDate()} – ${sunMonth} ${sun.getDate()}, ${year}`;
    } else if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else {
      return `${currentDate.getFullYear()}`;
    }
  }, [viewMode, currentDate, weekDates]);

  // Aggregate events for a specific date key (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string) => {
    const dayGames = (roleTrackFilter === 'coach') ? [] : games.filter(g => g.scheduled_date === dateStr);
    const dayPractices = (roleTrackFilter === 'coach') ? [] : practices.filter(p => p.scheduled_date === dateStr);
    const dayHockey = (roleTrackFilter === 'coach') ? [] : athleteHockeySessions.filter(h => h.scheduled_date === dateStr);
    
    const dayPrivate = (roleTrackFilter === 'athlete') ? [] : privateSessions.filter(s => {
      const sDate = s.date || s.start_time;
      if (!sDate) return false;
      if (typeof sDate === 'string') {
        if (sDate.startsWith(dateStr) || sDate.slice(0, 10) === dateStr) return true;
      }
      try {
        const d = new Date(sDate);
        if (!isNaN(d.getTime())) {
          if (formatDateKey(d) === dateStr) return true;
          if (d.toISOString().slice(0, 10) === dateStr) return true;
        }
      } catch {
        return false;
      }
      return false;
    });

    return {
      games: dayGames,
      practices: dayPractices,
      hockeySessions: dayHockey,
      privateSessions: dayPrivate,
      totalCount: dayGames.length + dayPractices.length + dayHockey.length + dayPrivate.length
    };
  };

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    const dateKey = formatDateKey(selectedDate);
    return getEventsForDate(dateKey);
  }, [selectedDate, games, practices, privateSessions, athleteHockeySessions, roleTrackFilter]);

  // Actions
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonNameInput || !seasonStartInput || !seasonEndInput) return;
    setSeasonError("");
    setDbSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setSeason({
          id: "mock-season-1",
          name: seasonNameInput,
          start_date: seasonStartInput,
          end_date: seasonEndInput,
          is_active: true
        });
        setDbSaving(false);
        setShowSeasonModal(false);
        return;
      }

      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      
      const publicUserId = userRes?.id;
      if (!publicUserId) {
        const msg = "User profile not found. Please complete account setup first.";
        setSeasonError(msg);
        return;
      }

      const { data, error } = await supabase
        .from("seasons")
        .insert({
          user_id: publicUserId,
          name: seasonNameInput,
          start_date: seasonStartInput,
          end_date: seasonEndInput,
          is_active: true,
          sport: "Lacrosse"
        })
        .select()
        .single();

      if (error) {
        setSeasonError(error.message || "Failed to save season. Please try again.");
        return;
      }
      setSeason(data);
      setShowSeasonModal(false);
      loadData();
    } catch (err: any) {
      setSeasonError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleUpdateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!season?.id || !seasonNameInput || !seasonStartInput || !seasonEndInput) return;
    setSeasonError("");
    setDbSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setSeason({ ...season, name: seasonNameInput, start_date: seasonStartInput, end_date: seasonEndInput });
        setDbSaving(false);
        setShowSeasonModal(false);
        return;
      }

      const { data, error } = await supabase
        .from("seasons")
        .update({
          name: seasonNameInput,
          start_date: seasonStartInput,
          end_date: seasonEndInput,
        })
        .eq("id", season.id)
        .select()
        .single();

      if (error) {
        setSeasonError(error.message || "Failed to update season. Please try again.");
        return;
      }
      setSeason(data);
      setShowSeasonModal(false);
      loadData();
    } catch (err: any) {
      setSeasonError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingDate || !trainingTime) return;
    setDbSaving(true);
    try {
      const uid = auth.userId;
      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      const publicUserId = userRes?.id;
      
      if (uid === "00000000-0000-0000-0000-000000000000" || !publicUserId) {
        const newTraining = {
          id: String(Date.now()),
          opponent: trainingFocus || "Training",
          scheduled_date: trainingDate,
          scheduled_time: trainingTime + ":00",
          location: trainingLocation || "TBD",
          game_type: "training"
        };
        setGames([...games, newTraining]);
        setShowTrainingModal(false);
        setDbSaving(false);
        return;
      }

      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          season_id: season?.id,
          opponent_name: trainingFocus || "Training",
          game_date: trainingDate,
          location: trainingLocation || "TBD"
        })
        .select()
        .single();

      if (gameError) throw gameError;

      const { data, error } = await supabase
        .from("game_sessions")
        .insert({
          user_id: publicUserId,
          season_id: season?.id,
          game_id: gameData.id,
          opponent: trainingFocus || "Training",
          location: trainingLocation || "TBD",
          scheduled_date: trainingDate,
          scheduled_time: trainingTime + ":00",
          game_type: "training",
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;
      setGames([...games, data]);
      setShowTrainingModal(false);
      setShowUnifiedAddModal(false);
      setTrainingFocus("");
      setTrainingLocation("");
    } catch (err: any) {
      console.error("Add training error:", err);
    } finally {
      setDbSaving(false);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameOpponent || !gameDate || !gameTime) return;
    setDbSaving(true);
    try {
      const uid = auth.userId;
      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      const publicUserId = userRes?.id;
      
      if (uid === "00000000-0000-0000-0000-000000000000" || !publicUserId) {
        const newGame = {
          id: String(Date.now()),
          opponent: gameOpponent,
          location: gameLocation || "TBD",
          scheduled_date: gameDate,
          scheduled_time: gameTime + ":00",
          game_type: gameType
        };
        setGames([...games, newGame]);
        setShowGameModal(false);
        setShowUnifiedAddModal(false);
        setDbSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("game_sessions")
        .insert({
          user_id: uid,
          season_id: season?.id,
          opponent: gameOpponent,
          location: gameLocation || "TBD",
          scheduled_date: gameDate,
          scheduled_time: gameTime + ":00",
          game_type: gameType,
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;
      setGames([...games, data]);
      setShowGameModal(false);
      setShowUnifiedAddModal(false);
      setGameOpponent("");
      setGameLocation("");
      setGameDate("");
      setGameTime("");
    } catch (err) {
      console.error("Create game error:", err);
    } finally {
      setDbSaving(false);
    }
  };

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceDate || !practiceTime) return;
    setDbSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        const newPractice = {
          id: String(Date.now()),
          scheduled_date: practiceDate,
          scheduled_time: practiceTime + ":00",
          location: practiceLocation || "TBD",
          notes: practiceNotes
        };
        setPractices([...practices, newPractice]);
        setShowPracticeModal(false);
        setShowUnifiedAddModal(false);
        setDbSaving(false);
        return;
      }

      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      
      const publicUserId = userRes?.id;
      if (!publicUserId) throw new Error("Public user not found");

      const { data, error } = await supabase
        .from("practices")
        .insert({
          user_id: publicUserId,
          season_id: season?.id,
          scheduled_date: practiceDate,
          scheduled_time: practiceTime + ":00",
          location: practiceLocation || "TBD",
          notes: practiceNotes || null
        })
        .select()
        .single();

      if (error) throw error;
      setPractices([...practices, data]);
      setShowPracticeModal(false);
      setShowUnifiedAddModal(false);
      setPracticeDate("");
      setPracticeTime("");
      setPracticeLocation("");
      setPracticeNotes("");
    } catch (err) {
      console.error("Create practice error:", err);
    } finally {
      setDbSaving(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonDate || !lessonTime) return;
    setDbSaving(true);
    try {
      const selectedRoster = rosterGoalies.find(g => g.id === lessonRosterId);
      const athleteName = selectedRoster ? selectedRoster.name : (lessonAthleteName || "Private Athlete");
      const isoDate = `${lessonDate}T${lessonTime.includes(':') && lessonTime.split(':').length === 2 ? lessonTime + ':00' : lessonTime}`;
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          date: isoDate,
          start_time: isoDate,
          location: lessonLocation || "Field / Training Facility",
          notes: `${athleteName}${lessonNotes ? ` - ${lessonNotes}` : ''}`.trim(),
          roster_id: lessonRosterId && lessonRosterId !== 'custom' ? lessonRosterId : null,
          lesson_number: lessonNumber ? Number(lessonNumber) : null
        })
        .select()
        .single();

      if (error) throw error;
      
      setShowUnifiedAddModal(false);
      setLessonAthleteName("");
      setLessonRosterId("");
      setLessonNotes("");
      setLessonLocation("");
      setLessonNumber("");
      loadData();
    } catch (err: any) {
      console.error("Create lesson error:", err);
      alert("Error creating lesson: " + (err?.message || "Unknown error"));
    } finally {
      setDbSaving(false);
    }
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editGameOpponent || !editGameDate || !editGameTime) return;
    setEditGameError("");
    setDbSaving(true);
    try {
      const uid = auth.userId;
      const formattedTime = editGameTime.includes(":") && editGameTime.split(":").length === 2 ? editGameTime + ":00" : editGameTime;
      
      if (uid === "00000000-0000-0000-0000-000000000000") {
        const updatedGames = games.map((g) =>
          g.id === editingGame.id
            ? {
                ...g,
                opponent: editGameOpponent,
                location: editGameLocation || "TBD",
                scheduled_date: editGameDate,
                scheduled_time: formattedTime,
                game_type: editGameType
              }
            : g
        );
        setGames(updatedGames);
        setEditingGame(null);
        setDbSaving(false);
        return;
      }

      const { error } = await supabase
        .from("game_sessions")
        .update({
          opponent: editGameOpponent,
          location: editGameLocation || "TBD",
          scheduled_date: editGameDate,
          scheduled_time: formattedTime,
          game_type: editGameType,
        })
        .eq("id", editingGame.id);

      if (error) {
        setEditGameError(error.message || "Failed to update game.");
        return;
      }

      setEditingGame(null);
      loadData();
    } catch (err: any) {
      setEditGameError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!editingGame) return;
    setDbSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setGames(games.filter((g) => g.id !== editingGame.id));
        setEditingGame(null);
        setDbSaving(false);
        return;
      }

      const { error } = await supabase
        .from("game_sessions")
        .delete()
        .eq("id", editingGame.id);

      if (error) throw error;

      setEditingGame(null);
      loadData();
    } catch (err) {
      setEditGameError("Failed to delete game.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleUpdatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPractice || !editPracticeDate || !editPracticeTime) return;
    setEditPracticeError("");
    setDbSaving(true);
    try {
      const uid = auth.userId;
      const formattedTime = editPracticeTime.includes(":") && editPracticeTime.split(":").length === 2 ? editPracticeTime + ":00" : editPracticeTime;
      
      if (uid === "00000000-0000-0000-0000-000000000000") {
        const updatedPractices = practices.map((p) =>
          p.id === editingPractice.id
            ? {
                ...p,
                scheduled_date: editPracticeDate,
                scheduled_time: formattedTime,
                location: editPracticeLocation || "TBD",
                notes: editPracticeNotes
              }
            : p
        );
        setPractices(updatedPractices);
        setEditingPractice(null);
        setDbSaving(false);
        return;
      }

      const { error } = await supabase
        .from("practices")
        .update({
          scheduled_date: editPracticeDate,
          scheduled_time: formattedTime,
          location: editPracticeLocation || "TBD",
          notes: editPracticeNotes || null
        })
        .eq("id", editingPractice.id);

      if (error) {
        setEditPracticeError(error.message || "Failed to update practice.");
        return;
      }

      setEditingPractice(null);
      loadData();
    } catch (err: any) {
      setEditPracticeError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleDeletePractice = async () => {
    if (!editingPractice) return;
    setDbSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setPractices(practices.filter((p) => p.id !== editingPractice.id));
        setEditingPractice(null);
        setDbSaving(false);
        return;
      }

      const { error } = await supabase
        .from("practices")
        .delete()
        .eq("id", editingPractice.id);

      if (error) throw error;

      setEditingPractice(null);
      loadData();
    } catch (err) {
      setEditPracticeError("Failed to delete practice.");
    } finally {
      setDbSaving(false);
    }
  };

  // Coaching Lesson Handlers
  const openEditLesson = (sess: any) => {
    setEditingLesson(sess);
    setLessonDeleteConfirm(false);
    setEditLessonError("");

    setEditLessonRosterId(sess.roster_id || "");
    setEditLessonAthleteName(sess.athlete_name || (sess.notes ? sess.notes.split(' - ')[0] : ""));
    
    // Parse date & time
    let dStr = "";
    let tStr = "09:00";
    if (sess.date) {
      if (sess.date.includes('T')) {
        const [d, t] = sess.date.split('T');
        dStr = d;
        if (t) tStr = t.slice(0, 5);
      } else {
        dStr = sess.date.slice(0, 10);
      }
    }
    if (sess.start_time) {
      if (sess.start_time.includes('T')) {
        tStr = sess.start_time.split('T')[1].slice(0, 5);
      } else if (sess.start_time.includes(':')) {
        tStr = sess.start_time.slice(0, 5);
      }
    } else if (sess.notes) {
      const match = sess.notes.match(/(\d+:\d+)/);
      if (match) tStr = match[1];
    }
    
    setEditLessonDate(dStr || formatDateKey(new Date()));
    setEditLessonTime(tStr || "09:00");
    setEditLessonLocation(sess.location || "Bell Memorial Park");
    setEditLessonNotes(sess.notes || "");
    setEditLessonSessionNum(sess.session_number !== null && sess.session_number !== undefined ? sess.session_number : "");
    setEditLessonLessonNum(sess.lesson_number !== null && sess.lesson_number !== undefined ? sess.lesson_number : "");
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonDate || !editLessonTime) return;
    setEditLessonError("");
    setDbSaving(true);
    try {
      const selectedRoster = rosterGoalies.find(g => g.id === editLessonRosterId);
      const athleteName = selectedRoster ? selectedRoster.name : (editLessonAthleteName || "Private Athlete");
      const isoDate = `${editLessonDate}T${editLessonTime.includes(':') && editLessonTime.split(':').length === 2 ? editLessonTime + ':00' : editLessonTime}`;

      const { error } = await supabase
        .from('sessions')
        .update({
          date: isoDate,
          start_time: isoDate,
          location: editLessonLocation || "Field / Training Facility",
          notes: editLessonNotes || athleteName,
          roster_id: editLessonRosterId && editLessonRosterId !== 'custom' ? editLessonRosterId : null,
          session_number: editLessonSessionNum ? Number(editLessonSessionNum) : null,
          lesson_number: editLessonLessonNum ? Number(editLessonLessonNum) : null
        })
        .eq('id', editingLesson.id);

      if (error) throw error;

      // Automatically dispatch in-app notification to athlete/parent if location or schedule changed
      const locationChanged = editingLesson.location && editLessonLocation && editingLesson.location.trim() !== editLessonLocation.trim();
      const dateChanged = editLessonDate && editingLesson.date && !editingLesson.date.startsWith(editLessonDate);
      const targetUserId = editingLesson.goalie_id || selectedRoster?.linked_user_id;

      if (locationChanged || dateChanged) {
        try {
          await supabase.from('notifications').insert({
            user_id: targetUserId || null,
            title: "Training Session Updated 📍",
            message: `Coach Elliott updated your lesson details${locationChanged ? ` • Location: ${editLessonLocation}` : ''}${dateChanged ? ` • Date: ${editLessonDate}` : ''}`,
            type: 'schedule',
            is_read: false
          });
        } catch (notifErr) {
          console.error("Error creating update notification:", notifErr);
        }
      }

      setEditingLesson(null);
      loadData();
    } catch (err: any) {
      setEditLessonError(err?.message || "Failed to update coaching lesson.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!editingLesson) return;
    setDbSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', editingLesson.id);

      if (error) throw error;

      setEditingLesson(null);
      loadData();
    } catch (err: any) {
      setEditLessonError(err?.message || "Failed to delete coaching lesson.");
    } finally {
      setDbSaving(false);
    }
  };

  const openHockeyDetail = (sess: any) => {
    setSelectedHockeySession(sess);
  };

  // Open Unified Add Event modal pre-filling selected date and initial tab
  const openAddEvent = (type: "game" | "practice" | "training" | "lesson" = "training", defaultDate?: Date) => {
    const targetDate = defaultDate || selectedDate || currentDate;
    const targetDateStr = formatDateKey(targetDate);
    
    setAddModalTab(type);
    
    setGameDate(targetDateStr);
    setGameTime("15:00");
    
    setPracticeDate(targetDateStr);
    setPracticeTime("17:00");
    
    setTrainingDate(targetDateStr);
    setTrainingTime("11:00");

    setLessonDate(targetDateStr);
    setLessonTime("16:00");
    
    setShowUnifiedAddModal(true);
    setShowAddEventDropdown(false);
  };

  if (loading && !season && privateSessions.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-[#00E676] mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading Goalie Calendar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-28 md:pb-20">
      {/* Top App Header */}
      <div className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard" 
              className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2 m-0">
                <CalendarIcon size={18} className="text-[#00E676]" />
                Goalie Schedule
              </h1>
            </div>
          </div>

          {/* Center/Right: Athlete Filter & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Goalie / Athlete Selector */}
            {rosterGoalies.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedGoalieFilter}
                  onChange={(e) => setSelectedGoalieFilter(e.target.value)}
                  className="bg-muted border border-border text-foreground text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#00E676] max-w-[150px] sm:max-w-[200px] truncate"
                  title="Filter calendar by athlete"
                >
                  <option value="all">👥 All Goalies ({rosterGoalies.length})</option>
                  {rosterGoalies.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Link to CoachCard Roster / Clients */}
            <Link
              href="/coach"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-xs font-bold text-foreground border border-border hover:border-[#00E676] rounded-xl transition-colors shadow-xs"
              title="Open CoachCard Client & Roster Ledger"
            >
              <span>CoachCard Ledger</span>
              <span className="text-[#00E676]">→</span>
            </Link>

            {/* Quick Action: Add Event */}
            <div className="relative">
              <button 
                onClick={() => openAddEvent("training")} 
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#00E676] hover:bg-[#00C853] text-black transition-all rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm active:scale-95"
              >
                <Plus size={15} /> 
                <span className="hidden xs:inline">Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* DUAL-ROLE ATHLETE & COACH TRACK SWITCHER */}
        <div className="bg-gradient-to-r from-cyan-950/30 via-card to-emerald-950/30 border border-border/80 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">Dual-Role Schedule</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                  NHL Pro Prospect
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  CoachCard • The Goalie Brand
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground m-0 mt-0.5">
                Manage your personal pro hockey training alongside your lacrosse coaching lessons.
              </p>
            </div>
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/60 text-xs font-bold gap-1 self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setRoleTrackFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                roleTrackFilter === 'all' ? "bg-[#00E676] text-black font-black shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers size={13} />
              <span>All Activities</span>
            </button>
            <button
              onClick={() => setRoleTrackFilter('athlete')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                roleTrackFilter === 'athlete' ? "bg-cyan-400 text-black font-black shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Dumbbell size={13} />
              <span>Athlete Track (Hockey)</span>
            </button>
            <button
              onClick={() => setRoleTrackFilter('coach')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                roleTrackFilter === 'coach' ? "bg-emerald-400 text-black font-black shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={13} />
              <span>Coaching Track (Lacrosse)</span>
            </button>
          </div>
        </div>

        {/* VIEW CONTROLLER & DATE NAVIGATOR BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm">
          {/* Left: View Mode Switcher (Day / Week / Month / Year) */}
          <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/60 self-center md:self-auto overflow-x-auto">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "day"
                  ? "bg-[#00E676] text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun size={13} />
              <span>Day</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "week"
                  ? "bg-[#00E676] text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays size={13} />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "month"
                  ? "bg-[#00E676] text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarRange size={13} />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === "year"
                  ? "bg-[#00E676] text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={13} />
              <span>Year</span>
            </button>
          </div>

          {/* Center/Right: Prev / Title / Next Navigation */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3">
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-muted hover:bg-muted-foreground/20 text-foreground border border-border rounded-lg transition-colors"
            >
              Today
            </button>

            <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl p-1">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Previous period"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs sm:text-sm font-black text-foreground tracking-tight text-center min-w-[140px] sm:min-w-[170px]">
                {navigationTitle}
              </span>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Next period"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Season Badge */}
            {season && (
              <button
                type="button"
                onClick={() => {
                  setSeasonNameInput(season.name || "");
                  setSeasonStartInput(season.start_date || "");
                  setSeasonEndInput(season.end_date || "");
                  setSeasonError("");
                  setShowSeasonModal(true);
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted border border-border rounded-lg transition-colors"
                title="Edit active season"
              >
                <Pencil size={11} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{season.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* WEEKLY INTENTION BANNER (Shown in Day & Week views if present) */}
        {(viewMode === "day" || viewMode === "week") && weeklyIntention && (
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#00E676]/10 text-[#00E676] rounded-xl shrink-0 mt-0.5">
                <Flame size={16} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00E676]">Weekly Intention</span>
                <p className="text-xs sm:text-sm font-semibold text-foreground m-0 mt-0.5 leading-snug">
                  "{weeklyIntention.intention_text}"
                </p>
              </div>
            </div>
            <Link
              href="/calendar/week"
              className="shrink-0 px-3 py-1.5 bg-muted hover:bg-muted-foreground/20 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors hidden sm:block"
            >
              Adjust Intention
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. DAY VIEW */}
        {/* ======================================================== */}
        {viewMode === "day" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
              {/* Day Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${
                    isToday(currentDate) ? "bg-[#00E676] text-black" : "bg-muted text-foreground"
                  }`}>
                    <span className="text-[10px] uppercase leading-none">{currentDate.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="text-base leading-none mt-1">{currentDate.getDate()}</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground m-0">
                      {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {isToday(currentDate) && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#00E676]/20 text-[#00E676] rounded-md border border-[#00E676]/30">
                          Today
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-medium">
                        {selectedDateEvents.totalCount === 0 
                          ? "No events scheduled" 
                          : `${selectedDateEvents.totalCount} Event${selectedDateEvents.totalCount > 1 ? 's' : ''} scheduled`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddEvent("training", currentDate)}
                    className="px-3 py-1.5 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Day Event List / Timeline */}
              {selectedDateEvents.totalCount === 0 ? (
                <div className="py-12 text-center max-w-sm mx-auto">
                  <CalendarIcon size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-bold text-foreground mb-1">Rest & Recovery Day</p>
                  <p className="text-xs text-muted-foreground mb-6">No training sessions, coaching lessons, games, or practices scheduled.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => openAddEvent("training", currentDate)}
                      className="px-3 py-2 bg-muted hover:bg-cyan-400 hover:text-black border border-border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Dumbbell size={13} />
                      <span>Log Training</span>
                    </button>
                    <button
                      onClick={() => openAddEvent("lesson", currentDate)}
                      className="px-3 py-2 bg-muted hover:bg-emerald-400 hover:text-black border border-border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Users size={13} />
                      <span>Book Lesson</span>
                    </button>
                    <button
                      onClick={() => openAddEvent("game", currentDate)}
                      className="px-3 py-2 bg-muted hover:bg-amber-400 hover:text-black border border-border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Award size={13} />
                      <span>Add Game</span>
                    </button>
                    <button
                      onClick={() => openAddEvent("practice", currentDate)}
                      className="px-3 py-2 bg-muted hover:bg-blue-400 hover:text-black border border-border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Shield size={13} />
                      <span>Add Practice</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Games */}
                  {selectedDateEvents.games.map((game, gIdx) => {
                    const today = new Date();
                    const gameDateObj = new Date(game.scheduled_date);
                    const isGamePast = gameDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    return (
                      <div
                        key={`day-g-${gIdx}`}
                        onClick={() => {
                          setEditingGame(game);
                          setEditGameOpponent(game.opponent || "");
                          setEditGameLocation(game.location || "");
                          setEditGameDate(game.scheduled_date || "");
                          setEditGameTime(game.scheduled_time ? game.scheduled_time.substring(0, 5) : "");
                          setEditGameType(game.game_type || "game");
                          setEditGameError("");
                          setGameDeleteConfirm(false);
                        }}
                        className="p-4 bg-muted/40 hover:bg-muted/70 border border-border rounded-2xl transition-all cursor-pointer space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#00E676] text-black rounded-lg">
                              {game.game_type || "GAME"}
                            </span>
                            <h3 className="text-base font-bold text-foreground m-0">{game.opponent}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#00E676]" /> {formatTime(game.scheduled_time)}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#00E676]" /> {game.location || "Home Field"}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href="/film"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted-foreground/20 border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-foreground transition-colors"
                          >
                            <Video size={13} /> Film Breakdown
                          </Link>
                          {isGamePast ? (
                            <Link
                              href={`/calendar/postgame?date=${game.scheduled_date}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border hover:bg-muted-foreground/20 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <Smile size={13} /> Debrief Game
                            </Link>
                          ) : (
                            <Link
                              href={`/calendar/pregame?date=${game.scheduled_date}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E676] hover:bg-[#00C853] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <Clock size={13} /> Pre-Game Routine
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Practices */}
                  {selectedDateEvents.practices.map((practice, pIdx) => (
                    <div
                      key={`day-p-${pIdx}`}
                      onClick={() => {
                        setEditingPractice(practice);
                        setEditPracticeDate(practice.scheduled_date || "");
                        setEditPracticeTime(practice.scheduled_time ? practice.scheduled_time.substring(0, 5) : "");
                        setEditPracticeLocation(practice.location || "");
                        setEditPracticeNotes(practice.notes || "");
                        setEditPracticeError("");
                        setPracticeDeleteConfirm(false);
                      }}
                      className="p-4 bg-muted/40 hover:bg-muted/70 border border-border rounded-2xl transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg">
                            PRACTICE
                          </span>
                          <h3 className="text-base font-bold text-foreground m-0">Team Practice</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock size={13} className="text-blue-400" /> {formatTime(practice.scheduled_time)}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-blue-400" /> {practice.location || "Practice Turf"}</span>
                        </div>
                      </div>
                      {practice.notes && (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 pt-1 m-0">
                          <FileText size={13} /> Notes: {practice.notes}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Pro Hockey Training Sessions (Athlete Track) */}
                  {selectedDateEvents.hockeySessions.map((hSess, hIdx) => (
                    <div
                      key={`day-hockey-${hIdx}`}
                      onClick={() => openHockeyDetail(hSess)}
                      className="p-4 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-cyan-400 text-black rounded-lg flex items-center gap-1">
                            <span>🏒</span> NHL PRO TRACK
                          </span>
                          {hSess.confidence && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              hSess.confidence === 'EXACT' 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {hSess.confidence === 'EXACT' ? '✓ EXACT DATE' : '⚡ RECONSTRUCTED'}
                            </span>
                          )}
                          {hSess.phase && (
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {hSess.phase}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock size={13} className="text-cyan-400" /> {formatTime(hSess.scheduled_time)}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={13} className="text-cyan-400" /> {hSess.location || "Ice Arena"}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-foreground m-0">
                        {hSess.title}
                      </h3>

                      {/* Warm-up / Mobility */}
                      {hSess.warmup && (
                        <p className="text-xs text-muted-foreground m-0">
                          <span className="font-bold text-cyan-300">Warm-up: </span>{hSess.warmup}
                        </p>
                      )}

                      {/* Strength Exercises */}
                      {hSess.strength && hSess.strength.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Strength & Loads:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {hSess.strength.map((st: string, sIdx: number) => (
                              <span key={sIdx} className="text-xs font-semibold px-2 py-1 bg-card border border-border/80 rounded-lg text-foreground">
                                {st}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Athletic & Balance */}
                      {(hSess.athletic || hSess.balance) && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Athletic & Balance:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {hSess.athletic?.map((ath: string, aIdx: number) => (
                              <span key={`ath-${aIdx}`} className="text-xs font-semibold px-2 py-1 bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 rounded-lg">
                                {ath}
                              </span>
                            ))}
                            {hSess.balance?.map((bal: string, bIdx: number) => (
                              <span key={`bal-${bIdx}`} className="text-xs font-semibold px-2 py-1 bg-purple-950/40 border border-purple-500/20 text-purple-200 rounded-lg">
                                ⚖️ {bal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cues Box */}
                      {hSess.cues && hSess.cues.length > 0 && (
                        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-start gap-2">
                          <Target size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">Performance Cues:</span>
                            {hSess.cues.map((cue: string, cIdx: number) => (
                              <p key={cIdx} className="text-xs font-bold text-cyan-200 m-0">{cue}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Athlete Reflection */}
                      {hSess.athleteReflection && (
                        <div className="p-2.5 bg-card/70 border border-border/80 rounded-xl text-xs italic text-foreground">
                          <span className="font-bold not-italic text-emerald-400">Athlete Reflection: </span>
                          "{hSess.athleteReflection}"
                        </div>
                      )}

                      {/* Coach Notes */}
                      {(hSess.coachNotes || hSess.notes) && (
                        <div className="p-3 bg-card/60 rounded-xl border border-border/50 text-xs text-muted-foreground">
                          {hSess.coachNotes ? (
                            <>
                              <span className="font-bold text-cyan-300">Coach Alpha: </span>
                              {hSess.coachNotes}
                              {hSess.notes && hSess.notes !== hSess.coachNotes && (
                                <p className="mt-1 pt-1 border-t border-border/30 text-muted-foreground m-0">{hSess.notes}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-cyan-300">Log Notes: </span>
                              {hSess.notes}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Private Training Sessions (Lacrosse Coach Track) */}
                  {selectedDateEvents.privateSessions.map((pSess, pIdx) => {
                    const timeMatch = pSess.notes?.match(/(\d+:\d+\s*(?:AM|PM)\s*–\s*\d+:\d+\s*(?:AM|PM))/i) || pSess.notes?.match(/(\d+:\d+\s*(?:AM|PM))/i);
                    const displayTime = timeMatch ? timeMatch[0] : (pSess.start_time ? new Date(pSess.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Private Slot");

                    return (
                      <div
                        key={`day-priv-${pIdx}`}
                        onClick={() => openEditLesson(pSess)}
                        className="p-4 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#00E676] text-black rounded-lg">
                              COACHING LESSON
                            </span>
                            <h3 className="text-base font-bold text-foreground m-0">
                              {pSess.athlete_name || (pSess.notes ? pSess.notes.split(' - ')[0] : "Private Goalie Session")}
                            </h3>
                            {(pSess.session_number || pSess.lesson_number) && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                                {[
                                  pSess.session_number ? `S${pSess.session_number}` : '',
                                  pSess.lesson_number ? `L${pSess.lesson_number}` : ''
                                ].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#00E676]" /> {displayTime}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[#00E676]" /> {pSess.location || "Bell Memorial Park"}</span>
                          </div>
                        </div>
                        {pSess.notes && (
                          <div className="p-3 bg-card/60 rounded-xl border border-border/50 text-xs text-muted-foreground mt-2">
                            <span className="font-bold text-foreground">Coach Takeaways: </span>
                            {pSess.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. WEEK VIEW */}
        {/* ======================================================== */}
        {viewMode === "week" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground m-0">
                7-Day Schedule
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {games.length + practices.length + privateSessions.length} total events this week
              </span>
            </div>

            {/* 7-Day Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDates.map((date, idx) => {
                const dateStr = formatDateKey(date);
                const dayEvents = getEventsForDate(dateStr);
                const isDayToday = isToday(date);

                return (
                  <div 
                    key={idx}
                    className={`rounded-[20px] p-3.5 sm:p-4 border transition-all flex flex-col min-h-[180px] ${
                      isDayToday 
                        ? "bg-card border-[#00E676]/40 shadow-md ring-1 ring-[#00E676]/20" 
                        : "bg-card border-border/60 hover:border-border"
                    }`}
                  >
                    {/* Day Card Header */}
                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border/50">
                      <div>
                        <p className={`m-0 text-xs font-black uppercase tracking-widest ${isDayToday ? "text-[#00E676]" : "text-muted-foreground"}`}>
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className={`m-0 text-lg font-bold tracking-tight ${isDayToday ? "text-foreground font-black" : "text-foreground/80"}`}>
                          {date.getDate()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isDayToday && (
                          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
                        )}
                        <button
                          onClick={() => {
                            setCurrentDate(date);
                            setSelectedDate(date);
                            setViewMode("day");
                          }}
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md text-[10px] font-bold"
                          title="Zoom into day view"
                        >
                          <Sun size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Events in Day */}
                    <div className="flex-1 flex flex-col gap-2.5">
                      {dayEvents.totalCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center opacity-30 text-center py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rest</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Games */}
                          {dayEvents.games.map((game, gIdx) => {
                            const today = new Date();
                            const gameDateObj = new Date(game.scheduled_date);
                            const isGamePast = gameDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                            return (
                              <div 
                                key={`week-g-${gIdx}`} 
                                onClick={() => {
                                  setEditingGame(game);
                                  setEditGameOpponent(game.opponent || "");
                                  setEditGameLocation(game.location || "");
                                  setEditGameDate(game.scheduled_date || "");
                                  setEditGameTime(game.scheduled_time ? game.scheduled_time.substring(0, 5) : "");
                                  setEditGameType(game.game_type || "game");
                                  setEditGameError("");
                                  setGameDeleteConfirm(false);
                                }}
                                className="p-2.5 bg-muted/60 hover:bg-muted border border-border rounded-xl cursor-pointer transition-all space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#00E676] text-black rounded-md">
                                    {game.game_type || "GAME"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
                                    <Clock size={10} /> {formatTime(game.scheduled_time)}
                                  </span>
                                </div>
                                <p className="m-0 text-xs font-bold leading-snug line-clamp-2">{game.opponent}</p>
                                
                                <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                                  {isGamePast ? (
                                    <Link 
                                      href={`/calendar/postgame?date=${game.scheduled_date}`} 
                                      className="text-[9px] font-bold uppercase px-2 py-0.5 bg-muted hover:bg-muted-foreground/20 border border-border rounded-md text-foreground transition-colors"
                                    >
                                      Debrief
                                    </Link>
                                  ) : (
                                    <Link 
                                      href={`/calendar/pregame?date=${game.scheduled_date}`} 
                                      className="text-[9px] font-bold uppercase px-2 py-0.5 bg-[#00E676] text-black hover:bg-[#00C853] rounded-md transition-colors"
                                    >
                                      Prepare
                                    </Link>
                                  )}
                                  <Link
                                    href="/film"
                                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 hover:bg-muted-foreground/20 text-muted-foreground rounded-md"
                                  >
                                    Film
                                  </Link>
                                </div>
                              </div>
                            );
                          })}

                          {/* Practices */}
                          {dayEvents.practices.map((practice, pIdx) => (
                            <div 
                              key={`week-p-${pIdx}`} 
                              onClick={() => {
                                setEditingPractice(practice);
                                setEditPracticeDate(practice.scheduled_date || "");
                                setEditPracticeTime(practice.scheduled_time ? practice.scheduled_time.substring(0, 5) : "");
                                setEditPracticeLocation(practice.location || "");
                                setEditPracticeNotes(practice.notes || "");
                                setEditPracticeError("");
                                setPracticeDeleteConfirm(false);
                              }}
                              className="p-2.5 bg-muted/40 hover:bg-muted/70 border border-border/60 rounded-xl cursor-pointer transition-all space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">
                                  PRACTICE
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {formatTime(practice.scheduled_time)}
                                </span>
                              </div>
                              <p className="m-0 text-xs font-bold text-foreground/90 leading-tight">Team Practice</p>
                            </div>
                          ))}

                          {/* Pro Hockey Training Sessions (Athlete Track) */}
                          {dayEvents.hockeySessions.map((hSess, hIdx) => (
                            <div 
                              key={`week-hsess-${hIdx}`}
                              onClick={() => openHockeyDetail(hSess)}
                              className="p-2.5 bg-cyan-950/25 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl transition-all cursor-pointer space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-cyan-400 text-black rounded-md">
                                  🏒 PRO HOCKEY
                                </span>
                                <span className="text-[9px] text-cyan-300 font-bold truncate">
                                  {formatTime(hSess.scheduled_time)}
                                </span>
                              </div>
                              <p className="m-0 text-xs font-bold text-foreground leading-tight truncate">
                                {hSess.title}
                              </p>
                              <p className="m-0 text-[10px] text-muted-foreground truncate">
                                {hSess.location || "Ice Arena"}
                              </p>
                            </div>
                          ))}

                          {/* Private Training (Lacrosse Coach Track) */}
                          {dayEvents.privateSessions.map((pSess, pIdx) => {
                            const timeMatch = pSess.notes?.match(/(\d+:\d+\s*(?:AM|PM)\s*–\s*\d+:\d+\s*(?:AM|PM))/i) || pSess.notes?.match(/(\d+:\d+\s*(?:AM|PM))/i);
                            const displayTime = timeMatch ? timeMatch[0] : (pSess.start_time ? new Date(pSess.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "Private Slot");

                            return (
                              <div 
                                key={`week-psess-${pIdx}`}
                                onClick={() => openEditLesson(pSess)}
                                className="p-2.5 bg-emerald-950/25 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl transition-all cursor-pointer space-y-1"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#00E676] text-black rounded-md">
                                    COACHING
                                  </span>
                                  {(pSess.session_number || pSess.lesson_number) && (
                                    <span className="text-[9px] text-emerald-400 font-bold truncate font-mono">
                                      {[
                                        pSess.session_number ? `S${pSess.session_number}` : '',
                                        pSess.lesson_number ? `L${pSess.lesson_number}` : ''
                                      ].filter(Boolean).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <p className="m-0 text-xs font-bold text-foreground leading-tight truncate">
                                  {pSess.athlete_name || (pSess.notes ? pSess.notes.split(' - ')[0] : "Private Goalie Session")}
                                </p>
                                <p className="m-0 text-[10px] text-muted-foreground truncate">
                                  {displayTime}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. MONTH VIEW */}
        {/* ======================================================== */}
        {viewMode === "month" && (
          <div className="space-y-6">
            {/* Month Grid Card */}
            <div className="bg-card border border-border rounded-2xl p-3 sm:p-5 shadow-sm">
              {/* Weekday Header Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-2 border-b border-border">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <div key={i} className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* 42-cell Month Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthGridDates.map((cell, idx) => {
                  const dateKey = formatDateKey(cell.date);
                  const dayEvents = getEventsForDate(dateKey);
                  const isCellToday = isToday(cell.date);
                  const isCellSelected = formatDateKey(selectedDate) === dateKey;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[74px] sm:min-h-[108px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        !cell.isCurrentMonth 
                          ? "opacity-30 bg-muted/20 border-transparent hover:opacity-60" 
                          : isCellSelected
                            ? "bg-muted/90 border-[#00E676] shadow-sm ring-1 ring-[#00E676]"
                            : isCellToday
                              ? "bg-card border-[#00E676]/40 shadow-xs ring-1 ring-[#00E676]/30"
                              : "bg-card/70 border-border/50 hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between px-1 pt-0.5 mb-1">
                        <span className={`text-xs sm:text-sm font-bold leading-none ${
                          isCellToday ? "text-[#00E676] font-black" : cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {cell.date.getDate()}
                        </span>
                        {isCellToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>
                        )}
                      </div>

                      {/* Event Indicators */}
                      <div className="mt-1 space-y-1">
                        {/* Mobile dots view */}
                        <div className="flex flex-wrap gap-1 sm:hidden">
                          {dayEvents.hockeySessions.map((_, i) => (
                            <span key={`mh-${i}`} className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          ))}
                          {dayEvents.games.map((_, i) => (
                            <span key={`mg-${i}`} className="w-1.5 h-1.5 rounded-full bg-[#00E676]"></span>
                          ))}
                          {dayEvents.practices.map((_, i) => (
                            <span key={`mp-${i}`} className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          ))}
                          {dayEvents.privateSessions.map((_, i) => (
                            <span key={`mpriv-${i}`} className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          ))}
                        </div>

                        {/* Desktop chips */}
                        <div className="hidden sm:flex flex-col gap-1">
                          {dayEvents.hockeySessions.slice(0, 1).map((h, i) => (
                            <div 
                              key={`h-${i}`} 
                              onClick={(e) => { e.stopPropagation(); openHockeyDetail(h); }}
                              className="px-1.5 py-0.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-[9px] font-bold rounded-md truncate flex items-center gap-1 cursor-pointer transition-colors" 
                              title={h.title}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                              <span className="truncate">{h.title}</span>
                            </div>
                          ))}
                          {dayEvents.games.slice(0, 1).map((g, i) => (
                            <div 
                              key={`g-${i}`} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGame(g);
                                setEditGameOpponent(g.opponent || "");
                                setEditGameLocation(g.location || "");
                                setEditGameDate(g.scheduled_date || "");
                                setEditGameTime(g.scheduled_time ? g.scheduled_time.substring(0, 5) : "");
                                setEditGameType(g.game_type || "game");
                                setEditGameError("");
                                setGameDeleteConfirm(false);
                              }}
                              className="px-1.5 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400 text-amber-300 text-[9px] font-bold rounded-md truncate flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              <span className="truncate">{g.opponent}</span>
                            </div>
                          ))}
                          {dayEvents.practices.slice(0, 1).map((p, i) => (
                            <div 
                              key={`p-${i}`} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPractice(p);
                                setEditPracticeDate(p.scheduled_date || "");
                                setEditPracticeTime(p.scheduled_time ? p.scheduled_time.substring(0, 5) : "");
                                setEditPracticeLocation(p.location || "");
                                setEditPracticeNotes(p.notes || "");
                                setEditPracticeError("");
                                setPracticeDeleteConfirm(false);
                              }}
                              className="px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-400 text-blue-300 text-[9px] font-bold rounded-md truncate flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              <span>Practice</span>
                            </div>
                          ))}
                          {dayEvents.privateSessions.slice(0, 2).map((ps, i) => (
                            <div 
                              key={`priv-${i}`} 
                              onClick={(e) => { e.stopPropagation(); openEditLesson(ps); }}
                              className="px-1.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 text-[9px] font-bold rounded-md truncate flex items-center gap-1 cursor-pointer transition-colors" 
                              title={ps.athlete_name || 'Lesson'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="truncate">{ps.athlete_name ? ps.athlete_name.split(' ')[0] : 'Lesson'} {ps.lesson_number ? `L${ps.lesson_number}` : ''}</span>
                            </div>
                          ))}
                          {dayEvents.totalCount > 3 && (
                            <span className="text-[8px] font-bold text-muted-foreground pl-1">
                              +{dayEvents.totalCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Agenda Drawer (Bottom of month view) */}
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground m-0">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </h3>
                  <p className="text-xs text-muted-foreground m-0 mt-0.5">
                    {selectedDateEvents.totalCount === 0 ? "No events scheduled" : `${selectedDateEvents.totalCount} Event${selectedDateEvents.totalCount > 1 ? 's' : ''}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentDate(selectedDate);
                      setViewMode("day");
                    }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted-foreground/20 text-xs font-bold text-foreground border border-border rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Sun size={13} />
                    <span>Open Day View</span>
                  </button>
                  <button
                    onClick={() => openAddEvent("training", selectedDate)}
                    className="px-3 py-1.5 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* Selected Day Event Cards */}
              {selectedDateEvents.totalCount === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No events on this day. Tap "+ Add" to log a training session, game, or practice.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Pro Hockey Training Sessions (Athlete Track) */}
                  {selectedDateEvents.hockeySessions.map((hSess, i) => (
                    <div 
                      key={`m-h-${i}`} 
                      onClick={() => openHockeyDetail(hSess)}
                      className="p-3.5 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-cyan-400 text-black rounded-md flex items-center gap-1">
                            <span>🏒</span> NHL PRO TRACK
                          </span>
                          {hSess.confidence && (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              hSess.confidence === 'EXACT' 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {hSess.confidence === 'EXACT' ? '✓ EXACT' : '⚡ RECONSTRUCTED'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-cyan-300 font-mono">
                          {formatTime(hSess.scheduled_time)}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground m-0">{hSess.title}</h4>
                      <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                        <MapPin size={11} className="text-cyan-400" /> {hSess.location || "Ice Arena"}
                      </p>
                      {hSess.strength && hSess.strength.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {hSess.strength.slice(0, 3).map((st: string, sIdx: number) => (
                            <span key={sIdx} className="text-[10px] font-medium px-1.5 py-0.5 bg-card border border-border/70 rounded text-foreground">
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                      {hSess.cues && hSess.cues.length > 0 && (
                        <p className="text-[11px] font-bold text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-500/20 m-0">
                          🎯 {hSess.cues[0]}
                        </p>
                      )}
                      {hSess.athleteReflection && (
                        <p className="text-[11px] text-emerald-300 italic pt-1 border-t border-border/40 m-0">
                          "{hSess.athleteReflection}"
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Games */}
                  {selectedDateEvents.games.map((game, i) => (
                    <div 
                      key={`m-g-${i}`} 
                      onClick={() => {
                        setEditingGame(game);
                        setEditGameOpponent(game.opponent || "");
                        setEditGameLocation(game.location || "");
                        setEditGameDate(game.scheduled_date || "");
                        setEditGameTime(game.scheduled_time ? game.scheduled_time.substring(0, 5) : "");
                        setEditGameType(game.game_type || "game");
                        setEditGameError("");
                        setGameDeleteConfirm(false);
                      }}
                      className="p-3 bg-muted/40 hover:bg-muted/70 border border-border hover:border-border/80 rounded-xl cursor-pointer transition-all space-y-1.5"
                    >
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#00E676] text-black rounded-md">
                        {game.game_type || "GAME"}
                      </span>
                      <h4 className="text-sm font-bold text-foreground m-0">{game.opponent}</h4>
                      <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                        <Clock size={11} /> {formatTime(game.scheduled_time)} • <MapPin size={11} /> {game.location || "Home"}
                      </p>
                    </div>
                  ))}

                  {/* Practices */}
                  {selectedDateEvents.practices.map((practice, i) => (
                    <div 
                      key={`m-p-${i}`} 
                      onClick={() => {
                        setEditingPractice(practice);
                        setEditPracticeDate(practice.scheduled_date || "");
                        setEditPracticeTime(practice.scheduled_time ? practice.scheduled_time.substring(0, 5) : "");
                        setEditPracticeLocation(practice.location || "");
                        setEditPracticeNotes(practice.notes || "");
                        setEditPracticeError("");
                        setPracticeDeleteConfirm(false);
                      }}
                      className="p-3 bg-muted/40 hover:bg-muted/70 border border-border hover:border-border/80 rounded-xl cursor-pointer transition-all space-y-1.5"
                    >
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">
                        PRACTICE
                      </span>
                      <h4 className="text-sm font-bold text-foreground m-0">Team Practice</h4>
                      <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                        <Clock size={11} /> {formatTime(practice.scheduled_time)} • <MapPin size={11} /> {practice.location || "Turf"}
                      </p>
                    </div>
                  ))}

                  {/* Lacrosse Coaching Lessons */}
                  {selectedDateEvents.privateSessions.map((pSess, i) => (
                    <div 
                      key={`m-priv-${i}`} 
                      onClick={() => openEditLesson(pSess)}
                      className="p-3.5 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#00E676] text-black rounded-md">
                          COACHING LESSON
                        </span>
                        {(pSess.session_number || pSess.lesson_number) && (
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">
                            {[
                              pSess.session_number ? `S${pSess.session_number}` : '',
                              pSess.lesson_number ? `L${pSess.lesson_number}` : ''
                            ].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground m-0">
                        {pSess.athlete_name || (pSess.notes ? pSess.notes.split(' - ')[0] : "Private Goalie Session")}
                      </h4>
                      <p className="text-xs text-muted-foreground m-0 flex items-center gap-1">
                        <MapPin size={11} className="text-[#00E676]" /> {pSess.location || "Bell Memorial Park"}
                      </p>
                      {pSess.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic pt-1 border-t border-border/40">
                          "{pSess.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. YEAR VIEW */}
        {/* ======================================================== */}
        {viewMode === "year" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground m-0">
                  {currentDate.getFullYear()} Season Overview
                </h2>
                <p className="text-xs text-muted-foreground m-0">
                  Tap any month to jump into Month View or explore full schedule density.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-muted rounded-xl border border-border text-muted-foreground">
                  {(() => {
                    let count = 0;
                    if (roleTrackFilter === 'all' || roleTrackFilter === 'coach') {
                      count += games.length + practices.length + privateSessions.length;
                    }
                    if (roleTrackFilter === 'all' || roleTrackFilter === 'athlete') {
                      count += athleteHockeySessions.filter(h => new Date(h.date).getFullYear() === currentDate.getFullYear()).length;
                    }
                    return count;
                  })()} Events in {currentDate.getFullYear()}
                </span>
              </div>
            </div>

            {/* 12 Mini Months Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, monthIndex) => {
                const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
                const monthName = monthDate.toLocaleDateString("en-US", { month: "long" });

                // Generate mini calendar grid for this month
                const firstDay = new Date(currentDate.getFullYear(), monthIndex, 1);
                const dayOfWeek = firstDay.getDay(); // 0 = Sun
                const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const daysInMonth = new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();

                const miniCells: (number | null)[] = [];
                for (let p = 0; p < daysSinceMon; p++) {
                  miniCells.push(null);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  miniCells.push(d);
                }

                // Count events in this month
                const coachCount = (roleTrackFilter === 'all' || roleTrackFilter === 'coach') ? (
                  games.filter(g => {
                    const d = new Date(g.scheduled_date);
                    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === monthIndex;
                  }).length + practices.filter(p => {
                    const d = new Date(p.scheduled_date);
                    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === monthIndex;
                  }).length + privateSessions.filter(s => {
                    const d = new Date(s.date);
                    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === monthIndex;
                  }).length
                ) : 0;

                const athleteCount = (roleTrackFilter === 'all' || roleTrackFilter === 'athlete') ? (
                  athleteHockeySessions.filter(h => {
                    const d = new Date(h.date);
                    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === monthIndex;
                  }).length
                ) : 0;

                const monthEventsCount = coachCount + athleteCount;

                return (
                  <div
                    key={monthIndex}
                    onClick={() => {
                      const target = new Date(currentDate.getFullYear(), monthIndex, 1);
                      setCurrentDate(target);
                      setSelectedDate(target);
                      setViewMode("month");
                    }}
                    className="bg-card border border-border/80 hover:border-[#00E676] rounded-2xl p-4 transition-all cursor-pointer shadow-xs hover:shadow-md group space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <h4 className="text-sm font-bold text-foreground group-hover:text-[#00E676] transition-colors m-0">
                        {monthName}
                      </h4>
                      {monthEventsCount > 0 && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#00E676]/20 text-[#00E676] rounded-md">
                          {monthEventsCount} {monthEventsCount === 1 ? 'event' : 'events'}
                        </span>
                      )}
                    </div>

                    {/* Mini Day Grid */}
                    <div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {["M", "T", "W", "T", "F", "S", "S"].map((lbl, idx) => (
                          <span key={idx} className="text-[9px] font-black text-muted-foreground/60">
                            {lbl}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {miniCells.map((dayNum, cIdx) => {
                          if (!dayNum) {
                            return <div key={cIdx} className="h-5" />;
                          }

                          const cellDate = new Date(currentDate.getFullYear(), monthIndex, dayNum);
                          const dateKey = formatDateKey(cellDate);
                          const hasEvents = getEventsForDate(dateKey).totalCount > 0;
                          const isTodayCell = isToday(cellDate);

                          return (
                            <div
                              key={cIdx}
                              className={`h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                                isTodayCell
                                  ? "bg-[#00E676] text-black font-black"
                                  : hasEvents
                                    ? "bg-muted text-foreground font-black ring-1 ring-[#00E676]/50"
                                    : "text-muted-foreground/80 hover:bg-muted/40"
                              }`}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unified Multi-Tab Add Event Modal */}
      {showUnifiedAddModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUnifiedAddModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-lg w-full shadow-2xl animate-fade-in cursor-default space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-foreground">Add New Event</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Schedule training, coaching lessons, games, or practices</p>
              </div>
              <button 
                onClick={() => setShowUnifiedAddModal(false)} 
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Event Type Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-muted/80 p-1 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setAddModalTab('training')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  addModalTab === 'training'
                    ? "bg-cyan-400 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Dumbbell size={14} />
                <span>Training</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('lesson')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  addModalTab === 'lesson'
                    ? "bg-emerald-400 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users size={14} />
                <span>Lesson</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('game')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  addModalTab === 'game'
                    ? "bg-amber-400 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Award size={14} />
                <span>Game</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('practice')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  addModalTab === 'practice'
                    ? "bg-blue-400 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield size={14} />
                <span>Practice</span>
              </button>
            </div>

            {/* 1. TRAINING FORM (ATHLETE PRO S&C / ON-ICE) */}
            {addModalTab === 'training' && (
              <form onSubmit={handleCreateTraining} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={trainingDate}
                      onChange={(e) => setTrainingDate(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                    <input 
                      type="time" 
                      value={trainingTime}
                      onChange={(e) => setTrainingTime(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Focus / Training Objective</label>
                  <input 
                    type="text" 
                    value={trainingFocus}
                    onChange={(e) => setTrainingFocus(e.target.value)}
                    placeholder="e.g. S&C Smith Squats 55 lb / On-Ice Edge Work"
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                  <input 
                    type="text" 
                    value={trainingLocation}
                    onChange={(e) => setTrainingLocation(e.target.value)}
                    placeholder="e.g. The Ice / Performance Gym"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowUnifiedAddModal(false)}
                    className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={dbSaving}
                    className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {dbSaving && <Loader2 size={12} className="animate-spin" />}
                    Add Training Session
                  </button>
                </div>
              </form>
            )}

            {/* 2. COACHING LESSON FORM (COACH TRACK) */}
            {addModalTab === 'lesson' && (
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Athlete / Client</label>
                  {rosterGoalies.length > 0 ? (
                    <select
                      value={lessonRosterId}
                      onChange={(e) => {
                        setLessonRosterId(e.target.value);
                        if (e.target.value !== 'custom') {
                          const found = rosterGoalies.find(g => g.id === e.target.value);
                          if (found) setLessonAthleteName(found.name);
                        }
                      }}
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    >
                      <option value="">Select Goalie from Roster...</option>
                      {rosterGoalies.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                      <option value="custom">Other / Custom Athlete Name</option>
                    </select>
                  ) : null}
                  {(!rosterGoalies.length || lessonRosterId === 'custom') && (
                    <input 
                      type="text" 
                      value={lessonAthleteName}
                      onChange={(e) => setLessonAthleteName(e.target.value)}
                      placeholder="e.g. Susie McElheny"
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none mt-2"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={lessonDate}
                      onChange={(e) => setLessonDate(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                    <input 
                      type="time" 
                      value={lessonTime}
                      onChange={(e) => setLessonTime(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                    <input 
                      type="text" 
                      value={lessonLocation}
                      onChange={(e) => setLessonLocation(e.target.value)}
                      placeholder="e.g. Field 1 / Turf"
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Lesson # (Optional)</label>
                    <input 
                      type="number" 
                      value={lessonNumber}
                      onChange={(e) => setLessonNumber(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Drills / Focus Notes</label>
                  <input 
                    type="text" 
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    placeholder="e.g. Low bounce arc play & clear triggers"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowUnifiedAddModal(false)}
                    className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={dbSaving}
                    className="flex-1 py-3 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {dbSaving && <Loader2 size={12} className="animate-spin" />}
                    Book Coaching Lesson
                  </button>
                </div>
              </form>
            )}

            {/* 3. GAME FORM */}
            {addModalTab === 'game' && (
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Opponent</label>
                  <input 
                    type="text" 
                    value={gameOpponent}
                    onChange={(e) => setGameOpponent(e.target.value)}
                    placeholder="e.g. Gladiators / Crusaders"
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={gameDate}
                      onChange={(e) => setGameDate(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                    <input 
                      type="time" 
                      value={gameTime}
                      onChange={(e) => setGameTime(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                    <input 
                      type="text" 
                      value={gameLocation}
                      onChange={(e) => setGameLocation(e.target.value)}
                      placeholder="e.g. Home / Away Arena"
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Game Type</label>
                    <select
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value)}
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    >
                      <option value="game">Regular Season Game</option>
                      <option value="playoff">Playoff Game</option>
                      <option value="scrimmage">Scrimmage</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowUnifiedAddModal(false)}
                    className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={dbSaving}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {dbSaving && <Loader2 size={12} className="animate-spin" />}
                    Add Game
                  </button>
                </div>
              </form>
            )}

            {/* 4. PRACTICE FORM */}
            {addModalTab === 'practice' && (
              <form onSubmit={handleCreatePractice} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={practiceDate}
                      onChange={(e) => setPracticeDate(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                    <input 
                      type="time" 
                      value={practiceTime}
                      onChange={(e) => setPracticeTime(e.target.value)}
                      required
                      className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                  <input 
                    type="text" 
                    value={practiceLocation}
                    onChange={(e) => setPracticeLocation(e.target.value)}
                    placeholder="e.g. Rink B / Practice Turf"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Practice Drills & Notes</label>
                  <input 
                    type="text" 
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    placeholder="e.g. Angle tracking and zone breakouts"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowUnifiedAddModal(false)}
                    className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={dbSaving}
                    className="flex-1 py-3 bg-blue-400 hover:bg-blue-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {dbSaving && <Loader2 size={12} className="animate-spin" />}
                    Add Practice
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingGame(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Edit Scheduled Game</h3>
            <form onSubmit={handleUpdateGame} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Opponent</label>
                <input 
                  type="text" 
                  value={editGameOpponent}
                  onChange={(e) => setEditGameOpponent(e.target.value)}
                  placeholder="e.g. Crusaders Lacrosse"
                  required
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editGameDate}
                    onChange={(e) => setEditGameDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={editGameTime}
                    onChange={(e) => setEditGameTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={editGameLocation}
                  onChange={(e) => setEditGameLocation(e.target.value)}
                  placeholder="e.g. Home Field or Away"
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Game Type</label>
                <select
                  value={editGameType}
                  onChange={(e) => setEditGameType(e.target.value)}
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                >
                  <option value="game">Regular Season Game</option>
                  <option value="playoff">Playoff Game</option>
                  <option value="scrimmage">Scrimmage</option>
                </select>
              </div>
              {editGameError && (
                <p className="text-xs text-red-400 font-medium">{editGameError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingGame(null)}
                  className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Red double-tap Delete section */}
              <div className="border-t border-border pt-4 mt-4 text-center">
                {!gameDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setGameDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none"
                  >
                    Delete game
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <p className="m-0 text-xs text-muted-foreground/80 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGameDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Nevermind
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteGame}
                        disabled={dbSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {dbSaving && <Loader2 size={10} className="animate-spin" />}
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Practice Modal */}
      {editingPractice && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingPractice(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Edit Practice Session</h3>
            <form onSubmit={handleUpdatePractice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editPracticeDate}
                    onChange={(e) => setEditPracticeDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={editPracticeTime}
                    onChange={(e) => setEditPracticeTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={editPracticeLocation}
                  onChange={(e) => setEditPracticeLocation(e.target.value)}
                  placeholder="e.g. Practice Turf 2"
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Practice Notes</label>
                <input 
                  type="text" 
                  value={editPracticeNotes}
                  onChange={(e) => setEditPracticeNotes(e.target.value)}
                  placeholder="e.g. Extra focus on stick work"
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>
              {editPracticeError && (
                <p className="text-xs text-red-400 font-medium">{editPracticeError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingPractice(null)}
                  className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Red double-tap Delete section */}
              <div className="border-t border-border pt-4 mt-4 text-center">
                {!practiceDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setPracticeDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none"
                  >
                    Delete practice
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <p className="m-0 text-xs text-muted-foreground/80 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPracticeDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Nevermind
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePractice}
                        disabled={dbSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {dbSaving && <Loader2 size={10} className="animate-spin" />}
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Season Modal */}
      {showSeasonModal && season && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSeasonModal(false);
              setSeasonError("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-1">Edit Season</h3>
            <p className="text-xs text-muted-foreground mb-5">Update your season name or dates.</p>
            <form onSubmit={handleUpdateSeason} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Season Name</label>
                <input
                  type="text"
                  value={seasonNameInput}
                  onChange={(e) => setSeasonNameInput(e.target.value)}
                  placeholder="e.g. Spring 2026"
                  required
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={seasonStartInput}
                    onChange={(e) => setSeasonStartInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={seasonEndInput}
                    onChange={(e) => setSeasonEndInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
              </div>
              {seasonError && (
                <p className="text-xs text-red-400 font-medium">{seasonError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowSeasonModal(false); setSeasonError(""); }}
                  className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coaching Lesson Modal */}
      {editingLesson && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingLesson(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-lg w-full shadow-2xl animate-fade-in cursor-default space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-[#00E676] text-black rounded-lg">
                    COACHING LESSON
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-lg">
                    LACROSSE
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground m-0">Edit Coaching Lesson</h3>
              </div>
              <button 
                onClick={() => setEditingLesson(null)} 
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-4">
              {/* Goalie Selection */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Goalie / Athlete</label>
                <select
                  value={editLessonRosterId}
                  onChange={(e) => {
                    setEditLessonRosterId(e.target.value);
                    if (e.target.value !== 'custom') {
                      const r = rosterGoalies.find(g => g.id === e.target.value);
                      if (r) setEditLessonAthleteName(r.name);
                    }
                  }}
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                >
                  <option value="">Select Goalie from Roster...</option>
                  {rosterGoalies.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                  <option value="custom">Other / Custom Athlete Name</option>
                </select>
                {editLessonRosterId === 'custom' && (
                  <input
                    type="text"
                    value={editLessonAthleteName}
                    onChange={(e) => setEditLessonAthleteName(e.target.value)}
                    placeholder="Enter athlete full name..."
                    className="w-full mt-2 text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                )}
              </div>

              {/* SX and LY Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Session # (SX)</label>
                  <input 
                    type="number"
                    min="1"
                    value={editLessonSessionNum}
                    onChange={(e) => setEditLessonSessionNum(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Lesson # (LY)</label>
                  <input 
                    type="number"
                    min="1"
                    value={editLessonLessonNum}
                    onChange={(e) => setEditLessonLessonNum(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editLessonDate}
                    onChange={(e) => setEditLessonDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={editLessonTime}
                    onChange={(e) => setEditLessonTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Location / Facility</label>
                <input 
                  type="text" 
                  value={editLessonLocation}
                  onChange={(e) => setEditLessonLocation(e.target.value)}
                  placeholder="e.g. Bell Memorial Park"
                  className="w-full text-sm font-semibold bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none"
                />
              </div>

              {/* Notes & Coach Takeaways */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Coach Takeaways / Notes & Drills</label>
                <textarea 
                  rows={4}
                  value={editLessonNotes}
                  onChange={(e) => setEditLessonNotes(e.target.value)}
                  placeholder="Session notes, feedback, and key focal points..."
                  className="w-full text-sm font-medium bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:border-[#00E676] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {editLessonError && (
                <p className="text-xs text-red-400 font-medium">{editLessonError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingLesson(null)}
                  className="flex-1 py-3 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#00E676] hover:bg-[#00C853] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Red double-tap Delete section */}
              <div className="border-t border-border pt-4 mt-4 text-center">
                {!lessonDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setLessonDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none"
                  >
                    Delete lesson
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <p className="m-0 text-xs text-muted-foreground/80 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLessonDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-muted hover:bg-muted-foreground/20 border border-border text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Nevermind
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteLesson}
                        disabled={dbSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-foreground text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {dbSaving && <Loader2 size={10} className="animate-spin" />}
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pro Goalie Training (Athlete Track) Details Modal */}
      {selectedHockeySession && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedHockeySession(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 max-w-xl w-full shadow-2xl animate-fade-in cursor-default space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-cyan-400 text-black rounded-lg flex items-center gap-1">
                    <span>🏒</span> NHL PRO TRACK
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 rounded-lg">
                    ICE HOCKEY
                  </span>
                  {selectedHockeySession.confidence && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      selectedHockeySession.confidence === 'EXACT' 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {selectedHockeySession.confidence === 'EXACT' ? '✓ EXACT DATE' : '⚡ RECONSTRUCTED'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground m-0">{selectedHockeySession.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedHockeySession(null)} 
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Date & Location Bar */}
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/60 p-3 rounded-xl border border-border">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock size={14} className="text-cyan-400" />
                {selectedHockeySession.scheduled_date} • {formatTime(selectedHockeySession.scheduled_time)}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin size={14} className="text-cyan-400" />
                {selectedHockeySession.location || "Ice Arena / Gym"}
              </span>
            </div>

            {/* Cues Box */}
            {selectedHockeySession.cues && selectedHockeySession.cues.length > 0 && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-black uppercase tracking-wider">
                  <Target size={14} /> Performance Cues
                </div>
                {selectedHockeySession.cues.map((cue: string, cIdx: number) => (
                  <p key={cIdx} className="text-xs font-bold text-cyan-200 m-0 pl-1">• {cue}</p>
                ))}
              </div>
            )}

            {/* Warmup */}
            {selectedHockeySession.warmup && (
              <div className="p-3 bg-card rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">Warm-up & Prep</span>
                <p className="text-xs text-foreground m-0">{selectedHockeySession.warmup}</p>
              </div>
            )}

            {/* Strength Protocols */}
            {selectedHockeySession.strength && selectedHockeySession.strength.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Strength & Power Protocol</span>
                <div className="flex flex-wrap gap-2">
                  {selectedHockeySession.strength.map((st: string, sIdx: number) => (
                    <span key={sIdx} className="text-xs font-medium px-3 py-1.5 bg-muted border border-border rounded-xl text-foreground">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Athletic & Plyometric Movement */}
            {selectedHockeySession.athletic && selectedHockeySession.athletic.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Athletic Speed & Agility</span>
                <div className="flex flex-wrap gap-2">
                  {selectedHockeySession.athletic.map((ath: string, aIdx: number) => (
                    <span key={aIdx} className="text-xs font-medium px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 rounded-xl">
                      {ath}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Core & Balance */}
            {(selectedHockeySession.core || selectedHockeySession.balance) && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Core & Stability</span>
                <div className="flex flex-wrap gap-2">
                  {selectedHockeySession.core?.map((c: string, cIdx: number) => (
                    <span key={`core-${cIdx}`} className="text-xs font-medium px-3 py-1.5 bg-muted border border-border rounded-xl text-foreground">
                      {c}
                    </span>
                  ))}
                  {selectedHockeySession.balance?.map((bal: string, bIdx: number) => (
                    <span key={`bal-${bIdx}`} className="text-xs font-medium px-3 py-1.5 bg-purple-950/40 border border-purple-500/30 text-purple-200 rounded-xl">
                      ⚖️ {bal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery */}
            {selectedHockeySession.recovery && selectedHockeySession.recovery.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Recovery Protocol</span>
                <div className="flex flex-wrap gap-2">
                  {selectedHockeySession.recovery.map((rec: string, rIdx: number) => (
                    <span key={rIdx} className="text-xs font-medium px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl">
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Athlete Reflection */}
            {selectedHockeySession.athleteReflection && (
              <div className="p-3 bg-card rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Athlete Reflection</span>
                <p className="text-xs italic text-foreground m-0">"{selectedHockeySession.athleteReflection}"</p>
              </div>
            )}

            {/* Coach Alpha Strategic Notes */}
            {(selectedHockeySession.coachNotes || selectedHockeySession.notes) && (
              <div className="p-3 bg-muted/60 rounded-xl border border-border space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">Coach Alpha Directives</span>
                <p className="text-xs text-muted-foreground m-0 whitespace-pre-wrap leading-relaxed">
                  {selectedHockeySession.coachNotes || selectedHockeySession.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                type="button" 
                onClick={() => setSelectedHockeySession(null)}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
