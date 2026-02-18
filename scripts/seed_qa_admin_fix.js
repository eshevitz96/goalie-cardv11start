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
    console.log("Seeding QA Admin (Retry): elliott.validate@goalieguard.com");
    const email = 'elliott.validate@goalieguard.com';
    const password = 'password123';

    // 1. Get User ID (Assume created from previous run)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    // If not found, recreate (simpler to just assume it might be there or not)
    if (!user) {
        console.log("User not found, creating...");
        const { data: { user: newUser }, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: 'QA',
                last_name: 'Admin'
            }
        });
        if (error) { console.error(error); return; }
        user = newUser;
    } else {
        console.log("User exists. Updating password...");
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password }
        );
        if (updateError) {
            console.error("Password Update Error:", updateError);
            return;
        }
        console.log("Password updated.");
    }

    console.log("User ID:", user.id);

    // 2. Check Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (!profile) {
        console.log("Profile missing. Inserting manually...");
        const { error: insError } = await supabase.from('profiles').insert({
            id: user.id,
            email: email,
            role: 'admin',
            created_at: new Date().toISOString()
        });
        if (insError) console.error("Profile Insert Error:", insError);
        else console.log("Profile Inserted.");
    } else {
        console.log("Profile exists. Updating role...");
        // Ensure role is admin
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    }

    // 3. Ensure Roster Link matches
    const { error: rosterError } = await supabase.from('roster_uploads')
        .update({ linked_user_id: user.id, is_claimed: true })
        .eq('email', email);

    if (rosterError) console.error("Roster update error:", rosterError);
    else console.log("Roster link updated.");

    console.log("✅ Seed Fix Complete.");
}

run();
