
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSimulationUser() {
    const TEST_EMAIL = "sim_user@manual.test";
    const TEST_ID = "GC-SIM-01"; // Easy ID to remember

    console.log(`\n--- Setting up Simulation User (${TEST_EMAIL}) ---\n`);

    // 1. Cleanup Existing Roster Entry if any
    const { error: deleteError } = await supabase
        .from('roster_uploads')
        .delete()
        .eq('assigned_unique_id', TEST_ID);

    if (deleteError) console.error("Cleanup Error (Roster):", deleteError.message);
    else console.log("✅ Cleaned up old roster entry");

    // Not deleting from auth.users to avoid complex admin API calls (and safely assuming user might exist or not is fine for flow usually)
    // Ideally we delete the auth user too so they get a fresh "Sign Up" experience, but we can't easily do that without full admin rights or separate API
    // We'll rely on the app handling "Existing User" vs "New" gracefully.

    // 2. Create FRESH Roster Entry (Blank State)
    const { data, error: insertError } = await supabase
        .from('roster_uploads')
        .insert({
            email: TEST_EMAIL,
            assigned_unique_id: TEST_ID,
            goalie_name: "", // BLANK
            parent_name: "", // BLANK
            team: "", // BLANK
            sport: "Hockey", // Default
            is_claimed: false,
            raw_data: {
                note: "Simulation User"
            }
        })
        .select()
        .single();

    if (insertError) {
        console.error("❌ Failed to create simulation roster entry:", insertError.message);
        return;
    }

    console.log("✅ Created BLANK Roster Entry");
    console.log("------------------------------------------------");
    console.log(`Email:      ${TEST_EMAIL}`);
    console.log(`Access ID:  ${TEST_ID}`);
    console.log("------------------------------------------------");
    console.log("\nREADY FOR SIMULATION.");
    console.log("1. Go to /activate");
    console.log("2. Use the email above.");
    console.log("3. Expect to fill in all details.");
}

setupSimulationUser();
