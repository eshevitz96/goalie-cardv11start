'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/utils/supabase/server";

// Admin client for service-role operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function activateUserCard(rosterId: string, pin: string, rosterData: any, baselineAnswers?: any[]) {
    const supabase = createServerSupabase();

    // 1. Get Current User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const userId = user?.id;
    const userEmail = user?.email;

    // console.log(`[Activation] Attempting to activate ID: ${rosterId} for User: ${userEmail || 'Unauthenticated'}`);

    const rawUpdate = {
        ...rosterData.raw_data, // Keep existing fields
        setup_complete: true,
        access_pin: pin,
        activation_date: new Date().toISOString(),
        linked_user_id: userId
    };

    // 2. Update Roster Record
    const { error } = await supabase
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
            // Format for reflection entry
            // We use a specific activity_type 'baseline' to easily find it later
            const content = baselineAnswers.map(a => `Q: ${a.question}\nA: ${a.answer} (Mood: ${a.mood})`).join('\n\n');
            const mood = baselineAnswers[0]?.mood || 'neutral'; // specific mood logic or just pick first

            const { error: refError } = await supabase
                .from('reflections')
                .insert({
                    roster_id: rosterId,
                    author_id: userId || null, // Might be null if not verified, but roster_id is key
                    author_role: 'goalie',
                    activity_type: 'baseline',
                    title: 'Initial Baseline Assessment',
                    content: content,
                    mood: mood,
                    created_at: new Date().toISOString()
                });

            if (refError) {
                console.warn("[Activation] Failed to save baseline:", refError);
                // Don't fail the whole activation for this, but log it
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

        // Only update if we have something to add
        if (Object.keys(profileUpdates).length > 0) {
            await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);
        }
    }

    return { success: true };
}

/**
 * Provisions a Supabase Auth user for a self-service goalie.
 * Creates auth user (no password), profiles row, and links roster.
 * The goalie then signs in via OTP / magic link.
 */
export async function provisionSelfServiceUser(email: string, rosterId: string, goalieName?: string) {
    if (!email || !rosterId) {
        return { success: false, error: 'Missing email or roster ID' };
    }

    const emailLower = email.toLowerCase().trim();

    try {
        // 1. Check if auth user already exists
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users?.find(u => u.email?.toLowerCase() === emailLower);

        let authUserId: string;

        if (existing) {
            authUserId = existing.id;
        } else {
            // 2. Create auth user (no password — user signs in via OTP)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: emailLower,
                email_confirm: true,
            });

            if (createError) {
                return { success: false, error: `Auth creation failed: ${createError.message}` };
            }
            authUserId = newUser.user.id;
        }

        // 3. Upsert profiles row
        await supabaseAdmin.from('profiles').upsert({
            id: authUserId,
            email: emailLower,
            role: 'goalie',
            goalie_name: goalieName || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        // 4. Link roster to auth user
        await supabaseAdmin.from('roster_uploads').update({
            linked_user_id: authUserId,
            is_claimed: true,
        }).eq('id', rosterId);

        return { success: true, userId: authUserId };

    } catch (err: any) {
        console.error('[Provision] Self-service error:', err);
        return { success: false, error: err.message };
    }
}
