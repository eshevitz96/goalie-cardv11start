
import { checkUserStatus } from '../src/app/actions';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mocking actions.ts context? No, we can run it directly if it's "use server" but we are in node.
// We need to ensure action.ts can run in this node script. 
// It imports setup code. Let's try to verify just the logical branches.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWelcomeFlow() {
    console.log("🚀 Verifying Welcome Flow Logic...");

    // 1. Setup Test Data
    const testEmailExisting = "eshevitz96@gmail.com"; // Known existing user
    const testEmailNew = `new_kid_${Date.now()}@test.com`;
    const testEmailRosterOnly = `roster_recruit_${Date.now()}@test.com`;

    // Create Roster Spot for Recruit
    const { data: roster } = await supabase.from('roster_uploads').insert({
        email: testEmailRosterOnly,
        is_claimed: false,
        goalie_name: "Recruit Goalie",
        payment_status: 'paid'
    }).select().single();

    console.log(`\n--- Test 1: Existing User (${testEmailExisting}) ---`);
    const statusExisting = await checkUserStatusImpl(testEmailExisting, supabase);
    console.log("Result:", statusExisting);

    if (statusExisting.exists && statusExisting.rosterStatus === 'linked') {
        console.log("✅ Correctly identified Existing User");
    } else {
        console.error("❌ Failed to identify Existing User");
    }

    console.log(`\n--- Test 2: Roster Only User (${testEmailRosterOnly}) ---`);
    const statusRoster = await checkUserStatusImpl(testEmailRosterOnly, supabase);
    console.log("Result:", statusRoster);

    if (!statusRoster.exists && statusRoster.rosterStatus === 'found') {
        console.log("✅ Correctly identified Roster-Only User (Should Redirect to Activate)");
    } else {
        console.error("❌ Failed to identify Roster-Only User");
    }

    console.log(`\n--- Test 3: New/Unknown User (${testEmailNew}) ---`);
    const statusNew = await checkUserStatusImpl(testEmailNew, supabase);
    console.log("Result:", statusNew);

    if (!statusNew.exists && statusNew.rosterStatus === 'not_found') {
        console.log("✅ Correctly identified Unknown User (Should Redirect to Activate)");
    } else {
        console.error("❌ Failed to identify Unknown User");
    }

    // Cleanup
    await supabase.from('roster_uploads').delete().eq('email', testEmailRosterOnly);
}

// Re-implement logic here to verify against REAL DB without Next.js context issues
async function checkUserStatusImpl(email: string, supabaseAdmin: any) {
    const emailLower = email.toLowerCase().trim();

    // 1. Check Profile
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, role, goalie_name')
        .eq('email', emailLower)
        .maybeSingle();

    if (profile) return { exists: true, role: profile.role, rosterStatus: 'linked', profile };

    // 2. Check Roster
    const { data: roster } = await supabaseAdmin
        .from('roster_uploads')
        .select('id, is_claimed, goalie_name')
        .ilike('email', emailLower)
        .maybeSingle();

    if (roster) return { exists: false, rosterStatus: 'found', isClaimed: roster.is_claimed, goalieName: roster.goalie_name };

    return { exists: false, rosterStatus: 'not_found' };
}

verifyWelcomeFlow().catch(console.error);
