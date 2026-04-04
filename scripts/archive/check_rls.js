
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
    console.log("🔍 Checking RLS Policies...");

    const { data, error } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd, roles');

    // Note: pg_policies is a system view, usually not accessible via API unless exposing it or using RPC.
    // Fallback: Try to Select from tables to see if it works? No, that doesn't prove Insert.

    // BETTER WAY: Use the verification script approach of just checking if tables exist and maybe key columns.
    // Real validation of RLS requires SQL access or simulation.

    // Let's try to simulate an insert as a "Goalie" logic? Hard without user token.

    console.log("Direct RLS check via API is restricted. Assuming policies exist based on codebase habits.");
    // Actually, I can use the 'rpc' if I had a custom function, but I don't.

    // Instead, I will check if 'sessions' table relies on RLS by checking if I can read it without service role (anon).
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { error: anonError } = await anonClient.from('sessions').select('*').limit(1);

    if (anonError) {
        console.log("✅ Sessions table is protected (Anon Read Failed):", anonError.message);
    } else {
        console.log("⚠️ Sessions table is PUBLICLY READABLE (Check Policies!)");
    }

    const { error: refError } = await anonClient.from('reflections').select('*').limit(1);

    if (refError) {
        console.log("✅ Reflections table is protected:", refError.message);
    } else {
        console.log("⚠️ Reflections table is PUBLICLY READABLE");
    }
}

checkRLS();
