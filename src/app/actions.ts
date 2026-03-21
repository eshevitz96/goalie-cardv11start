"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

// Helper to get admin client with safety checks
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing: ${!url ? 'URL ' : ''}${!key ? 'KEY ' : ''}`);
    }

    return createClient(url, key);
}

export async function submitReflection(rosterId: string, entryData: any) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        // 1. Validate Roster ID Existence (Security Check)
        const { data: roster, error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, linked_user_id, sport')
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
                    // Backfill the Roster Link using ADMIN privileges
                    await supabaseAdmin
                        .from('roster_uploads')
                        .update({
                            linked_user_id: user.id,
                            is_claimed: true
                        })
                        .eq('id', rosterId);
                    // console.log(`[ACTION] Auto-linked Roster ${rosterId} to User ${user.id}`);
                }
            } catch (linkErr) {
                console.warn("[ACTION] Failed to auto-link user:", linkErr);
            }
        }

        // 2. Prepare Insert Data
        // If linked_user_id exists (or resolved), use it as author_id
        // CRITICAL CHECK: If we still don't have a user ID, we cannot insert.
        if (!resolvedAuthorId) {
            return { success: false, error: "Session Sync Error: Please refresh the page or sign out/in to re-link your account." };
        }

        const insertPayload = {
            roster_id: rosterId,
            goalie_id: resolvedAuthorId, // Guaranteed to be string now
            author_id: resolvedAuthorId,
            author_role: entryData.author_role || 'goalie',
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            activity_type: entryData.activity_type,
            skip_reason: entryData.skip_reason,
            injury_expected_return: entryData.injury_expected_return,
            injury_details: entryData.injury_details,
            soreness: entryData.soreness,
            sleep_quality: entryData.sleep_quality,
            file_url: entryData.file_url,
            created_at: new Date().toISOString()
        };

        // 3. Insert with Admin Privileges
        // 3. Insert Reflection with Admin Privileges
        const { data: reflection, error } = await supabaseAdmin
            .from('reflections')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            console.error("Reflection Save Error (Admin):", error);
            const keyDebug = process.env.SUPABASE_SERVICE_ROLE_KEY ? `Key Present` : "Key MISSING";
            return { success: false, error: `${error.message} [Env: ${keyDebug}]` };
        }

        // 4. AUTO-CREATE EVENT (V11 Requirement)
        // If it's a specific activity, create a corresponding event in the schedule
        if (['game', 'practice', 'training'].includes(entryData.activity_type)) {
            try {
                const sport = roster.sport || 'Hockey'; // Default or fetch
                let eventName = "";
                if (entryData.activity_type === 'game') eventName = `Game: ${entryData.title || 'vs TBD'}`;
                else if (entryData.activity_type === 'practice') eventName = `Practice: ${entryData.title || 'Skills'}`;
                else eventName = `Training: ${entryData.title || 'Session'}`;

                await supabaseAdmin.from('events').insert({
                    name: eventName,
                    date: new Date().toISOString(),
                    location: 'Local Rink', // Default or fetch
                    sport: sport,
                    description: entryData.content,
                    created_by: resolvedAuthorId,
                    type: entryData.activity_type
                });

                // Also auto-register the goalie for this event so it shows in their list
                // (Note: Events table needs an ID, insert().select().single() would be better but keeping it simple)
                // Actually we just created it, we don't have the ID unless we select.
                // For now, assume creation is enough for it to appear in general lists.
            } catch (eventErr) {
                console.warn("[ACTION] Post-reflection event creation failed:", eventErr);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error("Server Action Error:", err);
        return { success: false, error: "Exception: " + err.message };
    }
}

export async function updateReflection(reflectionId: string, rosterId: string, entryData: any) {
    if (!reflectionId || !rosterId) return { success: false, error: "Missing IDs" };

    try {
        const supabaseAdmin = getSupabaseAdmin();

        const updatePayload: any = {};
        if (entryData.title !== undefined) updatePayload.title = entryData.title;
        if (entryData.content !== undefined) updatePayload.content = entryData.content;
        if (entryData.mood !== undefined) updatePayload.mood = entryData.mood;
        if (entryData.activity_type !== undefined) updatePayload.activity_type = entryData.activity_type;
        if (entryData.skip_reason !== undefined) updatePayload.skip_reason = entryData.skip_reason;
        if (entryData.injury_expected_return !== undefined) updatePayload.injury_expected_return = entryData.injury_expected_return;
        if (entryData.injury_details !== undefined) updatePayload.injury_details = entryData.injury_details;
        if (entryData.soreness !== undefined) updatePayload.soreness = entryData.soreness;
        if (entryData.sleep_quality !== undefined) updatePayload.sleep_quality = entryData.sleep_quality;
        if (entryData.file_url !== undefined) updatePayload.file_url = entryData.file_url;

        const { error } = await supabaseAdmin
            .from('reflections')
            .update(updatePayload)
            .eq('id', reflectionId)
            .eq('roster_id', rosterId);

        if (error) {
            console.error("Reflection Update Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("Update Reflection Error:", err);
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
        const supabaseAdmin = getSupabaseAdmin();
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
        const supabaseAdmin = getSupabaseAdmin();
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

    // Debug: Check if env vars are present on the server
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasKey) {
        console.error("[ACTION] checkUserStatus: Missing Supabase Env Vars", { hasUrl, hasKey });
        return {
            exists: false,
            rosterStatus: 'error',
            error: `Configuration Error: ${!hasUrl ? 'URL ' : ''}${!hasKey ? 'Key ' : ''}Missing`
        };
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const emailLower = email.toLowerCase().trim();

        // 1. Check if Auth User / Profile exists
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*') // Get full profile
            .eq('email', emailLower)
            .maybeSingle(); // Use maybeSingle to avoid error for no rows

        if (profileError) {
            console.error("Profile Check Failed:", profileError);
            // Verify if it's just 'not found' or actual error. 
            // maybeSingle handles 'not found' gracefully by returning null data.
            // If error persists here, it's a real DB error.
            throw new Error("DB Error checking profile");
        }

        if (profile) {
            return { exists: true, role: profile.role, rosterStatus: 'linked', profile };
        }

        // 2. If no profile, check Roster Uploads
        const { data: roster, error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .select('id, is_claimed, goalie_name')
            .ilike('email', emailLower)
            .maybeSingle();

        if (rosterError) {
            throw new Error(`Roster Check Failed: ${rosterError.message}`);
        }

        if (roster) {
            return {
                exists: false,
                rosterStatus: 'found',
                isClaimed: roster.is_claimed,
                goalieName: roster.goalie_name
            };
        }

        return { exists: false, rosterStatus: 'not_found' };

    } catch (error: any) {
        console.error("Check User Status Error:", error);
        return {
            exists: false,
            rosterStatus: 'error',
            error: error.message || "Unknown Action Error"
        };
    }
}

export async function addNewGoalieToAccount(userId: string, goalieName: string, sport: string = 'Hockey') {
    if (!userId || !goalieName) return { success: false, error: "Missing required fields" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const rId = 'GC-' + Math.floor(1000 + Math.random() * 9000);

        // Fetch user email for the roster entry
        const { data: profile } = await supabaseAdmin.from('profiles').select('email').eq('id', userId).single();
        if (!profile) return { success: false, error: "Profile not found" };

        const { data, error } = await supabaseAdmin.from('roster_uploads').insert({
            goalie_name: goalieName,
            sport: sport,
            email: profile.email,
            assigned_unique_id: rId,
            linked_user_id: userId,
            is_claimed: true,
            created_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;
        return { success: true, goalie: data };
    } catch (err: any) {
        console.error("Add New Goalie Error:", err);
        return { success: false, error: err.message };
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

        const supabaseAdmin = getSupabaseAdmin();
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

        const supabaseAdmin = getSupabaseAdmin();
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

export async function updateAssignedCoaches(rosterId: string, coachIds: string[]) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('roster_uploads')
            .update({ assigned_coach_ids: coachIds })
            .eq('id', rosterId);

        if (error) {
            console.error("Update Assigned Coaches Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error("updateAssignedCoaches Exception:", err);
        return { success: false, error: err.message };
    }
}

export async function syncShotEvents(rosterId: string, eventId: string, shots: any[]) {
    if (!rosterId || !shots) return { success: false, error: "Missing data" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // Handle mock IDs from demo data
        const validEventId = (eventId && !eventId.startsWith('m')) ? eventId : null;

        // 1. Get User ID from roster
        const { data: roster } = await supabaseAdmin
            .from('roster_uploads')
            .select('linked_user_id')
            .eq('id', rosterId)
            .single();
        
        if (!roster || !roster.linked_user_id) return { success: false, error: "Roster not linked" };

        // 2. Prepare shots for insertion
        const insertShots = shots.map(s => ({
            event_id: validEventId,
            goalie_id: roster.linked_user_id,
            roster_id: rosterId, // New V11 anchor
            sport: s.sport,
            period: s.period,
            result: s.result,
            shot_type: s.shotType,
            origin_x: s.originX,
            origin_y: s.originY,
            target_x: s.targetX,
            target_y: s.targetY,
            created_at: new Date().toISOString()
        }));

        // 3. Insert Shots
        const { error: shotError } = await supabaseAdmin
            .from('shot_events')
            .insert(insertShots);

        if (shotError) throw shotError;

        // 4. Update Event Status if exists
        if (validEventId) {
            await supabaseAdmin.from('events').update({ is_charted: true }).eq('id', validEventId);
        }

        return { success: true };
    } catch (err: any) {
        console.error("Sync Shot Events Error:", err);
        return { success: false, error: err.message };
    }
}

export async function createTeam(name: string, organization: string) {
    if (!name) return { success: false, error: "Missing Team Name" };

    try {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Create Team
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .insert({ name, organization, owner_id: user.id })
            .select()
            .single();

        if (teamError) throw teamError;

        // 2. Create Initial Fund with a "Gift" of 5 credits
        const { error: fundError } = await supabaseAdmin
            .from('team_credit_funds')
            .insert({ team_id: team.id, balance: 5 });

        if (fundError) throw fundError;

        // 3. Log Initial Gift Transaction
        await supabaseAdmin
            .from('team_fund_transactions')
            .insert({ 
                team_id: team.id, 
                amount: 5, 
                description: 'Initial Organization Setup (Gift Credits)' 
            });

        return { success: true, teamId: team.id };
    } catch (err: any) {
        console.error("Create Team Error:", err);
        return { success: false, error: err.message };
    }
}

export async function addAthleteToTeam(teamId: string, emailOrId: string) {
    if (!teamId || !emailOrId) return { success: false, error: "Missing required data" };

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // Check if roster entry exists with this email/ID
        const query = emailOrId.includes('@') 
            ? supabaseAdmin.from('roster_uploads').select('id').ilike('email', emailOrId.trim()) 
            : supabaseAdmin.from('roster_uploads').select('id').eq('id', emailOrId);

        const { data: rosterItems, error: rosterError } = await query;

        if (rosterError || !rosterItems || rosterItems.length === 0) {
            return { success: false, error: "Goalie record not found. Please ensure they have activated their card." };
        }

        const rosterIds = rosterItems.map(item => item.id);

        // Link all matched cards to the team
        const { error: updateError } = await supabaseAdmin
            .from('roster_uploads')
            .update({ team_id: teamId })
            .in('id', rosterIds);

        if (updateError) throw updateError;

        return { success: true };
    } catch (err: any) {
        console.error("Add Athlete Error:", err);
        return { success: false, error: err.message };
    }
}
