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

async function checkAllGoalies() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('goalie_name, assigned_unique_id, email');

    if (error) {
        console.error("DB Error:", error.message);
        return;
    }

    console.log("All Goalies in DB:");
    console.table(data);
}

checkAllGoalies();
