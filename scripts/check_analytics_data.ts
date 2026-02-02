
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAnon = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey); // Fallback to anon if service key missing, but usually need service for admin check

async function checkData() {
    console.log("Checking SESSIONS table...");

    // 1. Check as ADMIN (Service Role) - What actually exists?
    const { data: adminSessions, error: adminError } = await supabaseAdmin
        .from('sessions')
        .select('id, date, roster_id');

    if (adminError) console.error("Admin Query Error:", adminError);
    else console.log(`Total Sessions in DB (Admin View): ${adminSessions?.length}`);

    // 2. Check as ANON (Public View) - What can be seen publicly?
    const { data: anonSessions, error: anonError } = await supabaseAnon
        .from('sessions')
        .select('id');

    if (anonError) console.error("Anon Query Error:", anonError);
    else console.log(`Total Sessions Visible to Anon: ${anonSessions?.length}`);

    // 3. Check Roster Uploads to see if we have goalies
    const { count: goalieCount } = await supabaseAdmin.from('roster_uploads').select('*', { count: 'exact', head: true });
    console.log(`Total Roster Entries: ${goalieCount}`);

    // 4. Check Reflections
    const { count: refCount } = await supabaseAdmin.from('reflections').select('*', { count: 'exact', head: true });
    console.log(`Total Reflections: ${refCount}`);
}

checkData();
