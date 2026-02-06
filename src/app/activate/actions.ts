"use server";

import { createClient } from "@supabase/supabase-js";

export async function activateUserCard(rosterId: string, pin: string, rosterData: any) {
    // 1. Initialize Admin Client to bypass RLS for Activation
    // This allows us to "claim" the card even without a logged-in user session
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Prepare Update Data
    // We explicitly set setup_complete: true and capture the timestamp
    console.log(`[Activation] activating ID: ${rosterId}`);

    const rawUpdate = {
        ...rosterData.raw_data, // Keep existing fields
        setup_complete: true,
        access_pin: pin,
        activation_date: new Date().toISOString()
        // We can't reliably get 'linked_user_id' here if not logged in, 
        // but 'is_claimed' is the main flag.
    };

    // 3. Update using Admin client
    const { error } = await supabaseAdmin
        .from('roster_uploads')
        .update({
            is_claimed: true,
            raw_data: rawUpdate
        })
        .eq('id', rosterId);

    if (error) {
        console.error("[Activation] Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
