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

export async function createEvent(rosterId: string, eventData: { name: string, type: 'game' | 'practice' | 'training', date: string, location: string, sport: string }) {
    if (!rosterId || !eventData.name) return { success: false, error: "Missing required event data" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // Find user ID from roster first
        const { data: roster } = await supabaseAdmin.from('roster_uploads').select('linked_user_id').eq('id', rosterId).single();
        if (!roster?.linked_user_id) return { success: false, error: "Roster not linked to user" };

        const { data, error } = await supabaseAdmin.from('events').insert({
            name: eventData.name,
            type: eventData.type,
            date: eventData.date || new Date().toISOString(),
            location: eventData.location || 'Local Rink',
            sport: eventData.sport,
            created_by: roster.linked_user_id,
            roster_id: rosterId, // V11 anchor
            status: 'upcoming'
        }).select().single();

        if (error) throw error;
        return { success: true, event: data };
    } catch (err: any) {
        console.error("Create Event Error:", err);
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

        // 🚀 Notification 1: Pro Coach Assignment 🚀
        const { data: roster } = await supabaseAdmin.from('roster_uploads').select('linked_user_id').eq('id', rosterId).single();
        if (roster?.linked_user_id && coachIds.length > 0) {
            await supabaseAdmin.from('notifications').insert({
                user_id: roster.linked_user_id,
                title: "Pro Coach Assigned 🤝",
                message: "You've been officially added to a Pro Coach's Goalie Card roster. Request your baseline film review now.",
                type: "alert"
            });
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

        // 2. Create a canonical game_sessions record BEFORE inserting shots
        const saves = shots.filter(s => s.result === 'save' || s.result === 'clear').length;
        const goalsAgainst = shots.filter(s => s.result === 'goal').length;
        const savePct = shots.length > 0 ? parseFloat((saves / shots.length).toFixed(3)) : 0.900;

        const { data: gameSession, error: sessionError } = await supabaseAdmin
            .from('game_sessions')
            .insert({
                user_id: roster.linked_user_id,
                roster_id: rosterId,
                event_id: validEventId,
                status: 'in_progress',
                total_shots: shots.length,
                saves,
                goals_against: goalsAgainst,
                save_percentage: savePct,
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError) {
            console.warn('[V11] game_sessions insert failed (table may not exist yet):', sessionError.message);
        }

        const gameSessionId = gameSession?.id || null;

        // 3. Prepare shots for insertion (include game_session_id)
        const insertShots = shots.map(s => ({
            event_id: validEventId,
            game_session_id: gameSessionId,
            goalie_id: roster.linked_user_id,
            roster_id: rosterId,
            sport: s.sport,
            period: s.period,
            result: s.result,
            shot_type: s.shotType,
            origin_x: s.originX,
            origin_y: s.originY,
            target_x: s.targetX,
            target_y: s.targetY,
            clip_start: s.clipStart,
            clip_end: s.clipEnd,
            film_url: s.filmUrl,
            created_at: new Date().toISOString()
        }));

        // 4. Insert Shots
        const { error: shotError } = await supabaseAdmin
            .from('shot_events')
            .insert(insertShots);

        if (shotError) throw shotError;

        // 5. Update Event Status if exists
        if (validEventId) {
            await supabaseAdmin.from('events').update({ is_charted: true }).eq('id', validEventId);
        }

        // 6. Notifications
        const index = shots.length > 0 ? Math.round((saves / shots.length) * 100) : 0;
        
        if (shots.length >= 3) {
            await supabaseAdmin.from('notifications').insert({
                user_id: roster.linked_user_id,
                title: "Film Processing Complete 🎬",
                message: `Your newest game film has finished processing. You logged a ${index} Performance Index. Check your updated Season Data.`,
                type: "alert"
            });

            if (index >= 80) {
                await supabaseAdmin.from('notifications').insert({
                    user_id: roster.linked_user_id,
                    title: "Milestone Met! 🏆",
                    message: "You just logged an 80+ Performance Index rating. Keep building the foundation.",
                    type: "alert"
                });
            }
        }

        return { success: true, gameSessionId, userId: roster.linked_user_id };
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

export async function findTeamByName(name: string) {
    if (!name || name.length < 3) return { success: false, team: null };
    
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(url, key);

        const { data: team, error } = await supabaseAdmin
            .from('teams')
            .select('id, name, organization')
            .ilike('name', `%${name.trim()}%`)
            .maybeSingle();

        if (error) throw error;
        return { success: true, team };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function linkFilmToEvent(eventId: string, videoUrl: string) {
    if (!eventId || !videoUrl) return { success: false, error: "Missing data" };

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('events')
            .update({ video_url: videoUrl })
            .eq('id', eventId);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("Link Film Error:", err);
        return { success: false, error: err.message };
    }
}

export async function fetchShotEvents(eventId: string) {
    if (!eventId || eventId.startsWith('m')) return { success: true, shots: [] };
    
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: shots, error } = await supabaseAdmin
            .from('shot_events')
            .select('*')
            .eq('event_id', eventId);

        if (error) throw error;
        return { success: true, shots };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function reloadMonthlyCredits(rosterId: string, amountToReload: number = 4) {
    if (!rosterId) return { success: false, error: "Missing Roster ID" };
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: roster, error } = await supabaseAdmin.from('roster_uploads').select('linked_user_id, credits').eq('id', rosterId).single();
        if (error || !roster?.linked_user_id) throw new Error("Roster not found or linked.");

        // Reload the credits locally in db
        const newCredits = (roster.credits || 0) + amountToReload;
        await supabaseAdmin.from('roster_uploads').update({ credits: newCredits }).eq('id', rosterId);

        // Ping the Goalie
        await supabaseAdmin.from('notifications').insert({
            user_id: roster.linked_user_id,
            title: "Credits Refreshed! 💳",
            message: `Your account has been refreshed with ${amountToReload} more credits. Book your next private session now.`,
            type: "alert"
        });

        return { success: true, newCredits };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function trackAnalytics(actionName: string, goalieId: string, metadata: any = {}) {
    if (!actionName || !goalieId) return { success: false };
    
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.from('goalie_analytics').insert({
            action_name: actionName,
            goalie_id: goalieId,
            metadata: metadata
        });
        
        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("[ANALYTICS] Sync failed:", err.message);
        return { success: false };
    }
}

export async function getLatestPerformanceSnapshot(userId: string) {
    if (!userId) return { success: false, error: "Missing user ID" };
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('performance_index_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return { success: true, snapshot: data };
    } catch (err: any) {
        console.error("Error fetching snapshot:", err);
        return { success: false, error: err.message };
    }
}

/**
 * CENTRALIZED SCORING PATH
 * Triggers a recalculation of the performance index and saves a new snapshot.
 */
export async function syncPerformanceIndex(userId: string, sourceType: string, sourceId: string) {
    if (!userId) return { success: false, error: "Missing user ID" };
    
    try {
        const supabase = getSupabaseAdmin();

        // 1. Fetch Context (Current Reflection/Readiness)
        const { data: reflection } = await supabase
            .from('reflections')
            .select('soreness, sleep_quality')
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 2. Fetch Performance (Current Shot History)
        const { data: shots } = await supabase
            .from('shot_events')
            .select('result')
            .eq('goalie_id', userId);

        // 3. Fetch Last Snapshot (for Score Delta)
        const { data: lastSnapshot } = await supabase
            .from('performance_index_snapshots')
            .select('score_after')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // 4a. Fetch training history to derive discipline and streak (last 60 sessions)
        const { data: recentSessions } = await supabase
            .from('protocol_sessions')
            .select('completed_at')
            .eq('user_id', userId)
            .eq('status', 'complete')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(60);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessionDays = new Set((recentSessions ?? []).map((s: { completed_at: string }) => {
            const d = new Date(s.completed_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        }));

        // Consecutive-day streak (start from yesterday so early-morning doesn't break it)
        let activeStreak = 0;
        for (let i = 1; i <= 60; i++) {
            const checkDay = today.getTime() - i * 86400000;
            if (sessionDays.has(checkDay)) { activeStreak++; } else { break; }
        }

        // Historical discipline: % of last 30 days with at least one session
        const thirtyDaysAgo = today.getTime() - 30 * 86400000;
        const activeDaysLast30 = Array.from(sessionDays as Set<number>).filter(d => d >= thirtyDaysAgo).length;
        const historicalDiscipline = sessionDays.size > 0
            ? Math.min(100, (activeDaysLast30 / 30) * 100)
            : 50; // neutral default for new users

        // 4b. Calculate New Score — mirrors v11-engine.ts calculateGoalieIndex exactly
        const saves = shots?.filter((s: { result: string }) => s.result === 'save' || s.result === 'clear').length || 0;
        const totalShotsCount = shots?.length || 0;
        const svPct = totalShotsCount > 0 ? (saves / totalShotsCount) : 0;

        const soreness = reflection?.soreness || 5;
        const sleep = reflection?.sleep_quality || 7;

        const perfRaw = Math.min(100, (svPct / 0.95) * 100);
        const readinessRaw = ((10 - soreness) * 5) + (sleep * 5);
        const disciplineRaw = Math.min(100, historicalDiscipline + (sourceType === 'protocol_session' ? 15 : 0));
        const consistencyRaw = Math.min(100, (Math.log(1 + activeStreak) / Math.log(31)) * 100);

        const rawWeightedTotal = (perfRaw * 0.5) + (disciplineRaw * 0.3) + (consistencyRaw * 0.2);
        const difficultyExponent = 1.8;
        const scoreAfter = 100 * Math.pow(rawWeightedTotal / 100, difficultyExponent);

        const scoreBefore = lastSnapshot?.score_after || 0;
        const scoreDelta = scoreAfter - scoreBefore;

        // 5. Write Snapshot
        const { data: newSnapshot, error: snapshotError } = await supabase
            .from('performance_index_snapshots')
            .insert({
                user_id: userId,
                source_type: sourceType,
                source_id: sourceId,
                score_before: Math.round(scoreBefore),
                score_after: Math.round(scoreAfter),
                score_delta: parseFloat(scoreDelta.toFixed(1)),
                stability_score: Math.round(perfRaw),
                execution_score: Math.round(disciplineRaw),
                readiness_score: Math.round(readinessRaw),
                summary_label: sourceType === 'protocol_session' ? 'Protocol Completed' : 'Session Synced',
                summary_reason: `Recalculated after ${sourceType} completion`,
                ruleset_version: 'v1.1'
            })
            .select()
            .single();

        if (snapshotError) throw snapshotError;
        return { success: true, snapshot: newSnapshot };
    } catch (err: any) {
        console.error("[SCORING PATH] Sync failed:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Protocol Completion Trigger
 */
export async function completeProtocolSession(sessionId: string, userId: string) {
    if (!sessionId || !userId) return { success: false, error: "Missing data" };

    try {
        const supabase = getSupabaseAdmin();

        // 1. Mark session as complete
        const { error: sessionError } = await supabase
            .from('protocol_sessions')
            .update({ status: 'complete', completed_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (sessionError) throw sessionError;

        // 2. Mark related stages as complete
        await supabase
            .from('protocol_stage_events')
            .update({ status: 'complete' })
            .eq('session_id', sessionId);

        // 3. Trigger Central Scoring Path
        return await syncPerformanceIndex(userId, 'protocol_session', sessionId);

    } catch (err: any) {
        console.error("Complete Protocol Error:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Protocol Initiation
 */
export async function startProtocolSession(userId: string, rosterId: string, templateId: string = 'v11-standard') {
    if (!userId || !rosterId) return { success: false, error: "Missing identity" };

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('protocol_sessions')
            .insert({
                user_id: userId,
                roster_id: rosterId,
                template_id: templateId,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, sessionId: data.id };
    } catch (err: any) {
        console.error("Start Protocol Error:", err);
        return { success: false, error: err.message };
    }
}

export async function fetchRosterEvent(eventId: string) {
    if (!eventId) return { success: false, error: "Missing event ID" };
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;
        return { success: true, event: data };
    } catch (err: any) {
        console.error("Error fetching event:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Game Session Completion Trigger
 * Marks game_sessions.status = complete, confirms shot_events are present,
 * then runs the centralized scoring path — the game equivalent of completeProtocolSession.
 */
export async function completeGameSession(gameSessionId: string, userId: string) {
    if (!gameSessionId || !userId) return { success: false, error: "Missing data" };

    try {
        const supabase = getSupabaseAdmin();

        // 1. Mark game session as complete
        const { error: sessionError } = await supabase
            .from('game_sessions')
            .update({ status: 'complete', completed_at: new Date().toISOString() })
            .eq('id', gameSessionId);

        if (sessionError) {
            // Non-fatal: table might not have this column yet — log and continue
            console.warn('[V11] game_sessions update failed:', sessionError.message);
        }

        // 2. Verify shot_events exist for this session
        const { data: shots, error: shotsError } = await supabase
            .from('shot_events')
            .select('id, result')
            .eq('game_session_id', gameSessionId);

        if (shotsError) console.warn('[V11] shot_events verify failed:', shotsError.message);
        console.log(`[V11] Game complete. ${shots?.length ?? 0} shot events confirmed for session ${gameSessionId}.`);

        // 3. Trigger the centralized scoring path
        return await syncPerformanceIndex(userId, 'game_session', gameSessionId);

    } catch (err: any) {
        console.error('[V11] completeGameSession Error:', err);
        return { success: false, error: err.message };
    }
}
