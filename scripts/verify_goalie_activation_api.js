require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// We need Admin Client for some checks
const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🧪 Simulating Goalie Activation via API...");

    const testEmail = 'api.simulated.goalie@goalieguard.com';
    const testPassword = 'password123';

    // 1. Clean Slate (Ensure user doesn't exist)
    console.log("🧹 Cleaning up previous test data...");
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === testEmail);
    if (existingUser) {
        await adminClient.auth.admin.deleteUser(existingUser.id);
        console.log("   -> Deleted existing auth user.");
    }
    await adminClient.from('roster_uploads').delete().eq('email', testEmail);
    console.log("   -> Deleted roster entries.");

    // 2. Simulate "New User" Flow
    console.log("🚀 Starting Activation Flow...");

    // A. "Lookup" (Check status)
    // Code from actions.ts essentially checks profiles/roster
    const { data: profile } = await adminClient.from('profiles').select('id').eq('email', testEmail).single();
    if (!profile) console.log("   -> User confirmed as NEW (No Profile).");

    // B. "Create" Roster Spot (simulating ActivateCreateStep)
    console.log("📝 Creating Roster Spot...");
    const rosterData = {
        email: testEmail,
        goalie_name: 'Simulated Goalie',
        parent_name: 'Sim Parent',
        parent_phone: '555-0100',
        grad_year: 2030,
        team: 'Simulation Squad',
        raw_data: { source: 'api_sim' } // mimicking how we store initial data
    };

    const { data: newRoster, error: rosterError } = await adminClient
        .from('roster_uploads')
        .insert(rosterData)
        .select()
        .single();

    if (rosterError) {
        console.error("❌ Roster Creation Failed:", rosterError.message);
        process.exit(1);
    }
    console.log(`   -> Roster Spot Created: ${newRoster.id}`);

    // C. "Activate" (simulating handleFinalActivation / activateUserCard)
    console.log("🔐 Activating Card...");

    // We need a USER ID to link. In the real app, we might create the user first or during?
    // The `activateUserCard` action expects a CURRENT USER session.
    // So we must create the Auth User first.

    console.log("   -> Creating Auth User...");
    const { data: { user: newUser }, error: createError } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { first_name: 'Simulated', last_name: 'Goalie' }
    });

    if (createError) {
        console.error("❌ Auth User Creation Failed:", createError.message);
        process.exit(1);
    }
    console.log(`   -> Auth User Created: ${newUser.id}`);

    // D. Call `activateUserCard` logic manually (since we can't import server actions easily in script)
    // Logic: Update roster with linked_user_id, setup_complete, etc. And update Profile.

    console.log("   -> Linking Roster & Profile...");

    // Mimic actions.ts: update raw_data
    const updatedRawData = {
        ...rosterData.raw_data,
        setup_complete: true,
        access_pin: '1234',
        activation_date: new Date().toISOString(),
        linked_user_id: newUser.id
    };

    const { error: linkError } = await adminClient
        .from('roster_uploads')
        .update({
            linked_user_id: newUser.id,
            is_claimed: true,
            raw_data: updatedRawData
        })
        .eq('id', newRoster.id);

    if (linkError) {
        console.error("❌ Roster Link Failed:", linkError.message);
    } else {
        console.log("   -> Roster Linked Successfully.");
    }

    // Update Profile (Sync Parent Info) - "Logic Phase 4"
    await adminClient.from('profiles').update({
        first_name: 'Sim', // Parent First Name
        last_name: 'Parent', // Parent Last Name
        phone: '555-0100',
        role: 'goalie' // Default role
    }).eq('id', newUser.id);
    // Note: In real app, profile is created via trigger on auth.createUser, so update works.

    // 3. Verify Dashboard Data Access
    console.log("📊 Verifying Dashboard Data Access...");

    // Login as the new user
    const { data: { session }, error: loginError } = await authClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginError) {
        console.error("❌ Login Failed on Verification:", loginError.message);
        process.exit(1);
    }

    // Fetch "My Goalie Data" (simulating useParentData / useGoalieData)
    // Logic: Get Roster where linked_user_id = me
    const { data: myRoster, error: fetchError } = await authClient
        .from('roster_uploads')
        .select('*')
        .eq('linked_user_id', session.user.id)
        .single();

    if (fetchError || !myRoster) {
        console.error("❌ Failed to fetch My Roster:", fetchError?.message);
    } else {
        console.log("✅ Dashboard Data Access SUCCESS!");
        console.log(`   -> Name: ${myRoster.goalie_name}`);
        console.log(`   -> Team: ${myRoster.team}`);
        console.log(`   -> Status: ${myRoster.is_claimed ? 'Claimed' : 'Unclaimed'}`);
    }
}

run();
