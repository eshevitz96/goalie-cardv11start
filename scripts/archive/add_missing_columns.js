require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sql = `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reflections' AND column_name='soreness') THEN
                ALTER TABLE reflections ADD COLUMN soreness INTEGER DEFAULT 0;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reflections' AND column_name='sleep_quality') THEN
                ALTER TABLE reflections ADD COLUMN sleep_quality INTEGER DEFAULT 0;
            END IF;
        END $$;
    `;

    console.log("Adding missing columns 'soreness' and 'sleep_quality' to 'reflections' table...");
    
    // Using the exec_sql RPC found in the codebase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // If 'exec_sql' doesn't exist or fails, it might be named differently
        console.error("RPC Error:", error.message);
        console.log("Retrying with 'query' parameter name...");
        const { error: err2 } = await supabase.rpc('exec_sql', { query: sql });
        if (err2) {
            console.error("RPC Error (Retry):", err2.message);
            console.log("Please run the following SQL manually in your Supabase SQL Editor:");
            console.log(sql);
        } else {
            console.log("Success (via retry)!");
        }
    } else {
        console.log("Success!");
    }
}

run();
