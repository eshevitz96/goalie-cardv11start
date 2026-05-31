"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FlowScreen from "@/components/calendar/FlowScreen";
import MoodScale, { MoodValue } from "@/components/calendar/MoodScale";
import TextInput from "@/components/calendar/TextInput";
import { Loader2 } from "lucide-react";

type Step = "mood" | "focus" | "unexpected" | "next_time" | "saving_state";
type BroughtIt = "yes" | "kind_of" | "no";

function PostgameContent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date"); // Target game date

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("mood");
  const [targetDate, setTargetDate] = useState("");
  const [weeklyIntentionText, setWeeklyIntentionText] = useState<string | null>(null);

  // Form states
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [broughtIt, setBroughtIt] = useState<BroughtIt | null>(null);
  const [broughtItNote, setBroughtItNote] = useState("");
  const [unexpected, setUnexpected] = useState("");
  const [oneThingNext, setOneThingNext] = useState("");

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  // Compute game date and fetch weekly intention
  useEffect(() => {
    if (!auth.userId) return;

    const resolveIntentionAndDate = async () => {
      setLoading(true);
      try {
        const gameDateStr = dateParam || new Date().toISOString().split("T")[0];
        setTargetDate(gameDateStr);

        const uid = auth.userId;
        if (uid === "00000000-0000-0000-0000-000000000000") {
          setWeeklyIntentionText("Maintain high hands and explode on bounce shots.");
          setLoading(false);
          return;
        }

        // Calculate Monday of the week containing gameDateStr
        const gameDateObj = new Date(gameDateStr + "T00:00:00");
        const dayOfWeek = gameDateObj.getDay(); // 0 = Sun, 1 = Mon
        const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(gameDateObj);
        monday.setDate(gameDateObj.getDate() - daysSinceMon);
        const monStr = monday.toISOString().split("T")[0];

        const { data: userRes } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", uid)
          .single();
        
        const publicUserId = userRes?.id;
        if (publicUserId) {
          const { data: intentionData } = await supabase
            .from("weekly_intentions")
            .select("intention_text")
            .eq("user_id", publicUserId)
            .eq("week_start_date", monStr)
            .maybeSingle();

          setWeeklyIntentionText(intentionData?.intention_text || null);
        }
      } catch (err) {
        console.error("Error loading weekly intention for postgame:", err);
      } finally {
        setLoading(false);
      }
    };

    resolveIntentionAndDate();
  }, [dateParam, auth.userId]);

  const handleMoodSelect = (selectedMood: MoodValue) => {
    setMood(selectedMood);
    setTimeout(() => {
      setStep("focus");
    }, 300);
  };

  const savePostgameDebrief = async () => {
    if (!auth.userId || !mood || !broughtIt || !oneThingNext.trim()) return;
    setStep("saving_state");
    try {
      const uid = auth.userId;
      if (uid === "00000000-0000-0000-0000-000000000000") {
        router.replace("/calendar");
        return;
      }

      // 1. Check if daily_sessions row exists for current user & date
      const { data: existingSession } = await supabase
        .from("daily_sessions")
        .select("id")
        .eq("user_id", uid)
        .eq("session_date", targetDate)
        .maybeSingle();

      let sessionId = existingSession?.id;

      // 2. Create session if it doesn't exist
      if (!sessionId) {
        const { data: newSession, error: createErr } = await supabase
          .from("daily_sessions")
          .insert({
            user_id: uid,
            session_date: targetDate,
            day_types: ["game"]
          })
          .select()
          .single();
        
        if (createErr) throw createErr;
        sessionId = newSession.id;
      }

      // 3. Insert into daily_post_event_entries
      if (sessionId) {
        // Delete any existing post-event entry to allow overwrites/updates
        await supabase
          .from("daily_post_event_entries")
          .delete()
          .eq("session_id", sessionId);

        const { error: postErr } = await supabase
          .from("daily_post_event_entries")
          .insert({
            session_id: sessionId,
            mood: mood,
            brought_it: broughtIt,
            brought_it_note: broughtItNote.trim() || null,
            unexpected: unexpected.trim() || null,
            one_thing_next: oneThingNext.trim()
          });
        
        if (postErr) throw postErr;
      }

      router.replace("/calendar");
    } catch (err) {
      console.error("Postgame save failed:", err);
      setStep("next_time");
    }
  };

  const goBack = () => {
    if (step === "mood") {
      router.push("/calendar");
    } else if (step === "focus") {
      setStep("mood");
    } else if (step === "unexpected") {
      setStep("focus");
    } else if (step === "next_time") {
      setStep("unexpected");
    }
  };

  if (auth.loading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  return (
    <div className="calendar-root">
      <FlowScreen onBack={goBack} showBack={step !== "saving_state"}>
        
        {step === "mood" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-12">
              How&apos;d you play?
            </h1>
            <MoodScale onSelect={handleMoodSelect} selected={mood ?? undefined} />
          </div>
        )}

        {step === "focus" && (
          <div className="animate-fade-in-up w-full">
            {weeklyIntentionText && (
              <div className="mb-10 bg-card border border-border-subtle rounded-2xl p-6 border-l-[3px] border-l-accent animate-fade-in">
                <p className="m-0 text-micro text-text-muted font-bold mb-2">This week&apos;s intention</p>
                <p className="m-0 text-body-lg font-bold text-text-primary leading-tight">&ldquo;{weeklyIntentionText}&rdquo;</p>
              </div>
            )}
            
            <h2 className="text-hero-sm font-bold tracking-tight leading-tight mb-8">
              Did you maintain your focus?
            </h2>

            <div className="flex flex-col gap-3 stagger-children mb-8">
              {(["yes", "kind_of", "no"] as BroughtIt[]).map((val) => {
                const labels: Record<BroughtIt, string> = { yes: "Yes", kind_of: "Kind of", no: "No" };
                const isActive = broughtIt === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBroughtIt(val)}
                    className={`w-full px-6 py-4 rounded-2xl border text-body-lg font-medium
                      transition-all duration-200 min-h-[56px] text-left cursor-pointer
                      active:scale-[0.98]
                      ${isActive
                        ? "bg-accent/10 border-accent text-accent shadow-[0_0_20px_rgba(0,230,118,0.08)]"
                        : "bg-card border-border-subtle text-text-primary hover:bg-card-hover hover:border-border-focus"
                      }`}
                  >
                    {labels[val]}
                  </button>
                );
              })}
            </div>

            {broughtIt && (
              <div className="mt-8 animate-fade-in">
                <h3 className="text-title font-bold tracking-tight mb-4">Anything to add about your focus?</h3>
                <TextInput 
                  value={broughtItNote}
                  onChange={setBroughtItNote}
                  placeholder="Optional notes"
                  autoFocus={false}
                />
                <div className="mt-8 flex items-center justify-between">
                  <button 
                    onClick={() => setStep("unexpected")}
                    className="text-text-secondary text-body-lg font-medium hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  <button 
                    onClick={() => setStep("unexpected")}
                    className="px-8 py-3.5 bg-accent text-[#09090B] font-bold rounded-2xl text-body-lg cursor-pointer active:scale-[0.97] transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "unexpected" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-4">
              Anything unexpected happen?
            </h1>
            <p className="text-body text-text-secondary mb-10">In-game events, physical changes, or mental shifts.</p>
            <TextInput 
              value={unexpected}
              onChange={setUnexpected}
              placeholder="Write anything down..."
              multiline
            />
            <div className="mt-12 flex items-center justify-between">
              <button 
                onClick={() => setStep("next_time")}
                className="text-text-secondary text-body-lg font-medium hover:text-text-primary transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button 
                onClick={() => setStep("next_time")}
                className="px-8 py-3.5 bg-accent text-[#09090B] font-bold rounded-2xl text-body-lg cursor-pointer active:scale-[0.97] transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === "next_time" && (
          <div className="animate-fade-in-up w-full">
            <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-8">
              One thing for next time
            </h1>
            <p className="text-body text-text-secondary mb-10 -mt-6">What is the single mechanical adjustment you will make?</p>
            <TextInput 
              value={oneThingNext}
              onChange={setOneThingNext}
              placeholder="The one thing"
              maxLength={80}
            />
            <div className="flex justify-end mt-12">
              <button 
                onClick={savePostgameDebrief}
                disabled={!oneThingNext.trim()}
                className="px-8 py-3.5 bg-accent text-[#09090B] font-bold rounded-2xl text-body-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step === "saving_state" && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
            <Loader2 className="animate-spin text-accent mb-4" size={32} />
            <p className="text-body text-text-secondary font-medium">Saving post-game debrief...</p>
          </div>
        )}

      </FlowScreen>
    </div>
  );
}

export default function PostgamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    }>
      <PostgameContent />
    </Suspense>
  );
}
