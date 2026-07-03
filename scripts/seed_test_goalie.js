require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Seeding Test Goalie: test.goalie@goaliecard.app...");
    const email = 'test.goalie@goaliecard.app';
    const password = 'password123';

    // 1. Cleanup Auth & Profile
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let userId = null;
    if (existingUser) {
        console.log("Deleting existing auth user:", existingUser.id);
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // 2. Create Auth User
    console.log("Creating Auth User...");
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Test',
            last_name: 'Goalie'
        }
    });

    if (createError) {
        console.error("Create User Error:", createError);
        return;
    }
    userId = user.id;
    console.log("User Created:", userId);

    // 3. Create Roster Upload
    console.log("Creating Roster Upload...");
    await supabase.from('roster_uploads').delete().eq('email', email);
    const { error: rosterError } = await supabase.from('roster_uploads').insert({
        goalie_name: 'Test Goalie User',
        email: email,
        grad_year: 2027,
        team: 'Test Gladiators',
        assigned_unique_id: 'GC-TEST-GOALIE',
        is_claimed: true,
        linked_user_id: userId,
        payment_status: 'paid',
        raw_data: { sport: 'Hockey' }
    });

    if (rosterError) {
        console.error("Roster Insert Error:", rosterError);
    }

    // 4. Create Profile
    console.log("Creating Profile...");
    await supabase.from('profiles').delete().eq('id', userId);
    const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: email,
        goalie_name: 'Test Goalie User',
        sport: 'Hockey',
        grad_year: 2027,
        role: 'goalie'
    });

    if (profileError) {
        console.error("Profile Insert Error:", profileError);
    } else {
        console.log("✅ Seeded test.goalie@goaliecard.app successfully.");
    }

    // 5. Seed Privacy Tester (User B)
    const emailB = 'privacy.tester@goaliecard.app';
    const existingB = users.find(u => u.email === emailB);
    if (existingB) {
        console.log("Deleting existing User B:", existingB.id);
        await supabase.auth.admin.deleteUser(existingB.id);
    }

    console.log("Creating User B (Privacy Tester)...");
    const { data: { user: userB }, error: createBError } = await supabase.auth.admin.createUser({
        email: emailB,
        password: password,
        email_confirm: true,
        user_metadata: { first_name: 'Privacy', last_name: 'Tester' }
    });

    if (createBError) {
        console.error("User B Create Error:", createBError);
        return;
    }

    await supabase.from('roster_uploads').delete().eq('email', emailB);
    await supabase.from('roster_uploads').insert({
        goalie_name: 'Privacy Tester User',
        email: emailB,
        grad_year: 2027,
        team: 'Privacy Team',
        assigned_unique_id: 'GC-PRIV-TEST',
        is_claimed: true,
        linked_user_id: userB.id,
        payment_status: 'paid',
        raw_data: { sport: 'Hockey' }
    });

    await supabase.from('profiles').delete().eq('id', userB.id);
    await supabase.from('profiles').insert({
        id: userB.id,
        email: emailB,
        goalie_name: 'Privacy Tester User',
        sport: 'Hockey',
        grad_year: 2027,
        role: 'goalie'
    });

    console.log("✅ Seeded privacy.tester@goaliecard.app successfully.");
}

run();
