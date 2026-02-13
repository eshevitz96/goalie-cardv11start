"use server";

import { createClient } from "@supabase/supabase-js";

export async function fetchProfileByEmail(email: string) {
    // 1. Validate Email
    if (!email || !email.includes('@')) {
        return { success: false, error: "Invalid email" };
    }

    // 2. Initialize Admin Client (Bypass RLS)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 3. Fetch Roster Data
        const { data, error } = await supabase
            .from('roster_uploads')
            .select('*')
            .ilike('email', email.trim())
            .single();

        if (error) {
            console.error("Profile Fetch Error (Admin):", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Profile Action Error:", err);
        return { success: false, error: err.message };
    }
}

export async function updateProfile(rosterId: string, updates: {
    goalie_name?: string;
    email?: string;
    grad_year?: number | null;
    team?: string;
    height?: string;
    weight?: string;
    catch_hand?: string;
}) {
    if (!rosterId) return { success: false, error: "Missing roster ID" };

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { error } = await supabase
            .from('roster_uploads')
            .update(updates)
            .eq('id', rosterId);

        if (error) {
            console.error("Profile Update Error (Admin):", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Profile Update Exception:", err);
        return { success: false, error: err.message };
    }
}

