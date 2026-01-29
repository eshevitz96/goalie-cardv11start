import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLuke() {
    const { data, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('assigned_unique_id', 'GC-8588')
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Luke Grasso Data:", data);
    }
}

checkLuke();
