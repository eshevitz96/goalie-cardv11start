const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Key. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchema() {
    console.log("Attempting to fix schema...");

    // We can't run DDL via standard client. We typically need the SQL editor or migration.
    // HOWEVER, we can stick to 'editing' the profile if the column exists. 
    // If the column doesn't exist, the UPDATE fails.
    // Since I effectively cannot run DDL without a specific tool, 
    // I will fallback to: telling the user OR using a specialized RPC function if one exists.

    // Let's try to just 'select' to confirm it's missing first.
    const { data, error } = await supabase.from('roster_uploads').select('updated_at').limit(1);

    if (error) {
        console.error("Column likely missing or other error:", error.message);
        // If we assume it is missing, we need to instruct user or use a workaround.
        // Workaround: Use 'metadata' jsonb column if it exists? 
        // No, code expects 'updated_at'.

        console.log("\n!!! CRITICAL !!!");
        console.log("Please run the following SQL in your Supabase SQL Editor:");
        console.log(`
      ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE roster_uploads ADD COLUMN IF NOT EXISTS birthday DATE;
    `);
    } else {
        console.log("Column 'updated_at' exists.");
    }
}

fixSchema();
