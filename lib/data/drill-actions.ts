import { supabase as clientSupabase } from "@/utils/supabase/client";
import { DRILL_REPOSITORY, ExtendedDrillDef } from "./drills";

/**
 * Client-side utility to fetch drills.
 */
export async function getDrillsForGoalie(goalieId: string) {
    try {
        const { data, error } = await clientSupabase
            .from('goalie_drills')
            .select('*')
            .eq('goalie_id', goalieId);
        
        if (error) throw error;
        return { success: true, drills: data };
    } catch (err: any) {
        console.error("[GET_DRILLS_ERROR]", err);
        return { success: false, error: err.message };
    }
}

/**
 * Client-side utility to get recommended drills.
 */
export async function getRecommendedDrills(goalieId: string) {
    try {
        // For institutional rollout, we fallback to a subset of the repository 
        // if no DB-linked drills are found.
        const { data, error } = await clientSupabase
            .from('goalie_drills')
            .select('*')
            .eq('goalie_id', goalieId)
            .limit(3);

        if (error) throw error;
        
        if (data && data.length > 0) {
            return { success: true, drills: data };
        }

        // Fallback to high-impact repository defaults if no data remains
        return { 
            success: true, 
            drills: Object.values(DRILL_REPOSITORY).slice(0, 3) 
        };
    } catch (err: any) {
        console.error("[GET_RECOMMENDED_DRILLS_ERROR]", err);
        return { success: false, error: err.message };
    }
}
