import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDewey() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('goalie_name, assigned_unique_id, email, raw_data')
        .ilike('goalie_name', '%Dewey%')

    if (data) {
        console.log("Dewey matches:");
        console.table(data);
    }
}

checkDewey();
