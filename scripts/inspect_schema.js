require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const tableName = process.argv[2] || 'profiles';
    console.log(`Inspecting '${tableName}' table columns...`);

    // Fallback: just try to select * limit 1 and see keys, or error
    const { data: rows, error: selError } = await supabase.from(tableName).select('*').limit(1);

    if (selError) {
        console.error("Select Error:", selError);
    } else if (rows && rows.length > 0) {
        console.log("Columns found in a row:", Object.keys(rows[0]));
    } else {
        console.log("No rows found. Attempting to insert dummy to infer schema (and rollback)...");
        // Actually, we can just try to select a specific column and see if it errors?
        // Let's try to select 'access_pin' specifically if we are looking for it.
        const { error: colError } = await supabase.from(tableName).select('access_pin').limit(1);
        if (colError) {
            console.log("Check for 'access_pin':", colError.message);
        } else {
            console.log("'access_pin' column EXISTS.");
        }
    }
}

run();
