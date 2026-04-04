
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Ideally use SERVICE_ROLE_KEY if you have it for deletions, but ANON might work if policies allow own-delete, 
// OR simpler: we encourage user to use Dashboard if this fails.
// Let's assume we want to use the SERVICE_ROLE_KEY if available for a true wipe, but usually users only have ANON in .env.local per standard setup.
// We will try with available keys.

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Keys in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearRoster() {
    console.log("⚠️ Attempting to clear/reset roster uploads...");
    console.log("This will reset 'is_claimed' to false and clear 'raw_data' setup fields.");

    // Strategy 1: Update all to unclaimed (safer than delete if we want to keep slots)
    // Or Delete if we are re-seeding. 
    // User asked "what can i remove... to help clear this up".

    // Let's try to fetch all first.
    const { data: rosters, error: fetchError } = await supabase.from('roster_uploads').select('id, email');

    if (fetchError) {
        console.error("Error fetching roster:", fetchError.message);
        return;
    }

    console.log(`Found ${rosters.length} records.`);

    // Resetting
    for (const r of rosters) {
        const { error } = await supabase.from('roster_uploads').update({
            is_claimed: false,
            setup_complete: false,
            raw_data: {} // Clear activation data
        }).eq('id', r.id);

        if (error) {
            console.error(`Failed to reset ${r.email}:`, error.message);
        } else {
            console.log(`Reset ${r.email}`);
        }
    }

    console.log("Done.");
}

clearRoster();
