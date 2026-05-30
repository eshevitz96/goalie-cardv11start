

import { getSupabaseAdmin } from "@/utils/supabase/admin";
import { syncPerformanceIndex } from "@/app/actions";

/**
 * V11 Performance Backfill Action
 * Generates baseline performance snapshots for existing users who have 
 * charting or reflection data but no V11 snapshots yet.
 */
export async function backfillPerformanceIndices() {
    console.log("🚀 Starting Performance Backfill...");
    
    try {
        const supabase = getSupabaseAdmin();

        // 1. Get all profiles with linked cards
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('role', 'goalie');

        if (userError) throw userError;
        
        const results = [];

        for (const user of users) {
             // 2. Check for existing snapshots
             const { count } = await supabase
                .from('performance_index_snapshots')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

             if (count === 0) {
                 console.log(`- Backfilling baseline for ${user.email} (${user.id})...`);
                 // 3. Trigger Central Scoring Path
                 const res = await syncPerformanceIndex(user.id, 'backfill', 'baseline_migration');
                 results.push({ user: user.email, success: res.success });
             }
        }

        return { success: true, backfilled: results };

    } catch (err: any) {
        console.error("Backfill Error:", err);
        return { success: false, error: err.message };
    }
}
