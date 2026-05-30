import { SupabaseClient } from '@supabase/supabase-js';

export interface PerformanceSnapshot {
    id: string;
    user_id: string;
    season_id: string;
    source_type: string;
    source_id: string;
    score_before: number;
    score_after: number;
    score_delta: number;
    stability_score: number;
    execution_score: number;
    readiness_score: number;
    summary_label: string;
    summary_reason: string;
    ruleset_version: string;
    created_at: string;
}

export const performanceService = {
    /**
     * Fetch the most recent performance index snapshot for a user
     */
    async fetchLatestSnapshot(supabase: SupabaseClient, userId: string): Promise<PerformanceSnapshot | null> {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('performance_index_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("[PERFORMANCE SERVICE] Error fetching snapshot:", error);
            return null;
        }

        return data as PerformanceSnapshot;
    },

    /**
     * Fetch history of snapshots for a user
     */
    async fetchSnapshotHistory(supabase: SupabaseClient, userId: string, limit = 10): Promise<PerformanceSnapshot[]> {
        if (!userId) return [];

        const { data, error } = await supabase
            .from('performance_index_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("[PERFORMANCE SERVICE] Error fetching snapshot history:", error);
            return [];
        }

        return data || [];
    }
};
