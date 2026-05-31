"use client";

import { useEffect, useState } from "react";
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
  Pencil
} from "lucide-react";

export default function CalendarPage() {
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [weeklyIntention, setWeeklyIntention] = useState<any>(null);
  
  // Date tracking: offset 0 = current week, -1 = last week, 1 = next week, etc.
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  // Setup forms
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonNameInput, setSeasonNameInput] = useState("");
  const [seasonStartInput, setSeasonStartInput] = useState("");
  const [seasonEndInput, setSeasonEndInput] = useState("");
  const [seasonError, setSeasonError] = useState("");

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

  const [dbSaving, setDbSaving] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  // Compute week dates based on weekOffset
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMon + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(day);
    }
    setWeekDates(dates);
  }, [weekOffset]);

  const loadData = async () => {
    if (!auth.userId || weekDates.length === 0) return;
    setLoading(true);
    try {
      const uid = auth.userId;
      
      // Developer bypass mock values
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setSeason({
          id: "00000000-0000-0000-0000-000000000000",
          name: "Spring 2026",
          is_active: true
        });
        setWeeklyIntention({
          intention_text: "Maintain high hands and explode on bounce shots."
        });
        
        const mon = weekDates[0];
        const gameDay = new Date(mon);
        gameDay.setDate(mon.getDate() + 2); // Wednesday
        const practiceDay = new Date(mon);
        practiceDay.setDate(mon.getDate() + 1); // Tuesday

        setGames([{
          id: "mock-game-1",
          opponent: "Crusaders Lacrosse",
          location: "Home Field",
          scheduled_date: gameDay.toISOString().split("T")[0],
          scheduled_time: "15:00:00",
          game_type: "game"
        }]);

        setPractices([{
          id: "mock-practice-1",
          scheduled_date: practiceDay.toISOString().split("T")[0],
          scheduled_time: "17:00:00",
          location: "Practice Turf 2",
          notes: "Special teams focus and crease slides."
        }]);

        setLoading(false);
        return;
      }

      // 1. Fetch active season
      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      
      const publicUserId = userRes?.id;
      if (!publicUserId) {
        setLoading(false);
        return;
      }

      const { data: seasonData } = await supabase
        .from("seasons")
        .select("*")
        .eq("user_id", publicUserId)
        .eq("is_active", true)
        .maybeSingle();

      setSeason(seasonData);

      if (seasonData) {
        const startStr = weekDates[0].toISOString().split("T")[0];
        const endStr = weekDates[6].toISOString().split("T")[0];

        // 2. Fetch games for selected week
        const { data: gamesData } = await supabase
          .from("game_sessions")
          .select("*")
          .eq("user_id", uid) // Game sessions query by auth user_id matching dashboard
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr);
        
        setGames(gamesData || []);

        // 3. Fetch practices for selected week
        const { data: practicesData } = await supabase
          .from("practices")
          .select("*")
          .eq("user_id", publicUserId)
          .gte("scheduled_date", startStr)
          .lte("scheduled_date", endStr);

        setPractices(practicesData || []);

        // 4. Fetch weekly intention
        const { data: intentionData } = await supabase
          .from("weekly_intentions")
          .select("*")
          .eq("user_id", publicUserId)
          .eq("week_start_date", startStr)
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
    if (weekDates.length > 0 && auth.userId) {
      loadData();
    }
  }, [weekDates, auth.userId]);

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
        console.error("Create season error:", msg);
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
        console.error("Create season Supabase error:", error);
        setSeasonError(error.message || "Failed to save season. Please try again.");
        return;
      }
      setSeason(data);
      setShowSeasonModal(false);
      loadData();
    } catch (err: any) {
      console.error("Create season error:", err);
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
        console.error("Update season Supabase error:", error);
        setSeasonError(error.message || "Failed to update season. Please try again.");
        return;
      }
      setSeason(data);
      setShowSeasonModal(false);
      loadData();
    } catch (err: any) {
      console.error("Update season error:", err);
      setSeasonError(err?.message || "An unexpected error occurred.");
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
      if (uid === "00000000-0000-0000-0000-000000000000") {
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

      const { data, error } = await supabase
        .from("game_sessions")
        .update({
          opponent: editGameOpponent,
          location: editGameLocation || "TBD",
          scheduled_date: editGameDate,
          scheduled_time: formattedTime,
          game_type: editGameType
        })
        .eq("id", editingGame.id)
        .select()
        .single();

      if (error) {
        console.error("Update game Supabase error details:", error);
        setEditGameError(error.message || "Failed to update game. Please try again.");
        return;
      }

      const updatedGames = games.map((g) => (g.id === editingGame.id ? data : g));
      setGames(updatedGames);
      setEditingGame(null);
    } catch (err: any) {
      console.error("Update game unexpected error:", err);
      setEditGameError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!editingGame) return;
    setEditGameError("");
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

      if (error) {
        console.error("Delete game Supabase error details:", error);
        setEditGameError(error.message || "Failed to delete game. Please try again.");
        return;
      }

      setGames(games.filter((g) => g.id !== editingGame.id));
      setEditingGame(null);
    } catch (err: any) {
      console.error("Delete game unexpected error:", err);
      setEditGameError(err?.message || "An unexpected error occurred.");
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
                notes: editPracticeNotes || null
              }
            : p
        );
        setPractices(updatedPractices);
        setEditingPractice(null);
        setDbSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from("practices")
        .update({
          scheduled_date: editPracticeDate,
          scheduled_time: formattedTime,
          location: editPracticeLocation || "TBD",
          notes: editPracticeNotes || null
        })
        .eq("id", editingPractice.id)
        .select()
        .single();

      if (error) {
        console.error("Update practice Supabase error details:", error);
        setEditPracticeError(error.message || "Failed to update practice. Please try again.");
        return;
      }

      const updatedPractices = practices.map((p) => (p.id === editingPractice.id ? data : p));
      setPractices(updatedPractices);
      setEditingPractice(null);
    } catch (err: any) {
      console.error("Update practice unexpected error:", err);
      setEditPracticeError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const handleDeletePractice = async () => {
    if (!editingPractice) return;
    setEditPracticeError("");
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

      if (error) {
        console.error("Delete practice Supabase error details:", error);
        setEditPracticeError(error.message || "Failed to delete practice. Please try again.");
        return;
      }

      setPractices(practices.filter((p) => p.id !== editingPractice.id));
      setEditingPractice(null);
    } catch (err: any) {
      console.error("Delete practice unexpected error:", err);
      setEditPracticeError(err?.message || "An unexpected error occurred.");
    } finally {
      setDbSaving(false);
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    const hour = parseInt(parts[0]);
    const min = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${min} ${ampm}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  if (auth.loading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  // Active Week Labels
  const weekStartLabel = weekDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekEndLabel = weekDates[6]?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div 
      className="min-h-screen bg-[#09090B] text-white font-sans py-8 px-4 md:px-8"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          {season && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowGameModal(true)} 
                className="flex items-center gap-1.5 px-3 py-2 bg-[#006747] hover:bg-[#005238] transition-colors rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Plus size={14} /> Add Game
              </button>
              <button 
                onClick={() => setShowPracticeModal(true)} 
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Plus size={14} /> Add Practice
              </button>
            </div>
          )}
        </div>

        {/* Season Check */}
        {!season ? (
          <div className="rounded-[32px] p-8 md:p-12 bg-[#1C1C1E] border border-white/10 shadow-xl text-center max-w-xl mx-auto my-12">
            <CalendarIcon size={48} className="mx-auto text-white/30 mb-6" />
            <h2 className="text-2xl font-bold tracking-tight mb-3">Set Up Your Season</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              Goalie Card coordinates your weekly intentions, game preparation, and post-game film reviews around an active season schedule. Set up your season now to start logging your pulse.
            </p>
            <form onSubmit={handleCreateSeason} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Season Name</label>
                <input 
                  type="text" 
                  value={seasonNameInput}
                  onChange={(e) => setSeasonNameInput(e.target.value)}
                  placeholder="e.g. Spring 2026"
                  required
                  className="w-full text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={seasonStartInput}
                    onChange={(e) => setSeasonStartInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={seasonEndInput}
                    onChange={(e) => setSeasonEndInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={dbSaving}
                className="w-full mt-6 py-4 bg-[#006747] hover:bg-[#005238] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {dbSaving && <Loader2 size={16} className="animate-spin" />}
                Initialize Season
              </button>
              {seasonError && (
                <p className="mt-3 text-xs text-red-400 font-medium text-center">{seasonError}</p>
              )}
            </form>
          </div>
        ) : (
          <>
            {/* Week Switcher Block */}
            <div className="flex items-center justify-between bg-[#1C1C1E] border border-white/10 rounded-[24px] p-4 mb-4 shadow-sm">
              <button 
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="m-0 text-sm font-bold tracking-tight">{weekStartLabel} — {weekEndLabel}</p>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">{season.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSeasonNameInput(season.name || "");
                      setSeasonStartInput(season.start_date || "");
                      setSeasonEndInput(season.end_date || "");
                      setSeasonError("");
                      setShowSeasonModal(true);
                    }}
                    className="text-white/25 hover:text-white/60 transition-colors cursor-pointer"
                    aria-label="Edit season"
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Intention Card */}
            <div className="rounded-[32px] p-6 bg-[#1C1C1E] border border-white/10 shadow-sm mb-6 relative overflow-hidden">
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 15%, rgba(0,103,71,0.07), transparent 60%)', pointerEvents: 'none' }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="m-0 text-[10px] font-black uppercase tracking-widest text-white/40">Weekly Intention</p>
                  <Link 
                    href="/calendar/week" 
                    className="text-[10px] font-black uppercase tracking-widest text-[#006747] hover:text-[#4ade80] transition-colors"
                  >
                    {weeklyIntention ? "Adjust Intention" : "Set Intention"}
                  </Link>
                </div>
                {weeklyIntention ? (
                  <p className="m-0 text-lg md:text-xl font-bold tracking-tight text-white/90 leading-tight">
                    &ldquo;{weeklyIntention.intention_text}&rdquo;
                  </p>
                ) : (
                  <div>
                    <p className="m-0 text-sm font-medium text-white/40 mb-3">No intention set for this week.</p>
                    <Link 
                      href="/calendar/week" 
                      className="inline-flex items-center gap-1 px-4 py-2 bg-[#006747]/10 text-[#006747] border border-[#006747]/20 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-[#006747]/20 transition-colors"
                    >
                      Begin Weekly Setup
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Daily schedule items */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Schedule</p>
              
              {weekDates.map((date, idx) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayGames = games.filter(g => g.scheduled_date === dateStr);
                const dayPractices = practices.filter(p => p.scheduled_date === dateStr);
                
                const hasEvents = dayGames.length > 0 || dayPractices.length > 0;
                const isDayToday = isToday(date);

                return (
                  <div 
                    key={idx}
                    className={`rounded-[24px] p-5 border transition-all ${
                      isDayToday 
                        ? "bg-[#1C1C1E] border-[#006747]/30 shadow-md" 
                        : "bg-[#1C1C1E]/50 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDayToday ? "bg-[#006747] text-white" : "bg-white/5 text-white/60"
                        }`}>
                          {date.getDate()}
                        </span>
                        <div>
                          <p className="m-0 text-xs font-bold">
                            {date.toLocaleDateString("en-US", { weekday: "long" })}
                          </p>
                          <p className="m-0 text-[9px] font-bold text-white/40 tracking-wider">
                            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {isDayToday && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#006747]/20 text-[#006747] rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    {!hasEvents ? (
                      <p className="m-0 text-xs text-white/30 italic pl-1">No scheduled games or practices.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Render Games */}
                        {dayGames.map((game, gIdx) => {
                          const today = new Date();
                          const gameDateObj = new Date(game.scheduled_date);
                          const isGamePast = gameDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          
                          return (
                            <div 
                              key={gIdx} 
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
                              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/25 hover:bg-black/35 border border-white/5 rounded-2xl cursor-pointer transition-all"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#006747] text-white rounded-full">
                                    {game.game_type || "GAME"}
                                  </span>
                                  <p className="m-0 text-sm font-bold">{game.opponent}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                                  <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(game.scheduled_time)}</span>
                                  <span className="flex items-center gap-1"><MapPin size={12} /> {game.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Link 
                                  href="/film" 
                                  className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  <Video size={12} /> View Film
                                </Link>
                                
                                {isGamePast ? (
                                  <Link 
                                    href={`/calendar/postgame?date=${game.scheduled_date}`} 
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    <Smile size={12} /> Debrief
                                  </Link>
                                ) : (
                                  <Link 
                                    href={`/calendar/pregame?date=${game.scheduled_date}`} 
                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#006747]/20 border border-[#006747]/30 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    <Clock size={12} /> Prepare
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Render Practices */}
                        {dayPractices.map((practice, pIdx) => (
                          <div 
                            key={pIdx} 
                            onClick={() => {
                              setEditingPractice(practice);
                              setEditPracticeDate(practice.scheduled_date || "");
                              setEditPracticeTime(practice.scheduled_time ? practice.scheduled_time.substring(0, 5) : "");
                              setEditPracticeLocation(practice.location || "");
                              setEditPracticeNotes(practice.notes || "");
                              setEditPracticeError("");
                              setPracticeDeleteConfirm(false);
                            }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/10 hover:bg-black/20 border border-white/5 rounded-2xl cursor-pointer transition-all"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/10 text-white/80 rounded-full">
                                  PRACTICE
                                </span>
                                <p className="m-0 text-sm font-bold">Team Practice</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                                <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(practice.scheduled_time)}</span>
                                <span className="flex items-center gap-1"><MapPin size={12} /> {practice.location}</span>
                              </div>
                              {practice.notes && (
                                <p className="m-0 text-xs text-white/40 italic flex items-center gap-1 pt-1">
                                  <FileText size={12} /> Note: {practice.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* MODALS */}
      {/* Add Game Modal */}
      {showGameModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGameModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Add Scheduled Game</h3>
            <form onSubmit={handleCreateGame} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Opponent</label>
                <input 
                  type="text" 
                  value={gameOpponent}
                  onChange={(e) => setGameOpponent(e.target.value)}
                  placeholder="e.g. Crusaders Lacrosse"
                  required
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={gameDate}
                    onChange={(e) => setGameDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={gameTime}
                    onChange={(e) => setGameTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={gameLocation}
                  onChange={(e) => setGameLocation(e.target.value)}
                  placeholder="e.g. Home Field or Away"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Game Type</label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                >
                  <option value="game">Regular Season Game</option>
                  <option value="playoff">Playoff Game</option>
                  <option value="scrimmage">Scrimmage</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowGameModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#006747] hover:bg-[#005238] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Add Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Practice Modal */}
      {showPracticeModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPracticeModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Add Practice Session</h3>
            <form onSubmit={handleCreatePractice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={practiceDate}
                    onChange={(e) => setPracticeDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={practiceTime}
                    onChange={(e) => setPracticeTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={practiceLocation}
                  onChange={(e) => setPracticeLocation(e.target.value)}
                  placeholder="e.g. Practice Turf 2"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Practice Notes</label>
                <input 
                  type="text" 
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  placeholder="e.g. Extra focus on stick work"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowPracticeModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#006747] hover:bg-[#005238] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Add Practice
                </button>
              </div>
            </form>
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
          <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Edit Scheduled Game</h3>
            <form onSubmit={handleUpdateGame} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Opponent</label>
                <input 
                  type="text" 
                  value={editGameOpponent}
                  onChange={(e) => setEditGameOpponent(e.target.value)}
                  placeholder="e.g. Crusaders Lacrosse"
                  required
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editGameDate}
                    onChange={(e) => setEditGameDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={editGameTime}
                    onChange={(e) => setEditGameTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={editGameLocation}
                  onChange={(e) => setEditGameLocation(e.target.value)}
                  placeholder="e.g. Home Field or Away"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Game Type</label>
                <select
                  value={editGameType}
                  onChange={(e) => setEditGameType(e.target.value)}
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
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
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#006747] hover:bg-[#005238] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Red double-tap Delete section */}
              <div className="border-t border-white/5 pt-4 mt-4 text-center">
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
                    <p className="m-0 text-xs text-white/60 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGameDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Nevermind
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteGame}
                        disabled={dbSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
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
          <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-4">Edit Practice Session</h3>
            <form onSubmit={handleUpdatePractice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editPracticeDate}
                    onChange={(e) => setEditPracticeDate(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Time</label>
                  <input 
                    type="time" 
                    value={editPracticeTime}
                    onChange={(e) => setEditPracticeTime(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Location</label>
                <input 
                  type="text" 
                  value={editPracticeLocation}
                  onChange={(e) => setEditPracticeLocation(e.target.value)}
                  placeholder="e.g. Practice Turf 2"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Practice Notes</label>
                <input 
                  type="text" 
                  value={editPracticeNotes}
                  onChange={(e) => setEditPracticeNotes(e.target.value)}
                  placeholder="e.g. Extra focus on stick work"
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              {editPracticeError && (
                <p className="text-xs text-red-400 font-medium">{editPracticeError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingPractice(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#006747] hover:bg-[#005238] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>

              {/* Red double-tap Delete section */}
              <div className="border-t border-white/5 pt-4 mt-4 text-center">
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
                    <p className="m-0 text-xs text-white/60 font-medium">Are you sure? This cannot be undone.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPracticeDeleteConfirm(false)}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                      >
                        Nevermind
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePractice}
                        disabled={dbSaving}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
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

      {/* Edit Season Modal — shown when a season already exists and pencil is clicked */}
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
          <div className="bg-[#1C1C1E] border border-white/10 rounded-[32px] p-6 max-w-md w-full shadow-2xl animate-fade-in cursor-default">
            <h3 className="text-lg font-bold tracking-tight mb-1">Edit Season</h3>
            <p className="text-xs text-white/40 mb-5">Update your season name or dates.</p>
            <form onSubmit={handleUpdateSeason} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Season Name</label>
                <input
                  type="text"
                  value={seasonNameInput}
                  onChange={(e) => setSeasonNameInput(e.target.value)}
                  placeholder="e.g. Spring 2026"
                  required
                  className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={seasonStartInput}
                    onChange={(e) => setSeasonStartInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={seasonEndInput}
                    onChange={(e) => setSeasonEndInput(e.target.value)}
                    required
                    className="w-full text-sm font-semibold bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#006747] focus:outline-none"
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
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dbSaving}
                  className="flex-1 py-3 bg-[#006747] hover:bg-[#005238] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {dbSaving && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
