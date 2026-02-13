require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Attempting to add 'pricing_config' column via RPC exec_sql...");

    const sql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pricing_config jsonb DEFAULT '{}';`;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("RPC Failed:", error);
        // Fallback: Check if there's any other way or just log
    } else {
        console.log("RPC Success:", data);
        console.log("Column 'pricing_config' should be added.");
    }
}

run();
