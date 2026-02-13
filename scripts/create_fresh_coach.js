
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

async function createFreshCoach() {
    const EMAIL = "coach.verified@test.com"; // New email
    const PASSWORD = "password123";

    console.log(`Creating Fresh Coach: ${EMAIL}...`);

    let userId;

    // 1. Check if user exists first
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (users) {
        const existing = users.find(u => u.email === EMAIL);
        if (existing) {
            console.log("User already exists. ID:", existing.id);
            userId = existing.id;
            await supabase.auth.admin.updateUserById(userId, { password: PASSWORD });
        }
    }

    if (!userId) {
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true
        });

        if (createUserError) {
            console.error("Create User Error:", createUserError.message);
            return;
        }
        userId = newUser.user.id;
        console.log(`✅ Created Auth User: ${userId}`);
    }

    await setUpProfile(userId, EMAIL);
}

async function setUpProfile(userId, email) {
    console.log("Upserting profile (minimal)...");
    // 2. Upsert Profile (Ultra Minimal Columns)
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'coach',
            roles: ['coach']
        });

    if (profileError) {
        console.error("Profile Upsert Error:", profileError.message);
    } else {
        console.log("✅ Created/Updated Profile with Coach Role");
    }
}

createFreshCoach();
