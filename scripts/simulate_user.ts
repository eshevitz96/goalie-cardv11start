
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateUser() {
    const TEST_EMAIL = "eshevitz96@gmail.com";
    console.log(`\n--- Simulating User: ${TEST_EMAIL} ---\n`);

    // 1. Check if Auth User exists
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    // Filter manually because listUsers doesn't support email filtering directly in all versions
    const user = users?.find(u => u.email?.toLowerCase() === TEST_EMAIL.toLowerCase());

    if (!user) {
        console.error("❌ Auth User NOT found for:", TEST_EMAIL);
        // List all users to help debug
        console.log("Available Users:");
        users?.forEach(u => console.log(`- ${u.email} (${u.id})`));
    } else {
        console.log("✅ Auth User Found:", user.id);
    }

    // 2. Check Roster Fetch Logic
    console.log("\nChecking Roster Table linkage...");
    const { data: rosterData, error: rosterError } = await supabase
        .from('roster_uploads')
        .select('*')
        .ilike('email', TEST_EMAIL);

    if (rosterError) {
        console.error("Error fetching roster:", rosterError.message);
    } else if (!rosterData || rosterData.length === 0) {
        console.error("❌ No roster entry found matching email.");
    } else {
        console.log("✅ Roster Entry Found:", rosterData[0].assigned_unique_id);
        console.log("   Goalie Name:", rosterData[0].goalie_name);
        console.log("   Team:", rosterData[0].team);
    }
}

simulateUser();
