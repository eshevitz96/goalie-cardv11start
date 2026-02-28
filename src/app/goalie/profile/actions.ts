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
    team_history?: { team: string, years: string }[];
}) {
    if (!rosterId) return { success: false, error: "Missing roster ID" };

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Prepare Roster Updates
        const { team_history, ...rosterUpdates } = updates;

        const { data: roster, error: fetchError } = await supabase
            .from('roster_uploads')
            .select('id, email, linked_user_id')
            .eq('id', rosterId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Perform Roster Update
        const { error: rosterError } = await supabase
            .from('roster_uploads')
            .update(rosterUpdates)
            .eq('id', rosterId);

        if (rosterError) {
            console.error("Profile Update Error (Roster):", rosterError);
            return { success: false, error: rosterError.message };
        }

        // 3. Handle Email Update in Auth if changed
        if (updates.email && updates.email !== roster.email && roster.linked_user_id) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
                roster.linked_user_id,
                { email: updates.email }
            );
            if (authError) {
                console.warn("Auth Email Update Failed:", authError.message);
                // We continue, as roster was updated, but email change might need manual help or session refresh
            }
        }

        // 4. Update Profile Record (Metadata & Settings)
        if (roster.linked_user_id) {
            const profileUpdates: any = {};
            if (updates.goalie_name) profileUpdates.goalie_name = updates.goalie_name;
            if (updates.email) profileUpdates.email = updates.email;

            // Store Team History in 'settings' JSON
            if (team_history) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('settings')
                    .eq('id', roster.linked_user_id)
                    .single();

                profileUpdates.settings = {
                    ...(profile?.settings || {}),
                    team_history: team_history
                };
            }

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

