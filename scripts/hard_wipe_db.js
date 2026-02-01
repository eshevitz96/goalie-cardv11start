
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

async function hardWipe() {
    console.log("⚠️ STARTING HARD WIPE OF TEST DATA ⚠️");

    // 1. Delete Sessions (FK constraint usually requires this first)
    const { error: sError, count: sCount } = await supabase
        .from('sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (hack to select all)

    if (sError) console.error("Error deleting sessions:", sError);
    else console.log(`Deleted sessions.`);

    // 2. Delete Roster Uploads
    const { error: rError, count: rCount } = await supabase
        .from('roster_uploads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (rError) console.error("Error deleting roster:", rError);
    else console.log(`Deleted roster uploads.`);

    console.log("✅ Database Wiped. Admin View should now be empty.");
}

hardWipe();
