/**
 * Refactored to client utility for Standalone Export.
 * Server-only admin functions are disabled for static builds.
 */
import { supabase as clientSupabase } from "@/utils/supabase/client";

export async function activateUserCard(rosterId: string, pin: string, rosterData: any, baselineAnswers?: any[]) {
    // 1. Get Current User
    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();

    const userId = user?.id;
    // const userEmail = user?.email;

    const rawUpdate = {
                ...rosterData.raw_data, // Keep existing fields
                setup_complete: true,
                access_pin: pin,
                activation_date: new Date().toISOString(),
                linked_user_id: userId
            };

    // 2. Update Roster Record
    const { error } = await clientSupabase
                .from('roster_uploads')
                .update({
                    is_claimed: true,
                    raw_data: rawUpdate,
                    linked_user_id: userId // Ensure top-level link is set too
                })
                .eq('id', rosterId);

    if (error) {
        console.error("[Activation] Error:", error);
        return { success: false, error: error.message };
    }

    // 3. Save Baseline Answers (if provided)
    if (baselineAnswers && baselineAnswers.length > 0) {
        try {
            const content = baselineAnswers.map(a => `Q: ${a.question}\nA: ${a.answer} (Mood: ${a.mood})`).join('\n\n');
            const mood = baselineAnswers[0]?.mood || 'neutral';

            const { error: refError } = await clientSupabase
                        .from('reflections')
                        .insert({
                            roster_id: rosterId,
                            author_id: userId || null,
                            author_role: 'goalie',
                            activity_type: 'baseline',
                            title: 'Initial Baseline Assessment',
                            content: content,
                            mood: mood,
                            created_at: new Date().toISOString()
                        });

            if (refError) {
                console.warn("[Activation] Failed to save baseline:", refError);
            }
        } catch (err) {
            console.error("[Activation] Baseline save error:", err);
        }
    }

    // 4. Sync Profile Data (name, phone, etc.)
    if (userId) {
        const profileUpdates: any = {};
        if (rosterData.parent_name) profileUpdates.first_name = rosterData.parent_name.split(' ')[0];
        if (rosterData.parent_name) profileUpdates.last_name = rosterData.parent_name.split(' ').slice(1).join(' ');
        if (rosterData.parent_phone) profileUpdates.phone = rosterData.parent_phone;

        if (Object.keys(profileUpdates).length > 0) {
            await clientSupabase
                        .from('profiles')
                        .update(profileUpdates)
                        .eq('id', userId);
        }
    }

    return { success: true };
}

/**
 * NOTE: Admin-level user provisioning is disabled for standalone static builds.
 * This should be moved to a Supabase Edge Function if needed.
 */
export async function provisionSelfServiceUser(email: string, rosterId: string, goalieName?: string) {
    return { success: false, error: "Administration logic is not supported in the standalone offline bundle." };
}

/**
 * NOTE: Server-side password activation is disabled for standalone static builds.
 * Use standard client-side Supabase authentication flows instead.
 */
export async function completeActivationWithPassword(
    email: string,
    password: string,
    rosterId?: string,
    rosterData?: any,
    formData?: any,
    baselineAnswers?: any[],
    teamInviteId?: string | null
) {
    try {
        const emailTrimmed = email.toLowerCase().trim();
        
        // 1. Create the Auth User
        const { data: authData, error: authError } = await clientSupabase.auth.signUp({
            email: emailTrimmed,
            password
        });

        if (authError) {
            throw authError;
        }

        const userId = authData.user?.id;

        // 2. Link existing roster records SILENTLY in the background using p_email argument
        if (userId) {
            try {
                const { data: matchedRosters, error: rpcError } = await clientSupabase.rpc(
                    'find_roster_by_email',
                    { p_email: emailTrimmed }
                );

                if (!rpcError && matchedRosters && matchedRosters.length > 0) {
                    for (const r of matchedRosters) {
                        await clientSupabase
                            .from('roster_uploads')
                            .update({ linked_user_id: userId, is_claimed: true })
                            .eq('id', r.id);
                    }
                }
            } catch (rpcErr) {
                console.warn("[Activation] Background silent roster matching failed:", rpcErr);
            }
        }

        return { success: true, userId };
    } catch (err: any) {
        console.error("[Activation] Critical Failure:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Creates an initial unlinked roster record.
 */
export async function createInitialProfile(email: string) {
    if (!email) return { success: false, error: 'Email is required' };
    const emailLower = email.toLowerCase().trim();

    try {
        const rId = 'GC-' + Math.floor(1000 + Math.random() * 9000);
        const { data, error } = await clientSupabase.from('roster_uploads').insert({
                    email: emailLower,
                    goalie_name: "New Athlete",
                    assigned_unique_id: rId,
                    is_claimed: true,
                    sport: 'Hockey'
                }).select().single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err: any) {
        console.error('[CreateInitialProfile] Error:', err);
        return { success: false, error: err.message };
    }
}
