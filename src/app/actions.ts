"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

// Initialize Admin Client to bypass RLS for Soft Sessions
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitReflection(rosterId: string, entryData: any) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        // console.log(`[ACTION] submitReflection called for roster: ${rosterId}`);
        // console.log(`[ACTION] Using KEY starts with: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)}`);

        // 1. Validate Roster ID Existence (Security Check)
        const { data: roster, error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, linked_user_id')
            .eq('id', rosterId)
            .single();

        if (rosterError || !roster) {
            return { success: false, error: `Invalid Roster ID: ${rosterError?.message || 'Not Found'} [ID: ${rosterId}]` };
        }

        // 1.5 Auto-Link User if possible (Self-Healing)
        let resolvedAuthorId = roster.linked_user_id;

        if (!resolvedAuthorId) {
            try {
                const supabase = createServerSupabase();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    resolvedAuthorId = user.id;
                    // Backfill the Roster Link
                    await supabaseAdmin
                        .from('roster_uploads')
                        .update({ linked_user_id: user.id })
                        .eq('id', rosterId);
                    // console.log(`[ACTION] Auto-linked Roster ${rosterId} to User ${user.id}`);
                }
            } catch (linkErr) {
                console.warn("[ACTION] Failed to auto-link user:", linkErr);
            }
        }

        // 2. Prepare Insert Data
        // If linked_user_id exists (or resolved), use it as author_id
        const insertPayload = {
            roster_id: rosterId,
            author_id: resolvedAuthorId || null,
            author_role: entryData.author_role || 'goalie',
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            activity_type: entryData.activity_type,
            skip_reason: entryData.skip_reason,
            injury_expected_return: entryData.injury_expected_return,
            injury_details: entryData.injury_details,
            created_at: new Date().toISOString()
        };

        // 3. Insert with Admin Privileges
        const { error } = await supabaseAdmin
            .from('reflections')
            .insert(insertPayload);

        if (error) {
            console.error("Reflection Save Error (Admin):", error);
            // DEBUG: Return info about the environment to help debug
            const keyDebug = process.env.SUPABASE_SERVICE_ROLE_KEY
                ? `Key Present (starts ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5)})`
                : "Key MISSING";
            return { success: false, error: `${error.message} [Env: ${keyDebug}]` };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Server Action Error:", err);
        return { success: false, error: "Exception: " + err.message };
    }
}

export async function registerForEvent(rosterId: string, eventId: string) {
    if (!rosterId || !eventId) return { success: false, error: "Missing ID" };

    try {
        // 1. Get Roster to find linked user ID (registrations table uses goalie_id usually linked to auth)
        // BUT wait, registrations table links to 'goalie_id' which implies auth.users.id
        // If soft session, we might not have a user ID.
        // Let's check table schema? 'registrations' might rely on auth users.
        // If so, soft session users CANNOT register unless we create a ghost user or checks allows null.
        // Assuming for now we use the 'linked_user_id' if available. 
        // If not, we might need to store 'roster_id' in registrations (if schema supports).

        // Fetch roster to check linkage
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, linked_user_id')
            .eq('id', rosterId)
            .single();

        if (!roster) return { success: false, error: "Roster not found" };

        const userId = roster.linked_user_id;

        // If no user ID, and table requires it, we can't register in the traditional sense.
        // However, let's assume for beta we might want to allow it or we fail gracefully.
        if (!userId) {
            return { success: false, error: "Please activate fully to register." };
        }

        // 2. Insert Registration
        const { error } = await supabaseAdmin
            .from('registrations')
            .insert({
                goalie_id: userId,
                event_id: eventId,
                status: 'registered'
            });

        if (error) return { success: false, error: error.message };
        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getReflections(rosterId: string) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        const { data, error } = await supabaseAdmin
            .from('reflections')
            .select('*')
            .eq('roster_id', rosterId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function checkUserStatus(email: string) {
    if (!email) return { exists: false, rosterStatus: 'not_found' };

    try {
        const emailLower = email.toLowerCase().trim();

        // 1. Check if Auth User / Profile exists
        // We check 'profiles' table which should mirror auth users
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('email', emailLower)
            .single();

        if (profile) {
            return { exists: true, role: profile.role, rosterStatus: 'linked' };
        }

        // 2. If no profile, check Roster Uploads (for activation)
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, is_claimed')
            .ilike('email', emailLower)
            .maybeSingle();

        if (roster) {
            return {
                exists: false,
                rosterStatus: 'found',
                isClaimed: roster.is_claimed
            };
        }

        return { exists: false, rosterStatus: 'not_found' };

    } catch (error) {
        console.error("Check User Status Error:", error);
        return { exists: false, rosterStatus: 'error' };
    }
}

// -----------------------------------------------------------------------------
// ACCOUNT MANAGEMENT
// -----------------------------------------------------------------------------
export async function deleteAccount() {
    try {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const userId = user.id;

        // 1. Unlink Roster Spot (Make it claimable again)
        // We find the roster linked to this user
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('id')
            .eq('linked_user_id', userId)
            .single();

        if (roster) {
            await supabaseAdmin
                .from('roster_uploads')
                .update({
                    linked_user_id: null,
                    is_claimed: false,
                    // Optionally clear personal data if needed, but for now we just unlink
                })
                .eq('id', roster.id);
        }

        // 2. Delete Auth User (Prevents login)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Delete User Error:", deleteError);
            return { success: false, error: "Failed to delete user account" };
        }

        return { success: true };

    } catch (err: any) {
        console.error("Delete Account Exception:", err);
        return { success: false, error: err.message };
    }
}

export async function requestRole(requestedRole: string) {
    if (!requestedRole) return { success: false, error: "Missing role" };

    try {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: "Not authenticated" };

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: requestedRole })
            .eq('id', user.id);

        if (error) {
            console.error("Request Role Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, message: "Role request submitted successfully." };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getPendingRoleRequests() {
    // START STUB: Assume we fetch profiles pending approval or from a request table
    // For now returning empty array to unblock build
    return { success: true, data: [], error: null };
}

export async function grantRole(requestId: string, role: string) {
    // START STUB
    return { success: true, error: null };
}

export async function denyRoleRequest(requestId: string, role?: string) {
    // START STUB
    return { success: true, error: null };
}
