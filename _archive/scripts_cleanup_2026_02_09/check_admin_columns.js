
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Attempt to select specific new columns to see if they exist
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('height, weight, catch_hand, birthday')
        .limit(1);

    if (error) {
        console.error("Schema Check Failed:", error.message);
        console.error("Details:", error);
    } else {
        console.log("Columns exist and are accessible.");
        console.log("Sample Data:", data);
    }
}

checkSchema();
