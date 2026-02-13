
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log("Checking coach_availability table...");
    const { data, error } = await supabase
        .from('coach_availability')
        .select('count')
        .limit(1);

    if (error) {
        console.error("Table Check Failed:", error.message);
        if (error.code === '42P01') {
            console.log("Table does not exist (42P01).");
        }
    } else {
        console.log("Table exists and is accessible.");
    }
}

checkTable();
