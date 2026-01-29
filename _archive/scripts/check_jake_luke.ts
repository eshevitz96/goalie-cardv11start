import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecifics() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('goalie_name, assigned_unique_id, email, raw_data')
        .ilike('goalie_name', '%Jake%')

    const { data: data2, error: error2 } = await supabase
        .from('roster_uploads')
        .select('goalie_name, assigned_unique_id, email, raw_data')
        .ilike('goalie_name', '%Luke%')

    if (data) {
        console.log("Jake matches:");
        console.table(data);
    }
    if (data2) {
        console.log("Luke matches:");
        console.table(data2);
    }
}

checkSpecifics();
