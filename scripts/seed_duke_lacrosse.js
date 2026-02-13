/**
 * Seed script for Duke College Lacrosse Player testing
 * Creates an over-18 college athlete for full flow testing
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
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
    console.error("❌ Missing Supabase keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDukeLacrossePlayer() {
    console.log("🥍 Seeding Duke College Lacrosse Player...");

    // Generate unique ID
    const uniqueId = 'GC-DUKE-' + Math.floor(1000 + Math.random() * 9000);

    // Birthday for 20-year-old (over 18, college-aged)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 20);
    const dobString = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const userData = {
        email: 'duke.goalie@test.com',
        goalie_name: 'Marcus Thompson',
        parent_name: null, // Over 18, no parent needed
        parent_phone: null,
        grad_year: 2027, // Junior in college
        team: 'Duke Blue Devils',
        sport: 'Lacrosse',
        assigned_unique_id: uniqueId,
        is_claimed: false,
        height: '6\'2"',
        weight: '195 lbs',
        birthday: dobString,
        raw_data: {
            dob: dobString,
            level: 'College',
            school: 'Duke University',
            position: 'Goalie',
            years_playing: 8,
            primary_coach: 'Coach Williams',
            notes: 'Starting goalie, 3-year varsity experience'
        }
    };

    // Check if user already exists
    const { data: existing } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();

    if (existing) {
        console.log("📋 User already exists:", existing.goalie_name, "- ID:", existing.assigned_unique_id);
        console.log("   Email:", existing.email);
        console.log("   DOB for login:", existing.raw_data?.dob || existing.birthday);
        return existing;
    }

    const { data, error } = await supabase
        .from('roster_uploads')
        .insert([userData])
        .select()
        .single();

    if (error) {
        console.error("❌ Seed Error:", error);
        process.exit(1);
    }

    console.log("✅ Seeded Duke Lacrosse Player Successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", userData.email);
    console.log("🎂 DOB for login:", dobString);
    console.log("🏃 Name:", userData.goalie_name);
    console.log("🎓 Team:", userData.team);
    console.log("🥍 Sport:", userData.sport);
    console.log("🔑 Unique ID:", uniqueId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📌 NEXT STEPS:");
    console.log("1. Go to http://localhost:3005/activate");
    console.log("2. Enter email: duke.goalie@test.com");
    console.log("3. Enter DOB:", dobString);
    console.log("4. Complete baseline questions");
    console.log("5. Accept terms and activate");

    return data;
}

seedDukeLacrossePlayer();
