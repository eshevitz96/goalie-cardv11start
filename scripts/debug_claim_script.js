
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing keys");
    process.exit(1);
}

// SIMULATE FRONTEND (ANON CLIENT)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const searchEmail = 'betatest@goalie.com';
    console.log(`Checking '${searchEmail}' as ANON user...`);

    const { data, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .ilike('email', searchEmail)
        .single();

    if (error) {
        console.error("❌ ERROR:", error);
    } else {
        console.log("✅ SUCCESS:", data);
    }
}

check();
