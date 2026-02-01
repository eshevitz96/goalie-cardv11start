
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    console.log("🌱 Seeding CLEAN test user...");

    const { error } = await supabase.from('roster_uploads').insert([{
        email: 'thebhoopathyboys@gmail.com',
        goalie_name: 'Test Goalie',
        parent_name: 'Test Parent',
        parent_phone: '555-0100',
        grad_year: 2028,
        team: 'Test Team HC',
        assigned_unique_id: 'GC-9001',
        is_claimed: false,
        birthday: '2010-01-01',
        raw_data: {
            dob: '2010-01-01',
            parent_email: 'guardian@test.com'
        }
    }]);

    if (error) {
        console.error("Seed Error:", error);
    } else {
        console.log("✅ Seeded 'thebhoopathyboys@gmail.com' (DOB: 01/01/2010)");
    }
}

seedUser();
