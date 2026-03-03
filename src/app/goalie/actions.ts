"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateCardParams {
    sport: string;
    team: string;
    gradYear: number | null;
    email: string;
    name?: string;
}

export async function createAdditionalCard({ sport, team, gradYear, email, name }: CreateCardParams): Promise<{ success: boolean; error?: string }> {
    try {
        if (!email) return { success: false, error: "No email found." };
        if (!sport) return { success: false, error: "Sport is required." };
        if (!team) return { success: false, error: "Team is required." };

        // Check for existing card with same sport + email to prevent duplicates
        const { data: existing } = await supabaseAdmin
            .from('roster_uploads')
            .select('id')
            .ilike('email', email)
            .ilike('sport', sport)
            .limit(1);

        if (existing && existing.length > 0) {
            return { success: false, error: `You already have a ${sport} card.` };
        }

        // Look up linked_user_id from auth users by email
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        const linkedUserId = authUser?.id || null;

        // Generate a unique activation code
        const uniqueId = `${sport.substring(0, 3).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

        const { error } = await supabaseAdmin
            .from('roster_uploads')
            .insert({
                goalie_name: name || 'Goalie',
                email: email.toLowerCase(),
                sport,
                team,
                grad_year: gradYear,
                assigned_unique_id: uniqueId,
                linked_user_id: linkedUserId,  // Auto-link immediately
            });

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error("createAdditionalCard error:", err);
        return { success: false, error: err.message || "Unknown error" };
    }
}
