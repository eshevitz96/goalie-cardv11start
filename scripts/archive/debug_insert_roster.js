
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
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
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Attempting to insert test row via Service Key...");
    const { data, error } = await supabase.from('roster_uploads').insert({
        email: 'script_test@example.com',
        goalie_name: 'Script Test Goalie',
        assigned_unique_id: 'GC-SCRIPT-001',
        is_claimed: false,
        created_at: new Date().toISOString()
    }).select();

    if (error) {
        console.error("Insert Failed:", error);
    } else {
        console.log("Insert Success:", data);
    }
}

run();
