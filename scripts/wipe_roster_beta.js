
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    console.log("URL:", supabaseUrl ? "Set" : "Missing");
    console.log("Key:", supabaseKey ? "Set" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeRoster() {
    console.log("WARNING: Wiping 'roster_uploads' table for Beta Reset...");

    // 1. Delete all Roster Uploads
    const { error } = await supabase
        .from('roster_uploads')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq a dummy UUID)

    if (error) {
        console.error("Error wiping roster:", error);
    } else {
        console.log("Roster Wiped Successfully.");

        // 2. Also clear Sessions linked to them? 
        // Usually cascade deletes handle this, but for safety lets check.
        // Given the requirement "nothing in system other than operations", clearing sessions is good.
        const { error: sessError } = await supabase
            .from('sessions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (sessError) console.error("Error wiping sessions:", sessError);
        else console.log("Sessions Wiped Successfully.");
    }
}

wipeRoster();
