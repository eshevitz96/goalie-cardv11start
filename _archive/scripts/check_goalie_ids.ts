import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // We might need the service role key if RLS blocks us, but let's try anon first or reliance on local env.

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

    // We'll search by name (partial or exact)
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('goalie_name, assigned_unique_id, email, parent_name, parent_email, team, sport')
        .in('goalie_name', names);

    if (error) {
        // If exact match fails, try fetching all and filtering in JS (fallback)
        console.error("Error fetching specific names, fetching all to search...", error.message);
        const { data: allData, error: allError } = await supabase
            .from('roster_uploads')
            .select('goalie_name, assigned_unique_id, email, parent_name, parent_email, team, sport');

        if (allError) {
            console.error("Critical DB Error:", allError.message);
            return;
        }

        const found = allData.filter(r => names.some(n => r.goalie_name.includes(n) || n.includes(r.goalie_name)));
        console.table(found);
    } else {
        if (data && data.length > 0) {
            console.table(data);
        } else {
            console.log("No exact matches found. Fetching all to fuzzy search...");
            const { data: allData, error: allError } = await supabase
                .from('roster_uploads')
                .select('goalie_name, assigned_unique_id, email, parent_name, parent_email, team, sport');

            if (allData) {
                const found = allData.filter(r => names.some(n => r.goalie_name.toLowerCase().includes(n.toLowerCase())));
                console.table(found);
            }
        }
    }
}

checkGoalies();
