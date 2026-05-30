import { createClient } from "@supabase/supabase-js";

/**
 * Institutional Admin Client (SERVICE_ROLE)
 * Only use in secure server environments.
 */
export function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(`Supabase Admin Configuration Missing: ${!url ? 'URL ' : ''}${!key ? 'KEY ' : ''}`);
    }

    return createClient(url, key);
}
