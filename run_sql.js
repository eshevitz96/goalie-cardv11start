const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSql() {
    console.log("Attempting to add digital_signature column via exec_sql RPC...");
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE public.private_training_submissions ADD COLUMN IF NOT EXISTS digital_signature TEXT;`
    });

    if (error) {
        console.error("exec_sql failed:", error.message);
        console.error("Full error:", error);
    } else {
        console.log("Success! Returned data:", data);
    }
}

runSql();
