"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing`);
    }
    return createClient(url, key);
}

export async function fetchAdminRoster(password: string) {
    // Hardcoded simple protection
    if (password !== "ShevitzBears23") {
        return { error: "Incorrect password." };
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('private_training_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { error: `Database Error: ${error.message}` };
        }

        // Return the secure payload
        return { data };
    } catch (err: any) {
        return { error: `Server Error: ${err.message}` };
    }
}

export async function deleteSubmission(id: string, password: string) {
    if (password !== "ShevitzBears23") {
        return { error: "Incorrect password." };
    }

    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('private_training_submissions')
            .delete()
            .eq('id', id);

        if (error) {
            return { error: `Database Error: ${error.message}` };
        }

        return { success: true };
    } catch (err: any) {
        return { error: `Server Error: ${err.message}` };
    }
}
