
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantCoachAccess() {
    const EMAIL = "duke.goalie@test.com";
    console.log(`Granting COACH access to ${EMAIL}...`);

    // 1. Get User ID by email from profiles check
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', EMAIL);

    if (findError) {
        console.error("Profile find error:", findError.message);
    }

    let user = profiles && profiles.length > 0 ? profiles[0] : null;

    if (!user) {
        console.log("Profile not found. Checking Auth Admin...");
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error("Auth Admin Error:", authError.message);
            return;
        }

        const authUser = users.find(u => u.email === EMAIL);

        if (authUser) {
            console.log("Found in Auth Admin. Creating Profile...");
            const { error: createError } = await supabase.from('profiles').insert({
                id: authUser.id,
                email: EMAIL,
                role: 'coach',
                roles: ['coach', 'goalie'],
                first_name: "Duke",
                last_name: "Coach",
                is_onboarded: true,
                updated_at: new Date().toISOString()
            });
            if (createError) console.error("Create Profile Error:", createError.message);
            else console.log("✅ Created Profile with Coach Role");
            return;
        } else {
            console.log("User not found in Auth Admin. Creating new user...");
            const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
                email: EMAIL,
                password: "password123",
                email_confirm: true
            });

            if (createUserError) {
                console.error("Create User Error:", createUserError.message);
                return;
            }

            console.log(`✅ Created User: ${newUser.user.id}`);

            // Create Profile
            const { error: createProfileError } = await supabase.from('profiles').insert({
                id: newUser.user.id,
                email: EMAIL,
                role: 'coach',
                roles: ['coach', 'goalie'],
                first_name: "Duke",
                last_name: "Coach",
                is_onboarded: true,
                updated_at: new Date().toISOString()
            });

            if (createProfileError) console.error("Create Profile Error:", createProfileError.message);
            else console.log("✅ Created Profile with Coach Role");
            return;
        }
    }

    console.log(`Found Profile: ${user.id} (${user.email})`);

    // 2. Update Role
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role: 'coach',
            roles: ['coach', 'goalie'], // Give both so they can switch
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (updateError) {
        console.error("Update Error:", updateError.message);
    } else {
        console.log("✅ Successfully upgraded to COACH.");
    }
}

grantCoachAccess();
