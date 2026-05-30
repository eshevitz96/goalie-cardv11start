"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FlowScreen from "@/components/calendar/FlowScreen";
import MoodScale, { MoodValue } from "@/components/calendar/MoodScale";
import TextInput from "@/components/calendar/TextInput";
import { Loader2, Clock, MapPin, Calendar as CalendarIcon } from "lucide-react";

type Step = "week_overview" | "mood" | "focus" | "confirmation";

export default function WeeklySetupPage() {
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("week_overview");
  const [saving, setSaving] = useState(false);

  const [games, setGames] = useState<any[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [focusText, setFocusText] = useState("");
  const [weekStartDate, setWeekStartDate] = useState("");

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  // Compute Monday of the current week
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMon);
    monday.setHours(0, 0, 0, 0);

    const monStr = monday.toISOString().split("T")[0];
    setWeekStartDate(monStr);
  }, []);

  const loadWeeklySchedule = async () => {
    if (!auth.userId || !weekStartDate) return;
    setLoading(true);
    try {
      const uid = auth.userId;

      // Dev bypass
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setGames([{
          id: "mock-g-1",
          opponent: "Crusaders Lacrosse",
          scheduled_time: "15:00:00",
          location: "Home Field"
        }]);
        setPractices([{
          id: "mock-p-1",
          scheduled_time: "17:00:00",
          location: "Practice Turf 2"
        }]);
        setLoading(false);
        return;
      }

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

      const nextMon = new Date(weekStartDate);
      nextMon.setDate(nextMon.getDate() + 7);
      const nextMonStr = nextMon.toISOString().split("T")[0];

      // 1. Fetch game sessions for this week
      const { data: gamesData } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", uid)
        .gte("scheduled_date", weekStartDate)
        .lt("scheduled_date", nextMonStr);
      
      setGames(gamesData || []);

      // 2. Fetch practices for this week
      const { data: practicesData } = await supabase
        .from("practices")
        .select("*")
        .eq("user_id", publicUserId)
        .gte("scheduled_date", weekStartDate)
        .lt("scheduled_date", nextMonStr);

      setPractices(practicesData || []);
    } catch (err) {
      console.error("Error loading weekly schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekStartDate && auth.userId) {
      loadWeeklySchedule();
    }
  }, [weekStartDate, auth.userId]);

  const handleNextStep = () => {
    if (step === "week_overview") {
      setStep("mood");
    } else if (step === "mood") {
      setStep("focus");
    }
  };

  const handleBackStep = () => {
    if (step === "week_overview") {
      router.push("/calendar");
    } else if (step === "mood") {
      setStep("week_overview");
    } else if (step === "focus") {
      setStep("mood");
    } else if (step === "confirmation") {
      setStep("focus");
    }
  };

  const saveWeeklyIntention = async () => {
    if (!focusText.trim() || !weekStartDate) return;
    setSaving(true);
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        setStep("confirmation");
        setSaving(false);
        return;
      }

      const { data: userRes } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", uid)
        .single();
      
      const publicUserId = userRes?.id;
      if (!publicUserId) throw new Error("Public user not found");

      // Check if intention exists for this week
      const { data: existingIntention } = await supabase
        .from("weekly_intentions")
        .select("id")
        .eq("user_id", publicUserId)
        .eq("week_start_date", weekStartDate)
        .maybeSingle();

      if (existingIntention) {
        // Update
        const { error } = await supabase
          .from("weekly_intentions")
          .update({
            intention_text: focusText.trim()
          })
          .eq("id", existingIntention.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("weekly_intentions")
          .insert({
            user_id: publicUserId,
            week_start_date: weekStartDate,
            intention_text: focusText.trim()
          });
        if (error) throw error;
      }

      setStep("confirmation");
    } catch (err) {
      console.error("Error saving weekly intention:", err);
    } finally {
      setSaving(false);
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

  const hasEvents = games.length > 0 || practices.length > 0;

  if (auth.loading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  return (
    <div className="calendar-root">
      <FlowScreen onBack={handleBackStep} showBack={step !== "confirmation"}>
        
        {step === "week_overview" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-8">
              Here&apos;s your week.
            </h1>
            
            {!hasEvents ? (
              <div className="bg-card border border-border-subtle rounded-2xl p-6 text-center mb-8">
                <CalendarIcon size={32} className="mx-auto text-text-muted mb-4 animate-logo-pulse" />
                <p className="m-0 text-body font-medium text-text-secondary">No games or practices scheduled.</p>
                <p className="m-0 text-caption text-text-muted mt-1">You can add games and practices directly from the calendar later.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 mb-8 no-scrollbar">
                {games.map((game, idx) => (
                  <div key={idx} className="bg-card border border-border-subtle rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="m-0 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                        {game.game_type === "playoff" ? "PLAYOFF GAME" : "GAME"}
                      </p>
                      <p className="m-0 text-body-lg font-bold text-text-primary mt-1">{game.opponent}</p>
                      <div className="flex items-center gap-3 text-caption text-text-muted mt-1.5">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(game.scheduled_time)}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {game.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {practices.map((practice, idx) => (
                  <div key={idx} className="bg-card border border-border-subtle rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="m-0 text-[10px] font-black uppercase tracking-widest text-text-secondary">PRACTICE</p>
                      <p className="m-0 text-body-lg font-bold text-text-primary mt-1">Team Session</p>
                      <div className="flex items-center gap-3 text-caption text-text-muted mt-1.5">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(practice.scheduled_time)}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {practice.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleNextStep}
                className="px-8 py-3.5 bg-accent text-canvas font-semibold rounded-2xl text-body-lg cursor-pointer active:scale-[0.97] transition-all"
              >
                Confirm week
              </button>
            </div>
          </div>
        )}

        {step === "mood" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-10">
              How are you coming into this week?
            </h1>
            <MoodScale 
              onSelect={(val) => {
                setMood(val);
                setTimeout(() => setStep("focus"), 300);
              }} 
              selected={mood ?? undefined}
            />
          </div>
        )}

        {step === "focus" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-8">
              What&apos;s your primary focus this week?
            </h1>
            <p className="text-body text-text-secondary mb-10 -mt-6">Set one specific, mechanical focus for your training and games.</p>
            <TextInput 
              value={focusText}
              onChange={setFocusText}
              placeholder="One specific thing"
              maxLength={100}
            />
            <div className="flex justify-end mt-12">
              <button 
                onClick={saveWeeklyIntention}
                disabled={saving || !focusText.trim()}
                className="px-8 py-3.5 bg-accent text-canvas font-semibold rounded-2xl text-body-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] transition-all flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin text-canvas" />}
                {saving ? "Saving..." : "Done"}
              </button>
            </div>
          </div>
        )}

        {step === "confirmation" && (
          <div className="animate-fade-in-up w-full text-center">
            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-hero-sm font-bold tracking-tight leading-tight mb-4">
              You&apos;re set.
            </h1>
            <p className="text-body text-text-secondary mb-12 max-w-sm mx-auto">
              See you on the other side. Focus set for the week. Let&apos;s get to the work.
            </p>
            <button 
              onClick={() => router.push("/calendar")}
              className="w-full py-4 bg-accent text-canvas font-bold uppercase tracking-wider rounded-2xl cursor-pointer active:scale-[0.97] transition-all"
            >
              Back to Calendar
            </button>
          </div>
        )}

      </FlowScreen>
    </div>
  );
}
