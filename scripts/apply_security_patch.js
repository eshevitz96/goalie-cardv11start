require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Applying Security Patch...");

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../security_patch_v1.sql');
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute via RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error("Patch Failed:", error);
            console.log("\nIf the error is 'function exec_sql not found', please run the SQL manually in the dashboard.");
        } else {
            console.log("Patch Applied Successfully!");
        }
    } catch (err) {
        console.error("Script Error:", err);
    }
}

run();
