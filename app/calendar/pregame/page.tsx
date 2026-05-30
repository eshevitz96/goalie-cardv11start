"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FlowScreen from "@/components/calendar/FlowScreen";
import MoodScale, { MoodValue } from "@/components/calendar/MoodScale";
import { Loader2 } from "lucide-react";

function PregameContent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date"); // Allow specific game date if provided

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.loading, auth.isAuthenticated, router]);

  const handleSelect = async (mood: MoodValue) => {
    if (!auth.userId) return;
    setSaving(true);
    try {
      const uid = auth.userId;
      const today = dateParam || new Date().toISOString().split("T")[0];

      if (uid === "00000000-0000-0000-0000-000000000000") {
        setSaving(false);
        router.replace("/calendar");
        return;
      }

      // 1. Check if daily_sessions row exists for current user & date
      const { data: existingSession, error: fetchErr } = await supabase
        .from("daily_sessions")
        .select("id")
        .eq("user_id", uid)
        .eq("session_date", today)
        .maybeSingle();

      let sessionId = existingSession?.id;

      // 2. Create session if it doesn't exist
      if (!sessionId) {
        const { data: newSession, error: createErr } = await supabase
          .from("daily_sessions")
          .insert({
            user_id: uid,
            session_date: today,
            day_types: ["game"] // Set standard day type
          })
          .select()
          .single();
        
        if (createErr) throw createErr;
        sessionId = newSession.id;
      }

      // 3. Insert into daily_prewarmup_entries
      if (sessionId) {
        // First delete any existing prewarmup entry for this session to allow overwriting/updating
        await supabase
          .from("daily_prewarmup_entries")
          .delete()
          .eq("session_id", sessionId);

        const { error: prepErr } = await supabase
          .from("daily_prewarmup_entries")
          .insert({
            session_id: sessionId,
            mood: mood
          });
        
        if (prepErr) throw prepErr;
      }

      router.replace("/calendar");
    } catch (err) {
      console.error("Pregame save failed:", err);
    } finally {
      setSaving(false);
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
      <FlowScreen backHref="/calendar" showBack={!saving}>
        <div className="animate-fade-in-up w-full">
          <h1 className="text-hero-sm md:text-hero font-bold tracking-tight leading-tight mb-12">
            How&apos;s your head now?
          </h1>
          {saving ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-accent mb-4" size={32} />
              <p className="text-body text-text-secondary">Saving readiness state...</p>
            </div>
          ) : (
            <MoodScale onSelect={handleSelect} />
          )}
        </div>
      </FlowScreen>
    </div>
  );
}

export default function PregamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    }>
      <PregameContent />
    </Suspense>
  );
}
