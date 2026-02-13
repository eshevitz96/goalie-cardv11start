
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

// SIMULATE BROWSER CLIENT (ANON KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugAdd() {
    console.log("🕵️‍♀️ Attempting to add user via Anon Key (Simulating Admin Client)...");

    const payload = {
        email: 'debug_manual_add@test.com',
        goalie_name: 'Debug Goalie',
        parent_name: 'Debug Parent',
        grad_year: 2030,
        assigned_unique_id: 'GC-DEBUG-001',
        is_claimed: true,
        payment_status: 'paid',
        birthday: '2010-01-01'
    };

    const { data, error } = await supabase.from('roster_uploads').insert([payload]).select();

    if (error) {
        console.error("❌ INSERT FAILED:", error);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("Details:", error.details);
    } else {
        console.log("✅ INSERT SUCCESS!");
        console.log("Inserted:", data);
    }
}

debugAdd();
