
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

// Use Anon Key to simulate frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAccess() {
    console.log("Testing Anon Access for GC-9002...");

    const { data, error } = await supabase
        .from('roster_uploads')
        .select('*')
        .eq('assigned_unique_id', 'GC-9002');

    if (error) {
        console.error("❌ Error fetching:", error.message);
    } else if (!data || data.length === 0) {
        console.error("❌ No data returned (Likely RLS Blocking)");
    } else {
        console.log("✅ Data found:", data[0].goalie_name);
    }
}

testAnonAccess();
