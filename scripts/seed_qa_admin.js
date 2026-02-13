require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Seeding QA Admin: elliott.validate@goalieguard.com");
    const email = 'elliott.validate@goalieguard.com';
    const password = 'password123';

    // 1. Cleanup Roster & Auth
    // First get user ID to delete from Auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log("Deleting existing auth user:", existingUser.id);
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    const { error: delError } = await supabase.from('roster_uploads').delete().eq('email', email);
    if (delError) console.error("Delete Roster Error:", delError);


    // 2. Create Auth User
    console.log("Creating Auth User...");
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            first_name: 'QA',
            last_name: 'Admin'
        }
    });

    if (createError) {
        console.error("Create User Error:", createError);
        return;
    }
    console.log("User Created:", user.id);

    // 3. Insert Roster Spot (Linked)
    const { error } = await supabase.from('roster_uploads').insert({
        goalie_name: 'QA Admin User',
        parent_name: 'QA Parent',
        parent_phone: '555-0000',
        email: email,
        grad_year: 2015,
        team: 'GoalieGuard HQ',
        assigned_unique_id: 'GC-QA-ADMIN',
        session_count: 99,
        lesson_count: 99,
        is_claimed: true,
        linked_user_id: user.id, // AUTO-LINK
        payment_status: 'paid',
        raw_data: {
            sport: 'Hockey',
            dob: '1997-02-07',
            admin_trigger: true
        }
    });

    // 4. Update Profile Role to Admin (if profile exists triggered by auth hook)
    // Wait a bit for triggers
    await new Promise(r => setTimeout(r, 2000));

    const { error: profileError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    if (profileError) {
        console.warn("Profile update failed (maybe profile not created yet or RLS):", profileError);
        // Try inserting if not exists? Usually checking if triggered.
    } else {
        console.log("Profile role updated to 'admin'.");
    }


    if (error) {
        console.error("Insert Roster Error:", error);
    } else {
        console.log("✅ Seeded QA Admin successfully.");
        console.log(`Credentials: ${email} / ${password}`);
    }
}

run();
