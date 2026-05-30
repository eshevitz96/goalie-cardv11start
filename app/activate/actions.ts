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
    rosterId: string,
    rosterData: any,
    formData: any,
    baselineAnswers?: any[],
    teamInviteId?: string | null
) {
    try {
        const emailTrimmed = email.toLowerCase().trim();
        // 1. Create the Auth User (or get existing if they somehow have one)
        const { data: authData, error: authError } = await clientSupabase.auth.signUp({
            email: emailTrimmed,
            password,
            options: {
                data: {
                    display_name: formData.goalieName,
                }
            }
        });

        if (authError && authError.message !== 'User already registered') {
            throw authError;
        }

        // If user already exists, we might need to sign in or just proceed if we have a session
        const userId = authData.user?.id;

        // 2. Calculate Intelligence Index (0-100)
        // Trajectory (50%), Readiness (30%), Phase (20% context)
        let score = 75; // Default starting point
        if (baselineAnswers) {
            const trajectory = baselineAnswers.find(a => a.id === 1)?.mood;
            const readiness = baselineAnswers.find(a => a.id === 2)?.mood;
            const phase = baselineAnswers.find(a => a.id === 3)?.mood;

            let scoreWeight = 0;
            if (trajectory === 'good') scoreWeight += 40;
            else if (trajectory === 'neutral') scoreWeight += 25;
            else scoreWeight += 10;

            if (readiness === 'good') scoreWeight += 30;
            else if (readiness === 'neutral') scoreWeight += 20;
            else scoreWeight += 5;

            // Phase context - In-season starts with higher 'intensity' baseline
            if (phase === 'bad') scoreWeight += 30; // In-season
            else if (phase === 'neutral') scoreWeight += 20; // Tryouts
            else scoreWeight += 15; // Off-season

            score = scoreWeight;
        }

        // 3. Prepare Updates
        const currentTeam = formData.teamHistory?.find((h: any) => h.isCurrent)?.team || formData.team || "";
        
        const updates: any = {
            is_claimed: true,
            goalie_name: formData.goalieName,
            sport: formData.sport,
            team: currentTeam,
            grad_year: parseInt(formData.gradYear) || null,
            height: formData.height,
            weight: formData.weight,
            catch_hand: formData.catchHand,
            birthday: formData.birthday,
            intelligence_index: score,
            season_phase: baselineAnswers?.find(a => a.id === 3)?.mood || 'off-season',
            linked_user_id: userId,
            activation_date: new Date().toISOString(),
            raw_data: {
                ...(rosterData?.raw_data || {}),
                baseline_answers: baselineAnswers,
                setup_complete: true
            }
        };

        // 4. Update Database
        const { error: updateError } = await clientSupabase
            .from('roster_uploads')
            .update(updates)
            .eq('id', rosterId);

        if (updateError) throw updateError;

        // 5. Create Profile & Initial Snapshot
        if (userId) {
            await clientSupabase.from('profiles').upsert({
                id: userId,
                email: email,
                full_name: formData.goalieName,
                role: 'goalie',
                onboarding_complete: true
            });

            // Establish the Baseline in the Performance Index table
            await clientSupabase.from('performance_index_snapshots').insert({
                user_id: userId,
                score: score,
                label: 'Baseline Assessment',
                created_at: new Date().toISOString()
            });
        }

        return { success: true, userId, score };
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
