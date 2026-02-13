require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

const coachElliott = {
    email: 'elliott@goalieguard.com', // Assuming this email, or should I ask? I'll use a placeholder or the user's email if likely. User said "coach elliott". I'll use a standard format.
    password: 'password123',
    name: 'Elliott Shevitz',
    role: 'coach',
    bio: 'Head Goalie Coach. 10+ years experience developing elite goaltenders.',
    philosophy: 'Technical excellence meets mental toughness.',
    pricing: { private: { type: 'package', price: 600, details: { lessons_per_session: 5 } } }
};

async function seedElliott() {
    console.log("🌱 Seeding Coach Elliott...");

    // 1. Create/Get Auth User
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let user = users.find(u => u.email === coachElliott.email);

    if (!user) {
        const { data, error } = await adminClient.auth.admin.createUser({
            email: coachElliott.email,
            password: coachElliott.password,
            email_confirm: true,
            user_metadata: { first_name: 'Elliott', last_name: 'Shevitz' }
        });
        if (error) {
            console.error(`   ❌ Failed to create auth user: ${error.message}`);
            return;
        }
        user = data.user;
        console.log("   -> Auth User Created.");
    } else {
        console.log("   -> Auth User Exists.");
    }

    // 2. Upsert Profile
    const { error: profileError } = await adminClient.from('profiles').upsert({
        id: user.id,
        email: coachElliott.email,
        role: 'coach',
        goalie_name: coachElliott.name,
        full_name: coachElliott.name,
        bio: coachElliott.bio,
        philosophy: coachElliott.philosophy,
        pricing_config: coachElliott.pricing
    });

    if (profileError) {
        console.error(`   ❌ Failed to upsert profile: ${profileError.message}`);
    } else {
        console.log("   -> Profile Upserted ✅");
        console.log(`   -> Credentials: ${coachElliott.email} / ${coachElliott.password}`);
    }
}

seedElliott();
