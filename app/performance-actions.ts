import { supabase as clientSupabase } from "@/utils/supabase/client";

/**
 * Single parallel burst to fetch all dashboard variables.
 * Designed to be "Lean and Nimble" per user directive.
 */
export async function getUnifiedDashboardData(userId: string, rosterId: string) {
    if (!userId || !rosterId) return { success: false, error: "Missing IDs" };

    try {
        const supabase = clientSupabase;

        const [
            performanceRes,
            shotEventsRes,
            latestSnapshot,
            notificationsRes,
            focusData,
            recentGames
        ] = await Promise.all([
            getGoaliePerformanceStats(userId, rosterId),
            supabase.from('shot_events').select('*').eq('goalie_id', userId).order('created_at', { ascending: false }).limit(20),
            supabase.from('performance_index_snapshots').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('active_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
            supabase.from('profiles').select('sport, role').eq('id', userId).single(),
            supabase.from('game_sessions').select('*').eq('user_id', userId).eq('status', 'complete').order('date', { ascending: false }).limit(3)
        ]);

        return {
            success: true,
            performance: performanceRes.success ? performanceRes : { streak: 0, games: 0, practices: 0 },
            shots: shotEventsRes.data || [],
            snapshot: latestSnapshot.data,
            notifications: notificationsRes.data || [],
            metadata: focusData.data,
            recentGames: recentGames.data || []
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

async function getGoaliePerformanceStats(userId: string, rosterId: string) {
    try {
        const { data: shots } = await clientSupabase.from('shot_events').select('created_at').eq('goalie_id', userId);
        const { data: games } = await clientSupabase.from('game_sessions').select('id').eq('user_id', userId).eq('status', 'complete');
        
        return {
            success: true,
            streak: 0, // Placeholder or calculate simple streak here
            games: games?.length || 0,
            practices: 0,
            totalShots: shots?.length || 0
        };
    } catch (e) {
        return { success: false };
    }
}
