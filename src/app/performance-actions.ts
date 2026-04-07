"use server";

import { createClient } from "@/utils/supabase/server";

export async function getGoaliePerformanceStats(userId: string, rosterId: string) {
    if (!userId) return { success: false, error: "Missing identity" };

    try {
        const supabase = createClient();

        // 1. Fetch all performance snapshots for streak calculation
        const { data: snapshots, error: snapError } = await supabase
            .from('performance_index_snapshots')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (snapError) throw snapError;

        // 2. Fetch session counts for the specific roster
        const { count: protocolCount, error: pError } = await supabase
            .from('protocol_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('roster_id', rosterId)
            .eq('status', 'complete');

        const { count: gameCount, error: gError } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'complete');

        // 3. Calculate Streak logic
        let currentStreak = 0;
        if (snapshots && snapshots.length > 0) {
            const uniqueDays = new Set<string>();
            snapshots.forEach((s: any) => {
                uniqueDays.add(new Date(s.created_at).toDateString());
            });

            const sortedDays = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
            
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            
            const hasToday = sortedDays.some(d => d.toDateString() === today);
            const hasYesterday = sortedDays.some(d => d.toDateString() === yesterday);

            if (hasToday || hasYesterday) {
                let checkDate = hasToday ? new Date() : new Date(Date.now() - 86400000);
                
                for (let i = 0; i < sortedDays.length; i++) {
                    const dayStr = checkDate.toDateString();
                    if (sortedDays.some(d => d.toDateString() === dayStr)) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            success: true,
            streak: currentStreak,
            practices: protocolCount || 0,
            games: gameCount || 0,
            totalSessions: (protocolCount || 0) + (gameCount || 0)
        };

    } catch (err: any) {
        console.error("Error fetching performance stats:", err);
        return { success: false, error: err.message };
    }
}
