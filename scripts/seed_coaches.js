require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

const coachesToSeed = [
    {
        email: 'coach.main@goalieguard.com',
        password: 'password123',
        name: 'Coach Michael',
        bio: 'Former Pro Goalie with 15 years coaching experience. Specialist in butterfly style and rebound control.',
        philosophy: 'Fundamentals first. Speed follows technique.',
        pricing: { private: { type: 'package', price: 500, details: { lessons_per_session: 5 } } }
    },
    {
        email: 'coach.sarah@goalieguard.com',
        password: 'password123',
        name: 'Coach Sarah',
        bio: 'NCAA D1 Alumni. Focuses on mental performance and game-day preparation.',
        philosophy: 'The game is 90% mental. I help you unlock that potential.',
        pricing: { private: { type: 'subscription', price: 150, details: { sessions_per_month: 2 } } }
    },
    {
        email: 'coach.dave@goalieguard.com',
        password: 'password123',
        name: 'Coach Dave',
        bio: 'Youth development expert. Making sure the foundation is solid for the next level.',
        philosophy: 'Have fun, work hard, stop pucks.',
        pricing: { private: { type: 'package', price: 300, details: { lessons_per_session: 3 } } }
    }
];

async function seedCoaches() {
    console.log("🌱 Seeding Coaches...");

    for (const coach of coachesToSeed) {
        console.log(`   Processing ${coach.name} (${coach.email})...`);

        // 1. Create/Get Auth User
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        let user = users.find(u => u.email === coach.email);

        if (!user) {
            const { data, error } = await adminClient.auth.admin.createUser({
                email: coach.email,
                password: coach.password,
                email_confirm: true,
                user_metadata: { first_name: coach.name.split(' ')[0], last_name: coach.name.split(' ')[1] || '' }
            });
            if (error) {
                console.error(`   ❌ Failed to create auth user: ${error.message}`);
                continue;
            }
            user = data.user;
            console.log("      -> Auth User Created.");
        } else {
            console.log("      -> Auth User Exists.");
        }

        // 2. Upsert Profile
        const { error: profileError } = await adminClient.from('profiles').upsert({
            id: user.id,
            email: coach.email,
            role: 'coach',
            goalie_name: coach.name,
            full_name: coach.name,
            bio: coach.bio,
            philosophy: coach.philosophy,
            pricing_config: coach.pricing
        });

        if (profileError) {
            console.error(`   ❌ Failed to upsert profile: ${profileError.message}`);
        } else {
            console.log("      -> Profile Upserted ✅");
        }
    }
    console.log("\n✨ Seeding Complete!");
}

seedCoaches();
