require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🧪 testing Roster Creation via API (Simulating Admin UI)...");
    const email = 'admin.test.user@goalieguard.com';
    const password = 'password123';

    // 1. Login
    const { data: { session }, error: loginError } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message);
        process.exit(1);
    }
    console.log("✅ Logged in as Admin.");

    // 2. Create Roster Spot
    const testRoster = {
        goalie_name: 'API Test Goalie',
        email: 'api.test.goalie@goalieguard.com',
        team: 'API Squad',
        grad_year: 2029,
        assigned_unique_id: 'GC-API-TEST-001'
    };

    console.log("Creating Roster Spot...", testRoster);

    const { data: insertData, error: insertError } = await authClient
        .from('roster_uploads')
        .insert(testRoster)
        .select('*')
        .single();

    if (insertError) {
        console.error("❌ Roster Creation Failed:", insertError.message);
        console.error("Details:", insertError.details);
        process.exit(1);
    }

    console.log("✅ Roster Spot Created Successfully!");
    console.log("  ID:", insertData.id);
    console.log("  Goalie:", insertData.goalie_name);

    // 3. Cleanup (Delete the test spot)
    console.log("Cleaning up...");
    const { error: deleteError } = await authClient
        .from('roster_uploads')
        .delete()
        .eq('id', insertData.id);

    if (deleteError) {
        console.error("⚠️ Cleanup Failed:", deleteError.message);
    } else {
        console.log("✅ Cleanup Complete.");
    }
}

run();
