"use server";

import { createClient } from "@supabase/supabase-js";
import { verifyCoachAuthorization } from "@/app/training/book/actions";
import { CANONICAL_EXERCISE_SEEDS, CanonicalExercise, ExerciseRanges } from "@/lib/data/exerciseSeedData";

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export interface ExerciseRecord {
    id: string;
    name: string;
    category: string;
    sport: string;
    equipment: string[];
    cues: string[] | string;
    ranges: ExerciseRanges;
    is_active: boolean;
    approved_by: string | null;
    created_at: string;
}

/**
 * Fetch exercises from exercise_library.
 * If the table is empty, auto-seeds the canonical dataset with is_active = false.
 */
export async function getExerciseLibrary(filters?: {
    category?: string;
    sport?: string;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
}): Promise<{
    success: boolean;
    exercises: ExerciseRecord[];
    pendingCount: number;
    error?: string;
}> {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch current exercises
        let query = supabaseAdmin
            .from('exercise_library')
            .select('*')
            .order('name', { ascending: true });

        if (filters?.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters?.sport && filters.sport !== 'all') {
            query = query.or(`sport.eq.${filters.sport},sport.eq.all`);
        }

        if (filters?.status === 'active') {
            query = query.eq('is_active', true);
        } else if (filters?.status === 'inactive') {
            query = query.eq('is_active', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[getExerciseLibrary] Fetch error:", error);
            return { success: false, exercises: [], pendingCount: 0, error: error.message };
        }

        // If table is empty, seed canonical exercises with is_active = false
        if (!data || data.length === 0) {
            const { data: countData } = await supabaseAdmin
                .from('exercise_library')
                .select('id', { count: 'exact', head: true });
            
            // Check if table is truly empty
            const totalCount = countData ? 0 : 0; // if countData is null/empty
            
            // Try inserting seed records
            const seedPayload = CANONICAL_EXERCISE_SEEDS.map(ex => ({
                name: ex.name,
                category: ex.category,
                sport: ex.sport,
                equipment: ex.equipment,
                cues: ex.cues,
                ranges: ex.ranges,
                is_active: false,
                approved_by: null
            }));

            const { data: insertedData, error: seedError } = await supabaseAdmin
                .from('exercise_library')
                .insert(seedPayload)
                .select();

            if (!seedError && insertedData) {
                const pendingCount = insertedData.filter(e => !e.is_active).length;
                return { success: true, exercises: insertedData as ExerciseRecord[], pendingCount };
            }
        }

        let filtered = (data || []) as ExerciseRecord[];

        if (filters?.search && filters.search.trim() !== '') {
            const q = filters.search.toLowerCase().trim();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q) ||
                (Array.isArray(e.equipment) && e.equipment.some(eq => eq.toLowerCase().includes(q)))
            );
        }

        // Count pending
        const { count: pendingCount } = await supabaseAdmin
            .from('exercise_library')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', false);

        return {
            success: true,
            exercises: filtered,
            pendingCount: pendingCount || 0
        };
    } catch (err: any) {
        console.error("[getExerciseLibrary] Unexpected error:", err);
        return { success: false, exercises: [], pendingCount: 0, error: err.message };
    }
}

/**
 * Seed or reset canonical exercises (all inserted as is_active = false)
 */
export async function seedCanonicalExercisesAction(): Promise<{
    success: boolean;
    inserted: number;
    error?: string;
}> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, inserted: 0, error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // Get existing exercise names
        const { data: existing } = await supabaseAdmin
            .from('exercise_library')
            .select('name');

        const existingNames = new Set((existing || []).map((e: any) => e.name.toLowerCase()));

        const toInsert = CANONICAL_EXERCISE_SEEDS
            .filter(seed => !existingNames.has(seed.name.toLowerCase()))
            .map(seed => ({
                name: seed.name,
                category: seed.category,
                sport: seed.sport,
                equipment: seed.equipment,
                cues: seed.cues,
                ranges: seed.ranges,
                is_active: false,
                approved_by: null
            }));

        if (toInsert.length === 0) {
            return { success: true, inserted: 0 };
        }

        const { data, error } = await supabaseAdmin
            .from('exercise_library')
            .insert(toInsert)
            .select();

        if (error) {
            console.error("[seedCanonicalExercisesAction] Insert error:", error);
            return { success: false, inserted: 0, error: error.message };
        }

        return { success: true, inserted: data?.length || 0 };
    } catch (err: any) {
        console.error("[seedCanonicalExercisesAction] Error:", err);
        return { success: false, inserted: 0, error: err.message };
    }
}

/**
 * Coach approve or deactivate an exercise
 */
export async function toggleExerciseApprovalAction(
    exerciseId: string,
    isActive: boolean
): Promise<{ success: boolean; error?: string }> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('exercise_library')
            .update({
                is_active: isActive,
                approved_by: isActive ? (coachAuth.userId || 'coach-verified') : null
            })
            .eq('id', exerciseId);

        if (error) {
            console.error("[toggleExerciseApprovalAction] Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[toggleExerciseApprovalAction] Error:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Coach batch approve exercises
 */
export async function batchApproveExercisesAction(
    exerciseIds: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, count: 0, error: "Unauthorized: Coach or Admin access required." };
    }

    if (!exerciseIds || exerciseIds.length === 0) {
        return { success: true, count: 0 };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('exercise_library')
            .update({
                is_active: true,
                approved_by: coachAuth.userId || 'coach-verified'
            })
            .in('id', exerciseIds);

        if (error) {
            console.error("[batchApproveExercisesAction] Error:", error);
            return { success: false, count: 0, error: error.message };
        }

        return { success: true, count: exerciseIds.length };
    } catch (err: any) {
        console.error("[batchApproveExercisesAction] Error:", err);
        return { success: false, count: 0, error: err.message };
    }
}

/**
 * Coach create a new custom exercise
 */
export async function createExerciseAction(payload: {
    name: string;
    category: string;
    sport: string;
    equipment: string[];
    cues: string[];
    ranges: ExerciseRanges;
    is_active?: boolean;
}): Promise<{ success: boolean; exercise?: ExerciseRecord; error?: string }> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const isActive = Boolean(payload.is_active);

        const { data, error } = await supabaseAdmin
            .from('exercise_library')
            .insert({
                name: payload.name.trim(),
                category: payload.category,
                sport: payload.sport || 'all',
                equipment: payload.equipment || ['bodyweight'],
                cues: payload.cues || [],
                ranges: payload.ranges,
                is_active: isActive,
                approved_by: isActive ? coachAuth.userId : null
            })
            .select()
            .single();

        if (error) {
            console.error("[createExerciseAction] Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, exercise: data as ExerciseRecord };
    } catch (err: any) {
        console.error("[createExerciseAction] Error:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Coach update exercise details (ranges, cues, category, etc.)
 */
export async function updateExerciseAction(
    exerciseId: string,
    updates: Partial<{
        name: string;
        category: string;
        sport: string;
        equipment: string[];
        cues: string[];
        ranges: ExerciseRanges;
        is_active: boolean;
    }>
): Promise<{ success: boolean; error?: string }> {
    const coachAuth = await verifyCoachAuthorization();
    if (!coachAuth.isAuthorized) {
        return { success: false, error: "Unauthorized: Coach or Admin access required." };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const updatePayload: any = { ...updates };

        if (typeof updates.is_active === 'boolean') {
            updatePayload.approved_by = updates.is_active ? coachAuth.userId : null;
        }

        const { error } = await supabaseAdmin
            .from('exercise_library')
            .update(updatePayload)
            .eq('id', exerciseId);

        if (error) {
            console.error("[updateExerciseAction] Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("[updateExerciseAction] Error:", err);
        return { success: false, error: err.message };
    }
}
