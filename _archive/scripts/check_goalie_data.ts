import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoalies() {
    const names = [
        'Gabe Stone',
        'Madelyn Evans',
        'Jake Dewey',
        'Luke Grasso'
    ];

    console.log("Checking for goalies:", names);

    // Removed 'sport' and 'parent_email'
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('id, goalie_name, assigned_unique_id, email, parent_name, team, raw_data, is_claimed');

    if (error) {
        console.error("DB Error:", error.message);
        return;
    }

    if (!data) {
        console.log("No data found.");
        return;
    }

    const found = data.filter(r => names.some(n => r.goalie_name && r.goalie_name.toLowerCase().includes(n.toLowerCase().split(' ')[0])));

    if (found.length === 0) {
        console.log("No matching goalies found.");
    } else {
        console.log(`Found ${found.length} records.`);
        found.forEach(g => {
            console.log("------------------------------------------------");
            console.log(`Name: ${g.goalie_name}`);
            console.log(`ID: ${g.assigned_unique_id}`);
            console.log(`Email (Link): ${g.email}`);
            console.log(`Parent Name: ${g.parent_name}`);
            // Check raw_data for parent email hints
            if (g.raw_data) {
                console.log(`Raw Data:`, JSON.stringify(g.raw_data));
            }
            console.log(`Claimed: ${g.is_claimed}`);
        });
    }
}

checkGoalies();
