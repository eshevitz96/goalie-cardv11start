"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";

export interface PerformanceSnapshotData {
    id: string;
    user_id: string;
    score_before: number;
    score_after: number;
    score_delta: number;
    stability_score: number;
    execution_score: number;
    readiness_score: number;
    summary_label: string;
    summary_reason: string;
    created_at: string;
}

export function usePerformanceRealtime(userId: string | null) {
    const [snapshot, setSnapshot] = useState<PerformanceSnapshotData | null>(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<any>(null);

    const fetchLatest = useCallback(async () => {
        if (!userId) {
            setSnapshot(null);
            setLoading(false);
            return;
        }

        try {
            // Check if userId is auth_user_id or public.users.id
            let targetPublicId = userId;
            const { data: uData } = await supabase
                .from('users')
                .select('id')
                .or(`auth_user_id.eq.${userId},id.eq.${userId}`)
                .maybeSingle();

            if (uData?.id) {
                targetPublicId = uData.id;
            }

            const { data, error } = await supabase
                .from("performance_index_snapshots")
                .select("*")
                .or(`user_id.eq.${targetPublicId},user_id.eq.${userId}`)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.warn("[Realtime PI] Error fetching snapshot:", error.message);
            } else if (data) {
                setSnapshot(data as PerformanceSnapshotData);
            } else {
                setSnapshot(null);
            }
        } catch (e) {
            console.error("[Realtime PI] Unexpected fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            setSnapshot(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchLatest();

        // Establish Realtime subscription
        const channelName = `pi-sync-${userId.slice(0, 8)}`;
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "performance_index_snapshots"
                },
                (payload) => {
                    const newSnap = payload.new as PerformanceSnapshotData;
                    if (newSnap && (newSnap.user_id === userId || newSnap.score_after !== undefined)) {
                        setSnapshot(newSnap);
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId, fetchLatest]);

    return {
        snapshot,
        score: snapshot?.score_after !== undefined ? snapshot.score_after : (loading ? "..." : "Baseline Pending"),
        stability: snapshot?.stability_score ?? 0,
        execution: snapshot?.execution_score ?? 0,
        readiness: snapshot?.readiness_score ?? 0,
        loading,
        refresh: fetchLatest
    };
}
