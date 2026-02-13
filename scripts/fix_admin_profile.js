
const { createClient } = require('@supabase/supabase-js');

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    const email = 'eshevitz96@gmail.com';
    console.log(`Fixing profile for ${email}...`);

    // 1. Get Auth User
    // listUsers is paginated, but usually finds recent
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    const targetUser = users.find(u => u.email === email);

    if (!targetUser) {
        console.error("Auth User NOT FOUND. Strange, createUser said it exists?");
        return;
    }

    console.log(`Found Auth User: ${targetUser.id}`);

    // 2. Check Profile
    const { data: profiles } = await supabase.from('profiles').select('*').eq('id', targetUser.id);

    if (profiles && profiles.length > 0) {
        console.log("Profile already exists. Updating role...");
        await supabase.from('profiles').update({ role: 'admin', roles: ['admin', 'goalie', 'coach'] }).eq('id', targetUser.id);
    } else {
        console.log("Profile MISSING. Inserting...");
        const { error: insertError } = await supabase.from('profiles').insert({
            id: targetUser.id,
            email: email,
            goalie_name: 'Elliott Admin',
            role: 'admin',
            roles: ['admin', 'goalie', 'coach'],
            created_at: new Date().toISOString()
        });

        if (insertError) console.error("Insert Failed:", insertError);
        else console.log("Success! Profile created and set to Admin.");
    }

    // 3. Reset Password just in case
    console.log("Resetting password to 'goalie123'...");
    const { error: resetError } = await supabase.auth.admin.updateUserById(targetUser.id, { password: 'goalie123' });
    if (resetError) console.error("Password Reset Failed:", resetError);
    else console.log("Password reset successfully.");
}

fix();
