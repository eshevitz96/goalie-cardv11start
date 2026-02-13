require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🚀 Configuring Admin User...");
    const email = 'admin.test.user@goalieguard.com';
    const password = 'password123';

    // 1. Check if user exists
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let targetUser = users.find(u => u.email === email);
    let userId;

    if (targetUser) {
        console.log(`User found (${targetUser.id}). Updating password...`);
        const { data, error } = await adminClient.auth.admin.updateUserById(targetUser.id, {
            password: password,
            user_metadata: { first_name: 'QA', last_name: 'Admin' },
            email_confirm: true
        });
        if (error) {
            console.error("Update Failed:", error.message);
            // Try delete and recreate as fallback?
            // console.log("Trying delete...");
            // await adminClient.auth.admin.deleteUser(targetUser.id);
            // Return or continue?
        } else {
            console.log("Password updated.");
        }
        userId = targetUser.id;
    } else {
        console.log("User not found. Creating...");
        const { data: { user }, error } = await adminClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { first_name: 'QA', last_name: 'Admin' }
        });
        if (error) {
            console.error("Create Failed:", error.message);
            process.exit(1);
        }
        console.log("User Created:", user.id);
        userId = user.id;
    }

    // 2. Ensure Profile & Role
    console.log("Ensuring Profile...");
    const { data: profile } = await adminClient.from('profiles').select('*').eq('id', userId).single();

    if (!profile) {
        await adminClient.from('profiles').insert({
            id: userId,
            email: email,
            role: 'admin',
            created_at: new Date().toISOString()
        });
        console.log("Profile Inserted.");
    } else {
        if (profile.role !== 'admin') {
            await adminClient.from('profiles').update({ role: 'admin' }).eq('id', userId);
            console.log("Profile role updated to admin.");
        } else {
            console.log("Profile role is already admin.");
        }
    }

    // 3. Ensure Roster Link (for testing logic)
    console.log("Ensuring Roster Link...");
    const { data: roster } = await adminClient.from('roster_uploads').select('*').eq('email', email).maybeSingle();

    if (roster) {
        if (roster.linked_user_id !== userId) {
            await adminClient.from('roster_uploads').update({ linked_user_id: userId, is_claimed: true }).eq('id', roster.id);
            console.log("Roster linked.");
        }
    } else {
        await adminClient.from('roster_uploads').insert({
            email: email,
            goalie_name: 'QA Admin Goalie',
            linked_user_id: userId,
            is_claimed: true,
            assigned_unique_id: 'GC-QA-ADMIN-TEST',
            team: 'Admin Team'
        });
        console.log("Dummy Roster Inserted.");
    }

    // 4. Verify Login (API)
    console.log("🔐 Verifying API Login...");
    const { data: loginData, error: loginError } = await authClient.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error("❌ Login Verification FAILED:", loginError.message);
    } else {
        console.log("✅ Login Verification SUCCESS! Token Role:", loginData.user.role);
    }

    // 5. Generate Magic Link
    console.log("🔗 Generating Magic Link...");
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email
    });

    if (linkError) {
        console.error("Magic Link Failed:", linkError.message);
    } else {
        console.log("\n>>> MAGIC LINK <<<");
        console.log(linkData.properties.action_link);
        console.log(">>> <<<\n");
    }
}

run();
