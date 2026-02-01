import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Using anon key first to see what client sees
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Need verify if this is available in .env.local

console.log("Checking accounts for eshevitz96@gmail.com...");

async function checkUser(key: string, type: string) {
    const sb = createClient(supabaseUrl, key);
    const email = 'eshevitz96@gmail.com';

    const { data, error } = await sb
        .from('roster_uploads')
        .select('*')
        .ilike('email', email);

    if (error) {
        console.error(`[${type}] Error:`, error.message);
    } else {
        console.log(`[${type}] Found ${data?.length} records:`);
        data?.forEach(d => console.log(` - ID: ${d.id}, Claimed: ${d.is_claimed}, Created: ${d.created_at}, Data:`, JSON.stringify(d.raw_data).substring(0, 100) + "..."));
    }
}

async function run() {
    await checkUser(supabaseKey, "ANON_KEY");
    // If service key exists, check with that too to see 'real' state vs RLS state
    if (supabaseServiceKey) {
        await checkUser(supabaseServiceKey, "SERVICE_KEY");
    } else {
        console.log("No SERVICE_ROLE_KEY found in env to check bypass RLS.");
    }
}

run();
