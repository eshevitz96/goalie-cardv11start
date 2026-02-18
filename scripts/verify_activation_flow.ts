
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function simulateActivationFlow() {
    console.log("🚀 Simulating Activation Flow...");

    const testEmail = `activation_test_${Date.now()}@goalieguard.com`;
    const testPassword = 'password123';

    // 1. Create a "Purchased" Roster Entry (Unclaimed)
    console.log("1. Creating Unclaimed Roster Entry...");
    const { data: roster, error: rosterError } = await supabaseAdmin
        .from('roster_uploads')
        .insert({
            goalie_name: 'Unclaimed Goalie',
            email: testEmail,
            is_claimed: false,
            payment_status: 'paid',
            access_pin: '1234'
        })
        .select()
        .single();

    if (rosterError) {
        console.error("❌ Failed to create roster:", rosterError.message);
        return;
    }
    console.log(`✅ Roster Created: ${roster.id}`);

    // 2. Simulate "Activate" Action Logic
    console.log("2. Simulating Activation Logic...");

    // A. Create Auth User
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
    });

    if (authError) {
        console.error("❌ Auth Creation Failed:", authError.message);
        return;
    }
    const userId = auth.user.id;
    console.log(`✅ Auth User Created: ${userId}`);

    // B. Create Profile (Critical Step)
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email: testEmail,
            role: 'goalie',
            goalie_name: 'Activated Goalie Name',
            created_at: new Date().toISOString()
        });

    if (profileError) {
        console.error("❌ Profile Creation Failed:", profileError.message);
        return;
    }
    console.log("✅ Profile Created.");

    // C. Link Roster
    const { error: linkError } = await supabaseAdmin
        .from('roster_uploads')
        .update({
            is_claimed: true,
            linked_user_id: userId,
            goalie_name: 'Activated Goalie Name', // Update name from form
            raw_data: { setup_complete: true } // Put inside jsonb
        })
        .eq('id', roster.id);

    if (linkError) {
        console.error("❌ Roster Link Failed:", linkError.message);
        return;
    }
    console.log("✅ Roster Linked.");

    // 3. Verify Admin Visibility
    console.log("3. Verifying Admin Visibility...");
    const { data: adminView, error: adminError } = await supabaseAdmin
        .from('roster_uploads')
        .select('*, profile:profiles(*)')
        .eq('id', roster.id)
        .single();

    if (adminError) {
        console.error("❌ Admin Fetch Failed:", adminError.message);
    } else {
        console.log(`✅ Admin sees: ${adminView.goalie_name} (${adminView.email})`);
        console.log(`   Linked User: ${adminView.linked_user_id}`);
        console.log(`   Is Claimed: ${adminView.is_claimed}`);
    }

    // Cleanup
    console.log("🧹 Cleaning up...");
    await supabaseAdmin.auth.admin.deleteUser(userId); // Cascades to profile usually?
    await supabaseAdmin.from('roster_uploads').delete().eq('id', roster.id);
    console.log("✅ Cleanup Complete.");
}

simulateActivationFlow();
