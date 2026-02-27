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

/**
 * Completes activation by creating/updating the user with a password
 * and signing them in immediately.
 */
export async function completeActivationWithPassword(
    email: string,
    password: string,
    rosterId: string,
    rosterData: any,
    formData: any,
    baselineAnswers?: any[]
) {
    if (!email || !password || !rosterId) {
        return { success: false, error: 'Missing required fields' };
    }

    const emailLower = email.toLowerCase().trim();
    const supabase = createServerSupabase();

    try {
        // 1. Activate the Card Data (Roster & Reflections)
        // We do this first to ensure data is ready.
        // We'll pass a placeholder PIN or the one from formData if we want to keep it.
        // For password flow, PIN might be redundant but let's keep it '0000' or derived.
        // Actually, let's just use the activateUserCard logic here or call it.
        // But activateUserCard needs a userId which we might not have yet.
        // Let's create the ALL-IN-ONE flow here.

        // A. Create/Update Auth User with Password
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email?.toLowerCase() === emailLower);

        let authUserId: string;

        if (existingUser) {
            // Update existing user with new password
            const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                { password: password, email_confirm: true }
            );

            if (updateError) throw new Error(`Failed to set password: ${updateError.message}`);
            authUserId = existingUser.id;
        } else {
            // Create new user with password
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: emailLower,
                password: password,
                email_confirm: true,
                user_metadata: {
                    activation_date: new Date().toISOString()
                }
            });

            if (createError) throw new Error(`Failed to create account: ${createError.message}`);
            authUserId = newUser.user.id;
        }

        // B. Update Roster & Link
        const rawUpdate = {
            ...rosterData.raw_data,
            setup_complete: true,
            linked_user_id: authUserId,
            activation_date: new Date().toISOString()
            // We can drop access_pin if we rely on auth, or keep it as backup.
        };

        const { error: rosterError } = await supabaseAdmin
            .from('roster_uploads')
            .update({
                is_claimed: true,
                raw_data: rawUpdate,
                linked_user_id: authUserId,
                goalie_name: formData.goalieName, // Ensure these are sync'd
                parent_name: formData.parentName,
                parent_phone: formData.phone,
                grad_year: parseInt(formData.gradYear) || 0,
                team: formData.team,
                sport: formData.sport
            })
            .eq('id', rosterId);

        if (rosterError) throw new Error(`Roster update failed: ${rosterError.message}`);

        // C. Create Profile
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: authUserId,
            email: emailLower,
            role: 'goalie',
            goalie_name: formData.goalieName,
            // Only using fields we know exist on profiles table to avoid schema errors
            // first_name: formData.parentName?.split(' ')[0], 
        }, { onConflict: 'id' });

        if (profileError) {
            console.error("Critical: Profile Creation Failed", profileError);
            throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        // D. Save Baseline (if provided) using Admin to bypass RLS if context implies
        // (Since user isn't logged in yet, normal insert would fail RLS)
        if (baselineAnswers && baselineAnswers.length > 0) {
            const content = baselineAnswers.map(a => `Q: ${a.question}\nA: ${a.answer} (Mood: ${a.mood})`).join('\n\n');
            await supabaseAdmin.from('reflections').insert({
                roster_id: rosterId,
                author_id: authUserId,
                author_role: 'goalie',
                activity_type: 'baseline',
                title: 'Initial Baseline Assessment',
                content: content,
                mood: baselineAnswers[0]?.mood || 'neutral',
                created_at: new Date().toISOString()
            });
        }

        // E. Sign In (Sets Cookies)
        // Now that the user exists and has a password, we sign them in!
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: emailLower,
            password: password
        });

        if (signInError) {
            throw new Error(`Activation successful, but auto-login failed: ${signInError.message}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error("Complete Activation Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Creates an initial unlinked roster record for a new self-service user.
 * Bypasses RLS by using supabaseAdmin so anonymous users can start activation.
 */
export async function createInitialProfile(email: string) {
    if (!email) {
        return { success: false, error: 'Email is required' };
    }

    const emailLower = email.toLowerCase().trim();

    try {
        // Double check existence to prevent dupes
        const { data: existing } = await supabaseAdmin
            .from('roster_uploads')
            .select('id')
            .ilike('email', emailLower)
            .maybeSingle();

        if (existing) {
            return { success: false, error: "An account with this email already exists. Please try logging in." };
        }

        const rId = 'GC-' + Math.floor(1000 + Math.random() * 9000);

        const { data, error } = await supabaseAdmin.from('roster_uploads').insert({
            email: emailLower,
            goalie_name: "New Athlete",
            assigned_unique_id: rId,
            is_claimed: true,
            sport: 'Hockey'
        }).select().single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('[CreateInitialProfile] Error:', err);
        return { success: false, error: err.message };
    }
}

