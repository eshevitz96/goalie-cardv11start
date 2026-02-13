
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserData() {
    console.log("--- Debugging Roster Data ---\n");

    // 1. List recent roster entries
    const { data: recentRosters, error: rosterError } = await supabase
        .from('roster_uploads')
        .select('id, email, goalie_name, assigned_unique_id')
        .order('created_at', { ascending: false })
        .limit(10);

    if (rosterError) {
        console.error("Error fetching roster:", rosterError.message);
    } else {
        console.log("Recent Roster Entries:");
        console.table(recentRosters);
    }

    // 2. Search for Elliott
    const { data: elliottData, error: searchError } = await supabase
        .from('roster_uploads')
        .select('id, email, goalie_name, assigned_unique_id')
        .ilike('email', '%elliott%');

    if (searchError) {
        console.error("Error searching for Elliott:", searchError.message);
    } else {
        console.log("\nEntries for 'Elliott':");
        console.table(elliottData);
    }
}

debugUserData();
