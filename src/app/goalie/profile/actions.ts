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
        // 1. Update Roster Record
        const { error } = await supabase
            .from('roster_uploads')
            .update(updates)
            .eq('id', rosterId);

        if (error) {
            console.error("Profile Update Error (Roster):", error);
            return { success: false, error: error.message };
        }

        // 2. Update Profile Record (if linked)
        // Find if this roster is linked to a user
        const { data: roster } = await supabase
            .from('roster_uploads')
            .select('linked_user_id')
            .eq('id', rosterId)
            .single();

        if (roster?.linked_user_id) {
            const profileUpdates: any = {};
            if (updates.goalie_name) profileUpdates.goalie_name = updates.goalie_name;
            // Add other profile fields here if schema supports them (e.g. grad_year, etc.)

            if (Object.keys(profileUpdates).length > 0) {
                await supabase
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', roster.linked_user_id);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("Profile Update Exception:", err);
        return { success: false, error: err.message };
    }
}

