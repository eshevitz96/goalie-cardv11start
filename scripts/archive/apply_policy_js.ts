import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error("Critical: SUPABASE_SERVICE_ROLE_KEY not found. Using Anon (might fail if RLS strict).");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function applyPolicy() {
    const sql = `
    -- Enable RLS
    ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if it exists to avoid error
    DROP POLICY IF EXISTS "Allow update for matching email" ON public.roster_uploads;

    -- Create Policy
    CREATE POLICY "Allow update for matching email" ON public.roster_uploads
    FOR UPDATE
    USING (
      lower(email) = lower(auth.jwt() ->> 'email')
    )
    WITH CHECK (
      lower(email) = lower(auth.jwt() ->> 'email')
    );
    
    -- Also allow SELECT
    DROP POLICY IF EXISTS "Allow select for matching email" ON public.roster_uploads;
    CREATE POLICY "Allow select for matching email" ON public.roster_uploads
    FOR SELECT
    USING (
      lower(email) = lower(auth.jwt() ->> 'email')
    );
  `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); // Requires exec_sql function or direct connection

    // Since we don't have exec_sql RPC usually enabled by default, we'll try the PG client approach 
    // OR just manually use Supabase's query interface if possible, but 'rpc' is for functions.
    // Actually, we can't run DDL via JS Client unless we have a specific RPC.

    console.log("Cannot apply DDL via JS Client without RPC. Please run the SQL manually in Supabase Dashboard or use the 'pg' script.");
}

applyPolicy();
