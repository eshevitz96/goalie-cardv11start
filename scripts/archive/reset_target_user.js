
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetUser() {
    console.log("🔄 Resetting 'thebhoopathyboys@gmail.com'...");

    const { error } = await supabase
        .from('roster_uploads')
        .update({
            is_claimed: false,
            // setup_complete: false, // Column might be missing, skipping
            birthday: '2010-01-01',
            raw_data: { dob: '2010-01-01' }
        })
        .eq('email', 'thebhoopathyboys@gmail.com');

    if (error) {
        console.error("Reset Error:", error);
    } else {
        console.log("✅ User Reset. Ready for Simulation.");
    }
}

resetUser();
